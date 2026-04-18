"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { RapportActionState } from "@/app/(dashboard)/rapports/actions";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import type { RapportFormValues } from "@/lib/validations/rapport";

type StageOption = {
  id: string;
  label: string;
};

type RapportFormProps = {
  title: string;
  description: string;
  action: (state: RapportActionState, formData: FormData) => Promise<RapportActionState>;
  stages: StageOption[];
  defaultValues?: Partial<RapportFormValues>;
  cancelHref: string;
  lockStage?: boolean;
};

const initialState: RapportActionState = {};

function SubmitButtons() {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        name="intent"
        value="draft"
        disabled={pending}
        className="rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Enregistrement..." : "Enregistrer en brouillon"}
      </button>
      <button
        type="submit"
        name="intent"
        value="submit"
        disabled={pending}
        className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Soumission..." : "Soumettre pour relecture"}
      </button>
    </div>
  );
}

export function RapportForm({
  title,
  description,
  action,
  stages,
  defaultValues,
  cancelHref,
  lockStage = false,
}: RapportFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">Rapport</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted sm:text-[15px]">{description}</p>
      </div>

      <form
        action={formAction}
        className="space-y-8 rounded-[32px] border border-border/80 bg-card p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.28)] sm:p-8"
      >
        <input type="hidden" name="rapportId" value={defaultValues?.rapportId ?? ""} />

        <FeedbackBanner
          kind="info"
          title="Deux modes d enregistrement"
          message="Conservez un brouillon tant que le rapport n est pas pret. Utilisez la soumission lorsque le contenu peut partir en relecture."
        />

        <section className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm md:col-span-2">
            <span className="font-medium">Stage</span>
            <select
              name="stageId"
              defaultValue={defaultValues?.stageId}
              disabled={lockStage}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-70"
            >
              <option value="">Selectionner un stage</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.label}
                </option>
              ))}
            </select>
          </label>

          {lockStage ? (
            <input type="hidden" name="stageId" value={defaultValues?.stageId ?? ""} />
          ) : null}

          <label className="space-y-2 text-sm">
            <span className="font-medium">Semaine</span>
            <input
              name="semaine"
              type="number"
              min={1}
              max={52}
              defaultValue={defaultValues?.semaine}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            <p className="text-xs leading-5 text-muted">
              Indiquez la semaine de suivi correspondant a ce rapport.
            </p>
          </label>
        </section>

        <section className="grid gap-4">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Taches realisees</span>
            <textarea
              name="tachesRealisees"
              defaultValue={defaultValues?.tachesRealisees}
              rows={6}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            <p className="text-xs leading-5 text-muted">
              Decrivez les taches terminees ou avancees pendant la semaine.
            </p>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Difficultes</span>
              <textarea
                name="difficultes"
                defaultValue={defaultValues?.difficultes}
                rows={4}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
              <p className="text-xs leading-5 text-muted">
                Mentionnez les blocages, dependances ou besoins d arbitrage.
              </p>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Plan suivant</span>
              <textarea
                name="planSuivant"
                defaultValue={defaultValues?.planSuivant}
                rows={4}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
              <p className="text-xs leading-5 text-muted">
                Expliquez ce qui est prevu sur la prochaine periode de travail.
              </p>
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Avancement du stage (%)</span>
            <input
              name="avancement"
              type="number"
              min={0}
              max={100}
              defaultValue={defaultValues?.avancement ?? 0}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            <p className="text-xs leading-5 text-muted">
              Donnez une estimation globale de progression entre 0 et 100.
            </p>
          </label>
        </section>

        {state.error ? (
          <FeedbackBanner kind="error" title="Enregistrement impossible" message={state.error} />
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButtons />
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
