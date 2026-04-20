"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { DocumentActionState } from "@/app/(dashboard)/documents/actions";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { pdfTemplateDefinitions } from "@/lib/documents";

type StageOption = {
  id: string;
  label: string;
};

type PdfGenerationFormProps = {
  stages: StageOption[];
  action: (state: DocumentActionState, formData: FormData) => Promise<DocumentActionState>;
};

const initialState: DocumentActionState = {};
const fieldClassName =
  "field-shell w-full rounded-2xl px-4 py-3 outline-none transition";

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className="action-button action-button-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Generation..." : "Generer le PDF"}
    </button>
  );
}

export function PdfGenerationForm({ stages, action }: PdfGenerationFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const hasStages = stages.length > 0;

  return (
    <form
      action={formAction}
      className="form-shell space-y-5 rounded-[32px] p-6 sm:p-8"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Generer un PDF standard</h2>
        <p className="text-sm leading-6 text-muted">
          Produisez une attestation, une fiche recapitulative ou un rapport consolide a partir des donnees du stage.
        </p>
      </div>

      <FeedbackBanner
        kind={hasStages ? "info" : "warning"}
        title={hasStages ? "Generation guidee" : "Aucun stage disponible"}
        message={
          hasStages
            ? "Choisissez un stage puis un modele. Le PDF genere sera ajoute automatiquement au module Documents."
            : "Aucun stage visible n est actuellement disponible pour la generation d un PDF standard."
        }
        description={
          hasStages
            ? "Utilisez ce formulaire pour produire rapidement un document standard sans quitter le perimetre de suivi."
            : "Verifiez d abord vos donnees de stage ou votre perimetre d acces avant de relancer la generation."
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium">Stage</span>
          <select
            name="stageId"
            className={fieldClassName}
            disabled={!hasStages}
          >
            <option value="">Selectionner un stage</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.label}
              </option>
            ))}
          </select>
          <p className="text-xs leading-5 text-muted">
            Selectionnez le stage qui servira de source pour le PDF.
          </p>
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium">Modele</span>
          <select
            name="template"
            defaultValue={pdfTemplateDefinitions[0]?.key}
            className={fieldClassName}
            disabled={!hasStages}
          >
            {pdfTemplateDefinitions.map((template) => (
              <option key={template.key} value={template.key}>
                {template.label}
              </option>
            ))}
          </select>
          <p className="text-xs leading-5 text-muted">
            Choisissez le type de document standard a generer.
          </p>
        </label>
      </div>

      {state.error ? (
        <FeedbackBanner kind="error" title="Generation impossible" message={state.error} />
      ) : null}

      <SubmitButton disabled={!hasStages} />
    </form>
  );
}
