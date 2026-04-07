import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "ADMIN" | "RH" | "ENCADRANT" | "STAGIAIRE";
      nom: string;
      prenom: string;
    };
  }

  interface User {
    role: "ADMIN" | "RH" | "ENCADRANT" | "STAGIAIRE";
    nom: string;
    prenom: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "ADMIN" | "RH" | "ENCADRANT" | "STAGIAIRE";
    nom?: string;
    prenom?: string;
  }
}
