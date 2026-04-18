"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
import { logAuditEvent } from "@/lib/audit";
import { loginFormSchema } from "@/lib/validations/auth";

export type LoginActionState = {
  error?: string;
  email?: string;
  requiresTwoFactor?: boolean;
};

function getCredentialsErrorCode(error: AuthError) {
  if (error.type !== "CredentialsSignin") {
    return null;
  }

  const code = (error as AuthError & { code?: string }).code;
  return typeof code === "string" ? code : null;
}

function getLoginErrorMessage(code: string | null) {
  switch (code) {
    case "two_factor_required":
      return "Un code 2FA est requis pour ce compte. Ouvrez votre application d authentification et saisissez le code a 6 chiffres.";
    case "two_factor_invalid":
      return "Le code 2FA est invalide ou a expire. Merci de reessayer avec un code recent.";
    case "rate_limited":
      return "Trop de tentatives ont ete detectees. Merci d attendre quelques minutes avant de reessayer.";
    default:
      return "Identifiants invalides. Merci de verifier vos informations.";
  }
}

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

  const { email, password, twoFactorCode } = parsedData.data;

  try {
    await signIn("credentials", {
      email,
      password,
      twoFactorCode,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const errorCode = getCredentialsErrorCode(error);
      return {
        email,
        requiresTwoFactor:
          errorCode === "two_factor_required" || errorCode === "two_factor_invalid",
        error:
          error.type === "CredentialsSignin"
            ? getLoginErrorMessage(errorCode)
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
