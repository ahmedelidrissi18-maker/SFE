"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
import { logAuditEvent } from "@/lib/audit";

export type LoginActionState = {
  error?: string;
};

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      error: "Veuillez renseigner votre email et votre mot de passe.",
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error:
          error.type === "CredentialsSignin"
            ? "Identifiants invalides. Merci de verifier vos informations."
            : "Connexion impossible pour le moment. Merci de reessayer.",
      };
    }

    throw error;
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const session = await auth();

  if (session?.user?.id) {
    await logAuditEvent({
      userId: session.user.id,
      action: "AUTH_LOGOUT",
      entite: "AUTH",
      entiteId: session.user.id,
      nouvelleValeur: {
        email: session.user.email,
        role: session.user.role,
      },
    });
  }

  await signOut({
    redirectTo: "/login",
  });
}
