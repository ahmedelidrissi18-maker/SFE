"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { StagiaireActionState } from "@/app/(dashboard)/stagiaires/actions";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import type { StagiaireFormValues } from "@/lib/validations/stagiaire";

type StagiaireFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  action: (
    state: StagiaireActionState,
    formData: FormData,
  ) => Promise<StagiaireActionState>;
  defaultValues?: Partial<StagiaireFormValues>;
  showCredentialsHint?: boolean;
  credentialsHint?: string;
  cancelHref?: string;
};

const initialState: StagiaireActionState = {};
const fieldClassName =
  "field-shell w-full rounded-2xl px-4 py-3 outline-none transition";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="action-button action-button-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Enregistrement..." : label}
    </button>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required = false,
  hint,
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="space-y-2 text-sm">
      <span className="font-medium">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={fieldClassName}
      />
      {hint ? <p className="text-xs leading-5 text-muted">{hint}</p> : null}
    </label>
  );
}

export function StagiaireForm({
  title,
  description,
  submitLabel,
  action,
  defaultValues,
  showCredentialsHint = false,
  credentialsHint,
  cancelHref = "/stagiaires",
}: StagiaireFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">Formulaire</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted sm:text-[15px]">{description}</p>
      </div>

      <form
        action={formAction}
        className="form-shell space-y-8 rounded-[32px] p-6 sm:p-8"
      >
        <input type="hidden" name="stagiaireId" value={defaultValues?.stagiaireId ?? ""} />
        <input type="hidden" name="userId" value={defaultValues?.userId ?? ""} />

        <section className="space-y-2">
          <p className="text-sm font-medium text-primary">Identite et acces</p>
          <p className="text-sm leading-6 text-muted">
            Renseignez les informations de compte et d identification utiles pour le suivi.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Field label="Nom" name="nom" defaultValue={defaultValues?.nom} required autoComplete="family-name" />
          <Field
            label="Prenom"
            name="prenom"
            defaultValue={defaultValues?.prenom}
            required
            autoComplete="given-name"
          />
          <Field
            label="Email"
            name="email"
            type="email"
            defaultValue={defaultValues?.email}
            required
            autoComplete="email"
            placeholder="prenom.nom@organisation.ma"
            hint="Cet email servira au compte de connexion du stagiaire."
          />
          <Field
            label="CIN"
            name="cin"
            defaultValue={defaultValues?.cin}
            required
            hint="Utilisez l identifiant officiel du stagiaire pour fiabiliser le dossier."
          />
          <Field
            label="Telephone"
            name="telephone"
            defaultValue={defaultValues?.telephone}
            autoComplete="tel"
            placeholder="+212 ..."
          />
          <Field
            label="Date de naissance"
            name="dateNaissance"
            type="date"
            defaultValue={defaultValues?.dateNaissance}
          />
        </section>

        <section className="space-y-2">
          <p className="text-sm font-medium text-primary">Parcours</p>
          <p className="text-sm leading-6 text-muted">
            Ces informations facilitent le tri des stagiaires et la lecture des fiches.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Field
            label="Etablissement"
            name="etablissement"
            defaultValue={defaultValues?.etablissement}
            placeholder="ENSA, EMI, FST..."
          />
          <Field
            label="Specialite"
            name="specialite"
            defaultValue={defaultValues?.specialite}
            placeholder="Data, reseaux, genie logiciel..."
          />
          <Field label="Niveau" name="niveau" defaultValue={defaultValues?.niveau} placeholder="Licence, Master..." />
          <Field
            label="Annee universitaire"
            name="annee"
            defaultValue={defaultValues?.annee}
            placeholder="2025-2026"
          />
        </section>

        <section className="space-y-2">
          <p className="text-sm font-medium text-primary">Visuel</p>
        </section>

        <section className="grid gap-4">
          <Field
            label="Photo URL"
            name="photoUrl"
            type="url"
            defaultValue={defaultValues?.photoUrl}
            placeholder="https://..."
            hint="Optionnel. Utilisez une URL directe si une photo doit apparaitre sur la fiche."
          />
        </section>

        {showCredentialsHint ? (
          <FeedbackBanner
            kind="info"
            title="Compte initial"
            message={`Le compte stagiaire sera cree avec le mot de passe initial ${credentialsHint ?? "defini par DEFAULT_USER_PASSWORD"}.`}
            description="Pensez a transmettre ce mot de passe de maniere securisee au stagiaire."
          />
        ) : null}

        {state.error ? (
          <FeedbackBanner kind="error" title="Enregistrement impossible" message={state.error} />
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton label={submitLabel} />
          <Link
            href={cancelHref}
            className="action-button action-button-secondary px-5 py-3 text-sm"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
