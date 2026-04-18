import type { NextAuthConfig } from "next-auth";

const authConfig = {
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
  providers: [],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
    updateAge: 60 * 60,
  },
  jwt: {
    maxAge: 60 * 60 * 8,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.nom = user.nom;
        token.prenom = user.prenom;
        token.name = user.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "RH" | "ENCADRANT" | "STAGIAIRE";
        session.user.nom = token.nom as string;
        session.user.prenom = token.prenom as string;
        session.user.name = (token.name as string) || [token.prenom, token.nom].filter(Boolean).join(" ");
      }

      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
