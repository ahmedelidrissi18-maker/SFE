"use client";

import { StageStatus } from "@prisma/client";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { StageActionState } from "@/app/(dashboard)/stages/actions";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
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
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
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
        className={fieldClassName}
      />
      {hint ? <p className="text-xs leading-5 text-muted">{hint}</p> : null}
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
        className="form-shell space-y-8 rounded-[32px] p-6 sm:p-8"
      >
        <input type="hidden" name="stageId" value={defaultValues?.stageId ?? ""} />

        <FeedbackBanner
          kind="info"
          title="Cadre de suivi"
          message="Renseignez un stage clair et exploitable pour le pilotage, les rapports hebdomadaires et les documents."
          description="L encadrant est optionnel au depart, mais utile pour les revues et les notifications."
        />

        <section className="space-y-2">
          <p className="text-sm font-medium text-primary">Affectation</p>
          <p className="text-sm leading-6 text-muted">
            Associez le stage au bon stagiaire puis choisissez, si besoin, un encadrant.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Stagiaire</span>
            <select
              name="stagiaireId"
              defaultValue={defaultValues?.stagiaireId}
              disabled={lockStagiaire}
              className={`${fieldClassName} disabled:opacity-70`}
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
              className={fieldClassName}
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
            hint="La date de debut sert aux calculs de periode et aux vues de planning."
          />
          <Field
            label="Date de fin"
            name="dateFin"
            type="date"
            defaultValue={defaultValues?.dateFin}
            required
            hint="La date de fin alimente les echeances et les alertes de suivi."
          />

          <Field
            label="Departement"
            name="departement"
            defaultValue={defaultValues?.departement}
            required
            placeholder="Infrastructure, RH, Data..."
          />

          <label className="space-y-2 text-sm">
            <span className="font-medium">Statut</span>
            <select
              name="statut"
              defaultValue={defaultValues?.statut ?? StageStatus.PLANIFIE}
              className={fieldClassName}
            >
              {Object.values(StageStatus).map((status) => (
                <option key={status} value={status}>
                  {getStageStatusLabel(status)}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="space-y-2">
          <p className="text-sm font-medium text-primary">Contenu du stage</p>
          <p className="text-sm leading-6 text-muted">
            Detaillez le sujet du stage et, si disponible, le depot GitHub associe.
          </p>
        </section>

        <section className="grid gap-4">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Sujet</span>
            <textarea
              name="sujet"
              defaultValue={defaultValues?.sujet}
              rows={5}
              className={fieldClassName}
            />
            <p className="text-xs leading-5 text-muted">
              Decrivez le sujet de facon concise pour faciliter la lecture des fiches et des rapports.
            </p>
          </label>

          <Field
            label="Depot GitHub"
            name="githubRepo"
            type="url"
            defaultValue={defaultValues?.githubRepo}
            placeholder="https://github.com/organisation/projet"
            hint="Optionnel. Cette URL sera utilisee pour le suivi technique si le depot existe."
          />
        </section>

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
