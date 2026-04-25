"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  loginAction,
  loginWithGithubAction,
  loginWithGoogleAction,
  type LoginActionState,
} from "@/app/login/actions";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { MaterialSymbol } from "@/components/ui/material-symbol";

const initialState: LoginActionState = {};
const fieldClassName =
  "field-shell h-12 w-full rounded-lg pl-12 pr-4 text-sm text-on-surface outline-none transition placeholder:text-outline-variant";
const hintClassName = "text-xs leading-5 text-on-surface-variant";
const oauthButtonClassName =
  "flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface-container-low px-4 text-sm font-semibold text-on-surface transition hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70";

type LoginFormProps = {
  oauthProviders?: {
    google: boolean;
    github: boolean;
  };
  oauthErrorMessage?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="signature-gradient flex h-12 w-full items-center justify-center gap-2 rounded-lg px-4 py-3.5 text-sm font-semibold text-on-primary shadow-[var(--shadow-ambient)] transition hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <span>{pending ? "Connexion en cours..." : "Se connecter"}</span>
      <MaterialSymbol icon="arrow_forward" className="text-[18px]" />
    </button>
  );
}

function OAuthProviderMark({ provider }: { provider: "google" | "github" }) {
  return (
    <span
      className={
        provider === "google"
          ? "flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-[#4285F4] shadow-[var(--shadow-soft)]"
          : "flex h-8 w-8 items-center justify-center rounded-full bg-[#24292F] text-xs font-bold text-white shadow-[var(--shadow-soft)]"
      }
      aria-hidden="true"
    >
      {provider === "google" ? "G" : "GH"}
    </span>
  );
}

function OAuthSubmitButton({
  provider,
  label,
}: {
  provider: "google" | "github";
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={oauthButtonClassName}>
      <OAuthProviderMark provider={provider} />
      <span>{pending ? "Redirection..." : label}</span>
    </button>
  );
}

export function LoginForm({
  oauthProviders = { google: false, github: false },
  oauthErrorMessage,
}: LoginFormProps) {
  const [state, formAction] = useActionState(loginAction, initialState);
  const hasOAuthProviders = oauthProviders.google || oauthProviders.github;

  return (
    <div className="mt-8 space-y-6">
      {oauthErrorMessage ? (
        <FeedbackBanner
          kind="error"
          title="Connexion externe impossible"
          message={oauthErrorMessage}
          description="Utilisez vos identifiants internes si le probleme persiste ou contactez un administrateur pour verifier la configuration OAuth."
        />
      ) : null}

      {hasOAuthProviders ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {oauthProviders.google ? (
              <form action={loginWithGoogleAction}>
                <OAuthSubmitButton
                  provider="google"
                  label="Continuer avec Google"
                />
              </form>
            ) : null}

            {oauthProviders.github ? (
              <form action={loginWithGithubAction}>
                <OAuthSubmitButton
                  provider="github"
                  label="Continuer avec GitHub"
                />
              </form>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <div className="soft-rule flex-1" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
              ou avec vos identifiants
            </span>
            <div className="soft-rule flex-1" />
          </div>
        </>
      ) : null}

      <form action={formAction} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="ml-1 block text-[13px] font-medium text-on-surface-variant">
            Adresse e-mail
          </label>
          <div className="relative">
            <MaterialSymbol
              icon="mail"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
            />
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
          </div>
          <p className={hintClassName}>Utilisez l adresse rattachee a votre compte interne.</p>
        </div>

        <div className="space-y-2">
          <div className="ml-1 flex items-center justify-between gap-3">
            <label htmlFor="password" className="block text-[13px] font-medium text-on-surface-variant">
              Mot de passe
            </label>
            <span className="text-[13px] font-medium text-primary">Oublie ?</span>
          </div>
          <div className="relative">
            <MaterialSymbol
              icon="lock"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
            />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Mot de passe"
              className={fieldClassName}
              required
            />
          </div>
          <p className={hintClassName}>Saisissez le mot de passe associe a ce compte.</p>
        </div>

        {state.requiresTwoFactor ? (
          <div className="space-y-2 pt-2">
            <div className="mb-6 soft-rule" />
            <label htmlFor="twoFactorCode" className="ml-1 block text-[13px] font-medium text-on-surface-variant">
              Code de double authentification (2FA)
            </label>
            <input
              id="twoFactorCode"
              name="twoFactorCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              className="field-shell h-12 w-full rounded-lg px-4 text-center font-mono tracking-[0.35em] text-on-surface outline-none transition"
              required
            />
            <p className={hintClassName}>
              Entrez le code genere par votre application d authentification.
            </p>
            <FeedbackBanner
              kind="info"
              title="Code 2FA attendu"
              message="Le compte detecte demande une verification en deux etapes."
              description="Ouvrez votre application d authentification puis saisissez le code temporaire a 6 chiffres."
            />
          </div>
        ) : (
          <div className="rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
            Le champ 2FA s affichera uniquement si votre compte demande une verification en deux etapes.
          </div>
        )}

        {state.error ? (
          <FeedbackBanner
            kind="error"
            title="Connexion impossible"
            message={state.error}
            description="Verifiez vos identifiants, puis reessayez. Si le compte demande un code 2FA, pensez a le renseigner avant de valider."
          />
        ) : null}

        <div className="pt-2">
          <SubmitButton />
        </div>

        <div className="pt-6 text-center">
          <div className="soft-rule mb-6" />
          <p className="text-[13px] text-on-surface-variant">
            Nouveau sur la plateforme ?
            <span className="ml-1 font-semibold text-primary">Contactez votre administrateur</span>
          </p>
        </div>
      </form>
    </div>
  );
}
