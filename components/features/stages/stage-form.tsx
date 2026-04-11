"use client";

import { StageStatus } from "@prisma/client";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { StageActionState } from "@/app/(dashboard)/stages/actions";
import { getStageStatusLabel } from "@/lib/stages";
import type { StageFormValues } from "@/lib/validations/stage";

type Option = {
  id: string;
  label: string;
};

type StageFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  action: (state: StageActionState, formData: FormData) => Promise<StageActionState>;
  stagiaires: Option[];
  encadrants: Option[];
  defaultValues?: Partial<StageFormValues>;
  lockStagiaire?: boolean;
  cancelHref: string;
};

const initialState: StageActionState = {};

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

export function StageForm({
  title,
  description,
  submitLabel,
  action,
  stagiaires,
  encadrants,
  defaultValues,
  lockStagiaire = false,
  cancelHref,
}: StageFormProps) {
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
        <input type="hidden" name="stageId" value={defaultValues?.stageId ?? ""} />

        <section className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Stagiaire</span>
            <select
              name="stagiaireId"
              defaultValue={defaultValues?.stagiaireId}
              disabled={lockStagiaire}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary disabled:opacity-70"
            >
              <option value="">Selectionner un stagiaire</option>
              {stagiaires.map((stagiaire) => (
                <option key={stagiaire.id} value={stagiaire.id}>
                  {stagiaire.label}
                </option>
              ))}
            </select>
          </label>

          {lockStagiaire ? (
            <input type="hidden" name="stagiaireId" value={defaultValues?.stagiaireId ?? ""} />
          ) : null}

          <label className="space-y-2 text-sm">
            <span className="font-medium">Encadrant</span>
            <select
              name="encadrantId"
              defaultValue={defaultValues?.encadrantId}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            >
              <option value="">Non affecte</option>
              {encadrants.map((encadrant) => (
                <option key={encadrant.id} value={encadrant.id}>
                  {encadrant.label}
                </option>
              ))}
            </select>
          </label>

          <Field
            label="Date de debut"
            name="dateDebut"
            type="date"
            defaultValue={defaultValues?.dateDebut}
            required
          />
          <Field
            label="Date de fin"
            name="dateFin"
            type="date"
            defaultValue={defaultValues?.dateFin}
            required
          />

          <Field
            label="Departement"
            name="departement"
            defaultValue={defaultValues?.departement}
            required
          />

          <label className="space-y-2 text-sm">
            <span className="font-medium">Statut</span>
            <select
              name="statut"
              defaultValue={defaultValues?.statut ?? StageStatus.PLANIFIE}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            >
              {Object.values(StageStatus).map((status) => (
                <option key={status} value={status}>
                  {getStageStatusLabel(status)}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="grid gap-4">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Sujet</span>
            <textarea
              name="sujet"
              defaultValue={defaultValues?.sujet}
              rows={5}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>

          <Field
            label="Depot GitHub"
            name="githubRepo"
            type="url"
            defaultValue={defaultValues?.githubRepo}
          />
        </section>

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
