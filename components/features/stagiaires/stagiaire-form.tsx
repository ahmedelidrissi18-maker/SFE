"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { StagiaireActionState } from "@/app/(dashboard)/stagiaires/actions";
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

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
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
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="space-y-2 text-sm">
      <span className="font-medium">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
      />
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
        className="space-y-8 rounded-[32px] border border-border/80 bg-card p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.28)] sm:p-8"
      >
        <input type="hidden" name="stagiaireId" value={defaultValues?.stagiaireId ?? ""} />
        <input type="hidden" name="userId" value={defaultValues?.userId ?? ""} />

        <section className="grid gap-4 md:grid-cols-2">
          <Field label="Nom" name="nom" defaultValue={defaultValues?.nom} required />
          <Field label="Prenom" name="prenom" defaultValue={defaultValues?.prenom} required />
          <Field label="Email" name="email" type="email" defaultValue={defaultValues?.email} required />
          <Field label="CIN" name="cin" defaultValue={defaultValues?.cin} required />
          <Field label="Telephone" name="telephone" defaultValue={defaultValues?.telephone} />
          <Field
            label="Date de naissance"
            name="dateNaissance"
            type="date"
            defaultValue={defaultValues?.dateNaissance}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Field label="Etablissement" name="etablissement" defaultValue={defaultValues?.etablissement} />
          <Field label="Specialite" name="specialite" defaultValue={defaultValues?.specialite} />
          <Field label="Niveau" name="niveau" defaultValue={defaultValues?.niveau} />
          <Field label="Annee universitaire" name="annee" defaultValue={defaultValues?.annee} />
        </section>

        <section className="grid gap-4">
          <Field label="Photo URL" name="photoUrl" type="url" defaultValue={defaultValues?.photoUrl} />
        </section>

        {showCredentialsHint ? (
          <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-3 text-sm text-muted">
            Le compte stagiaire est cree avec le mot de passe initial{" "}
            <strong>{credentialsHint ?? "defini par DEFAULT_USER_PASSWORD"}</strong>.
          </div>
        ) : null}

        {state.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton label={submitLabel} />
          <Link
            href={cancelHref}
            className="rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
