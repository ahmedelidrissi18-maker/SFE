"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
import { logAuditEvent } from "@/lib/audit";
import { loginFormSchema } from "@/lib/validations/auth";

export type LoginActionState = {
  error?: string;
};

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsedData = loginFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsedData.success) {
    return {
      error: parsedData.error.issues[0]?.message ?? "Veuillez verifier vos identifiants.",
    };
  }

  const { email, password } = parsedData.data;

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
