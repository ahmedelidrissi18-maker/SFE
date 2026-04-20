"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { EvaluationActionState } from "@/app/(dashboard)/evaluations/actions";
import { FeedbackBanner } from "@/components/ui/feedback-banner";

type StageOption = {
  id: string;
  label: string;
  stagiaireId: string;
};

type CriterionInput = {
  criterionId: string;
  label: string;
  description: string;
  maxScore: number;
  score: number;
  comment?: string;
};

type TypeDefinition = {
  value: string;
  label: string;
  description: string;
  criteria: Array<{
    id: string;
    label: string;
    description: string;
    maxScore: number;
  }>;
};

type EvaluationFormProps = {
  title: string;
  description: string;
  action: (state: EvaluationActionState, formData: FormData) => Promise<EvaluationActionState>;
  stages: StageOption[];
  typeDefinitions: TypeDefinition[];
  defaultValues?: {
    evaluationId?: string;
    stageId?: string;
    type?: string;
    scheduledFor?: string;
    commentaire?: string;
    commentaireEncadrant?: string;
    criteria?: CriterionInput[];
  };
  cancelHref: string;
  lockStage?: boolean;
  lockType?: boolean;
};

const initialState: EvaluationActionState = {};
const fieldClassName =
  "field-shell w-full rounded-2xl px-4 py-3 outline-none transition";

function buildCriteriaInputs(typeDefinition?: TypeDefinition) {
  if (!typeDefinition) {
    return [] as CriterionInput[];
  }

  return typeDefinition.criteria.map((criterion) => ({
    criterionId: criterion.id,
    label: criterion.label,
    description: criterion.description,
    maxScore: criterion.maxScore,
    score: 0,
    comment: "",
  }));
}

function SubmitButtons() {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        name="intent"
        value="draft"
        disabled={pending}
        className="action-button action-button-secondary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>
      <button
        type="submit"
        name="intent"
        value="submit"
        disabled={pending}
        className="action-button action-button-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Soumission..." : "Soumettre a validation"}
      </button>
    </div>
  );
}

