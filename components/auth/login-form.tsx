"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginActionState } from "@/app/login/actions";
import { FeedbackBanner } from "@/components/ui/feedback-banner";

const initialState: LoginActionState = {};
const fieldClassName =
  "w-full rounded-[22px] border border-border bg-linear-to-b from-background to-card px-4 py-3.5 text-sm outline-none transition focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";
const hintClassName = "text-xs leading-5 text-muted";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-[22px] bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_22px_42px_-28px_rgba(15,118,110,0.72)] transition hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Connexion en cours..." : "Se connecter"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div className="space-y-2 rounded-[24px] border border-border/80 bg-linear-to-br from-card to-surface p-4 shadow-[var(--shadow-soft)] sm:p-5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.email}
          placeholder="nom@organisation.ma"
          className={fieldClassName}
          required
        />
        <p className={hintClassName}>Utilisez l adresse rattachee a votre compte interne.</p>
      </div>

      <div className="space-y-2 rounded-[24px] border border-border/80 bg-linear-to-br from-card to-surface p-4 shadow-[var(--shadow-soft)] sm:p-5">
        <label htmlFor="password" className="text-sm font-medium">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="********"
          className={fieldClassName}
          required
        />
        <p className={hintClassName}>Saisissez le mot de passe associe a ce compte.</p>
      </div>

      <div className="space-y-2 rounded-[24px] border border-border/80 bg-linear-to-br from-card to-surface p-4 shadow-[var(--shadow-soft)] sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="twoFactorCode" className="text-sm font-medium">
            Code 2FA
          </label>
          <span className="text-xs text-muted">Requis pour `ADMIN` et `RH` si active</span>
        </div>
        <input
          id="twoFactorCode"
          name="twoFactorCode"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="123456"
          className={fieldClassName}
          required={state.requiresTwoFactor}
        />
        <p className={hintClassName}>
          Renseignez ce champ uniquement si votre compte demande une verification en deux etapes.
        </p>
        {state.requiresTwoFactor ? (
          <FeedbackBanner
            kind="info"
            title="Code 2FA attendu"
            message="Le compte detecte demande une verification en deux etapes."
            description="Ouvrez votre application d authentification puis saisissez le code temporaire a 6 chiffres."
          />
        ) : null}
      </div>

      {state.error ? (
        <FeedbackBanner
          kind="error"
          title="Connexion impossible"
          message={state.error}
          description="Verifiez vos identifiants, puis reessayez. Si le compte demande un code 2FA, pensez a le renseigner avant de valider."
        />
      ) : null}

      <div className="rounded-[24px] border border-border/80 bg-linear-to-br from-card to-surface p-4 shadow-[var(--shadow-soft)] sm:p-5">
        <SubmitButton />
      </div>
    </form>
  );
}
