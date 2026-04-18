import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import authConfig from "@/auth.config";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { extractRequestIp, extractUserAgent } from "@/lib/security/request";
import {
  consumeRateLimit,
  resetRateLimit,
  securityRateLimits,
} from "@/lib/security/rate-limit";
import {
  decryptTwoFactorSecret,
  isSensitiveTwoFactorRole,
  verifyTwoFactorCode,
} from "@/lib/security/two-factor";
import { loginFormSchema } from "@/lib/validations/auth";

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

class TwoFactorRequiredError extends CredentialsSignin {
  code = "two_factor_required";
}

class TwoFactorInvalidError extends CredentialsSignin {
  code = "two_factor_invalid";
}

class RateLimitedSignInError extends CredentialsSignin {
  code = "rate_limited";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
        twoFactorCode: { label: "Code 2FA", type: "text" },
      },
      async authorize(credentials, request) {
        const parsedCredentials = loginFormSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          throw new InvalidCredentialsError();
        }

        const { email, password, twoFactorCode } = parsedCredentials.data;
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            role: true,
            nom: true,
            prenom: true,
            isActive: true,
            passwordHash: true,
            twoFactorEnabled: true,
            twoFactorSecret: true,
          },
        });
        const ip = extractRequestIp(request) ?? undefined;
        const userAgent = extractUserAgent(request) ?? undefined;
        const loginIpBucket = consumeRateLimit({
          ...securityRateLimits.authLoginIp,
          key: ip ?? "unknown",
        });
        const loginIdentityBucket = consumeRateLimit({
          ...securityRateLimits.authLoginIdentity,
          key: email,
        });

        if (!loginIpBucket.allowed || !loginIdentityBucket.allowed) {
          if (user) {
            await logAuditEvent({
              userId: user.id,
              action: "AUTH_LOGIN_BLOCKED",
              entite: "AUTH",
              entiteId: user.id,
              ip,
              userAgent,
              nouvelleValeur: {
                email,
                reason: "rate_limited",
              },
            });
          }

          throw new RateLimitedSignInError();
        }

        if (!user || !user.passwordHash || !user.isActive) {
          if (user) {
            await logAuditEvent({
              userId: user.id,
              action: "AUTH_LOGIN_FAILED",
              entite: "AUTH",
              entiteId: user.id,
              ip,
              userAgent,
              nouvelleValeur: {
                email,
                reason: user.isActive ? "invalid_credentials" : "inactive_user",
              },
            });
          }

          throw new InvalidCredentialsError();
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatches) {
          await logAuditEvent({
            userId: user.id,
            action: "AUTH_LOGIN_FAILED",
            entite: "AUTH",
            entiteId: user.id,
            ip,
            userAgent,
            nouvelleValeur: {
              email,
              reason: "invalid_credentials",
            },
          });

          throw new InvalidCredentialsError();
        }

        if (isSensitiveTwoFactorRole(user.role) && user.twoFactorEnabled) {
          const decryptedSecret = decryptTwoFactorSecret(user.twoFactorSecret);

          if (!decryptedSecret) {
            await logAuditEvent({
              userId: user.id,
              action: "AUTH_LOGIN_FAILED",
              entite: "AUTH",
              entiteId: user.id,
              ip,
              userAgent,
              nouvelleValeur: {
                email,
                reason: "two_factor_secret_missing",
              },
            });

            throw new TwoFactorInvalidError();
          }

          const isValidTwoFactorCode = verifyTwoFactorCode(
            decryptedSecret,
            twoFactorCode,
          );

          if (!isValidTwoFactorCode) {
            await logAuditEvent({
              userId: user.id,
              action: "AUTH_LOGIN_FAILED",
              entite: "AUTH",
              entiteId: user.id,
              ip,
              userAgent,
              nouvelleValeur: {
                email,
                reason: twoFactorCode ? "two_factor_invalid" : "two_factor_required",
              },
            });

            if (!twoFactorCode) {
              throw new TwoFactorRequiredError();
            }

            throw new TwoFactorInvalidError();
          }
        }

        resetRateLimit({
          namespace: securityRateLimits.authLoginIp.namespace,
          key: ip ?? "unknown",
        });
        resetRateLimit({
          namespace: securityRateLimits.authLoginIdentity.namespace,
          key: email,
        });

        await logAuditEvent({
          userId: user.id,
          action: "AUTH_LOGIN_SUCCESS",
          entite: "AUTH",
          entiteId: user.id,
          ip,
          userAgent,
          nouvelleValeur: {
            email,
            role: user.role,
            twoFactorVerified: isSensitiveTwoFactorRole(user.role) && user.twoFactorEnabled,
          },
        });

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          nom: user.nom,
          prenom: user.prenom,
          name: `${user.prenom} ${user.nom}`.trim(),
        };
      },
    }),
  ],
});