export function EvaluationForm({
  title,
  description,
  action,
  stages,
  typeDefinitions,
  defaultValues,
  cancelHref,
  lockStage = false,
  lockType = false,
}: EvaluationFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const isEditing = Boolean(defaultValues?.evaluationId);
  const initialSelectedType = defaultValues?.type ?? typeDefinitions[0]?.value ?? "";
  const initialTypeDefinition =
    typeDefinitions.find((definition) => definition.value === initialSelectedType) ??
    typeDefinitions[0];
  const [selectedType, setSelectedType] = useState(initialSelectedType);
  const [criteria, setCriteria] = useState<CriterionInput[]>(
    defaultValues?.criteria ?? buildCriteriaInputs(initialTypeDefinition),
  );

  const typeDefinition =
    typeDefinitions.find((definition) => definition.value === selectedType) ?? typeDefinitions[0];
  const notesJson = JSON.stringify(
    criteria.map((criterion) => ({
      criterionId: criterion.criterionId,
      score: criterion.score,
      comment: criterion.comment ?? "",
    })),
  );
  const totalScore = criteria.reduce((sum, criterion) => sum + criterion.score, 0);
  const maxScore = criteria.reduce((sum, criterion) => sum + criterion.maxScore, 0);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
          Evaluations
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted sm:text-[15px]">{description}</p>
      </div>

      <form
        action={formAction}
        className="form-shell space-y-8 rounded-[32px] p-6 sm:p-8"
      >
        <input type="hidden" name="evaluationId" value={defaultValues?.evaluationId ?? ""} />
        <input type="hidden" name="notesJson" value={notesJson} />

        <FeedbackBanner
          kind="info"
          title="Workflow d evaluation"
          message="Vous pouvez enregistrer un brouillon pour le completer plus tard ou soumettre directement l evaluation a validation."
          description="La grille active et le score total se mettent a jour automatiquement selon le type choisi."
        />

        <section className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm md:col-span-2">
            <span className="font-medium">Stage</span>
            <select
              name="stageId"
              defaultValue={defaultValues?.stageId}
              disabled={lockStage}
              className={`${fieldClassName} disabled:opacity-70`}
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
            <span className="font-medium">Type d evaluation</span>
            <select
              name="type"
              value={selectedType}
              disabled={lockType}
              onChange={(event) => {
                const nextType = event.target.value;
                setSelectedType(nextType);
                const nextDefinition = typeDefinitions.find(
                  (definition) => definition.value === nextType,
                );
                setCriteria(
                  isEditing && nextType === defaultValues?.type
                    ? (defaultValues.criteria ?? buildCriteriaInputs(nextDefinition))
                    : buildCriteriaInputs(nextDefinition),
                );
              }}
              className={`${fieldClassName} disabled:opacity-70`}
            >
              {typeDefinitions.map((definition) => (
                <option key={definition.value} value={definition.value}>
                  {definition.label}
                </option>
              ))}
            </select>
          </label>

          {lockType ? <input type="hidden" name="type" value={selectedType} /> : null}
        </section>

        <section className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Date planifiee</span>
            <input
              name="scheduledFor"
              type="date"
              defaultValue={defaultValues?.scheduledFor}
              className={fieldClassName}
            />
            <p className="text-xs leading-5 text-muted">
              Optionnel. Cette date alimente le planning des evaluations a venir.
            </p>
          </label>

          <div className="tonal-card rounded-[24px] p-4">
            <p className="text-sm text-muted">Grille active</p>
            <p className="mt-2 text-base font-semibold">{typeDefinition?.label ?? "-"}</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {typeDefinition?.description ?? "Choisissez un type pour charger la grille adaptee."}
            </p>
            <p className="mt-4 text-sm font-medium">
              Score courant: {totalScore}/{maxScore}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm font-medium text-primary">Grille de notation</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Criteres et commentaires</h2>
          </div>

          <div className="grid gap-4">
            {criteria.map((criterion, index) => (
              <div
                key={criterion.criterionId}
                className="tonal-card rounded-[24px] p-5"
              >
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.4fr]">
                  <div className="space-y-2">
                    <p className="font-semibold">{criterion.label}</p>
                    <p className="text-sm leading-6 text-muted">{criterion.description}</p>
                  </div>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium">Note / {criterion.maxScore}</span>
                    <input
                      type="number"
                      min={0}
                      max={criterion.maxScore}
                      value={criterion.score}
                      onChange={(event) => {
                        const nextScore = Number(event.target.value || 0);
                        setCriteria((currentCriteria) =>
                          currentCriteria.map((currentCriterion, currentIndex) =>
                            currentIndex === index
                              ? {
                                  ...currentCriterion,
                                  score: Math.min(
                                    currentCriterion.maxScore,
                                    Math.max(0, Math.round(nextScore)),
                                  ),
                                }
                              : currentCriterion,
                          ),
                        );
                      }}
                      className={fieldClassName}
                    />
                  </label>
                </div>

                <label className="mt-4 block space-y-2 text-sm">
                  <span className="font-medium">Commentaire sur ce critere</span>
                  <textarea
                    rows={3}
                    value={criterion.comment ?? ""}
                    onChange={(event) => {
                      const nextComment = event.target.value;
                      setCriteria((currentCriteria) =>
                        currentCriteria.map((currentCriterion, currentIndex) =>
                          currentIndex === index
                            ? {
                                ...currentCriterion,
                                comment: nextComment,
                              }
                            : currentCriterion,
                        ),
                      );
                    }}
                    className={fieldClassName}
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Synthese generale</span>
            <textarea
              name="commentaire"
              defaultValue={defaultValues?.commentaire}
              rows={5}
              className={fieldClassName}
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Commentaire encadrant</span>
            <textarea
              name="commentaireEncadrant"
              defaultValue={defaultValues?.commentaireEncadrant}
              rows={5}
              className={fieldClassName}
            />
          </label>
        </section>

        {state.error ? (
          <FeedbackBanner kind="error" title="Enregistrement impossible" message={state.error} />
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButtons />
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
