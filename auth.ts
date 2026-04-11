import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import authConfig from "@/auth.config";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { loginFormSchema } from "@/lib/validations/auth";

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, request) {
        const parsedCredentials = loginFormSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          throw new InvalidCredentialsError();
        }

        const { email, password } = parsedCredentials.data;
        const user = await prisma.user.findUnique({
          where: { email },
        });

        const ip =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request.headers.get("x-real-ip") ??
          undefined;
        const userAgent = request.headers.get("user-agent") ?? undefined;

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
