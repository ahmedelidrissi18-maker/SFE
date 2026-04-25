import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import type { Session } from "next-auth";
import type { AppProviders } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import type { Role } from "@prisma/client";
import type { JWT } from "next-auth/jwt";
import authConfig from "@/auth.config";
import { getConfiguredLoginProviders } from "@/lib/auth-providers";
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

type AuthUserRecord = {
  id: string;
  email: string;
  role: Role;
  nom: string;
  prenom: string;
  isActive: boolean;
};

const configuredOAuthProviders = getConfiguredLoginProviders();
const oauthProviders: AppProviders = [];

if (configuredOAuthProviders.google) {
  oauthProviders.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID!.trim(),
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET!.trim(),
    }),
  );
}

if (configuredOAuthProviders.github) {
  oauthProviders.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_CLIENT_ID!.trim(),
      clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET!.trim(),
    }),
  );
}

function buildOAuthErrorRedirect(code: string) {
  return `/login?error=${encodeURIComponent(code)}`;
}

function hydrateTokenFromUser(
  token: JWT,
  user?: {
    id?: string;
    role?: Role;
    nom?: string;
    prenom?: string;
    name?: string | null;
    email?: string | null;
  } | null,
) {
  if (user?.id) {
    token.id = user.id;
  }

  if (user?.role) {
    token.role = user.role;
  }

  if (user?.nom) {
    token.nom = user.nom;
  }

  if (user?.prenom) {
    token.prenom = user.prenom;
  }

  if (user?.name) {
    token.name = user.name;
  }

  if (user?.email) {
    token.email = user.email;
  }

  return token;
}

function hydrateSessionFromToken(session: {
  user?: Session["user"];
} & Session, token: JWT) {
  if (session.user) {
    session.user.id = token.id as string;
    session.user.role = token.role as "ADMIN" | "RH" | "ENCADRANT" | "STAGIAIRE";
    session.user.nom = token.nom as string;
    session.user.prenom = token.prenom as string;
    session.user.name =
      (token.name as string) || [token.prenom, token.nom].filter(Boolean).join(" ");
  }

  return session;
}

async function findOAuthUserByEmail(email: string) {
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
      nom: true,
      prenom: true,
      isActive: true,
    },
  }) as Promise<AuthUserRecord | null>;
}

function applyOAuthUserRecord(user: {
  id?: string;
  email?: string | null;
  role?: Role;
  nom?: string;
  prenom?: string;
  name?: string | null;
}, existingUser: AuthUserRecord) {
  user.id = existingUser.id;
  user.email = existingUser.email;
  user.role = existingUser.role;
  user.nom = existingUser.nom;
  user.prenom = existingUser.prenom;
  user.name = `${existingUser.prenom} ${existingUser.nom}`.trim();

  return user;
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
    ...oauthProviders,
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || account.provider === "credentials") {
        return true;
      }

      const email = user.email?.trim();

      if (!email) {
        return buildOAuthErrorRedirect("oauth_email_missing");
      }

      if (
        account.provider === "google" &&
        (profile as { email_verified?: boolean } | undefined)?.email_verified === false
      ) {
        return buildOAuthErrorRedirect("oauth_email_not_verified");
      }

      const existingUser = await findOAuthUserByEmail(email);

      if (!existingUser) {
        return buildOAuthErrorRedirect("oauth_account_not_allowed");
      }

      if (!existingUser.isActive) {
        await logAuditEvent({
          userId: existingUser.id,
          action: "AUTH_LOGIN_FAILED",
          entite: "AUTH",
          entiteId: existingUser.id,
          nouvelleValeur: {
            email: existingUser.email,
            provider: account.provider,
            reason: "inactive_user",
            oauth: true,
          },
        });

        return buildOAuthErrorRedirect("oauth_account_not_allowed");
      }

      if (isSensitiveTwoFactorRole(existingUser.role)) {
        await logAuditEvent({
          userId: existingUser.id,
          action: "AUTH_LOGIN_BLOCKED",
          entite: "AUTH",
          entiteId: existingUser.id,
          nouvelleValeur: {
            email: existingUser.email,
            role: existingUser.role,
            provider: account.provider,
            reason: "sensitive_role_requires_credentials",
            oauth: true,
          },
        });

        return buildOAuthErrorRedirect("oauth_sensitive_role_blocked");
      }

      applyOAuthUserRecord(user, existingUser);

      await logAuditEvent({
        userId: existingUser.id,
        action: "AUTH_LOGIN_SUCCESS",
        entite: "AUTH",
        entiteId: existingUser.id,
        nouvelleValeur: {
          email: existingUser.email,
          role: existingUser.role,
          provider: account.provider,
          oauth: true,
          twoFactorVerified: false,
        },
      });

      return true;
    },
    async jwt({ token, user, account }) {
      hydrateTokenFromUser(token, user);

      if (
        account &&
        account.provider !== "credentials" &&
        (!token.id || !token.role)
      ) {
        const oauthEmail =
          user?.email ?? (typeof token.email === "string" ? token.email : null);

        if (oauthEmail) {
          const existingUser = await findOAuthUserByEmail(oauthEmail);

          if (existingUser && existingUser.isActive && !isSensitiveTwoFactorRole(existingUser.role)) {
            hydrateTokenFromUser(token, {
              id: existingUser.id,
              email: existingUser.email,
              role: existingUser.role,
              nom: existingUser.nom,
              prenom: existingUser.prenom,
              name: `${existingUser.prenom} ${existingUser.nom}`.trim(),
            });
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      return hydrateSessionFromToken(session, token);
    },
  },
});
