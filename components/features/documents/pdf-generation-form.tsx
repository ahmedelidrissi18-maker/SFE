"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { DocumentActionState } from "@/app/(dashboard)/documents/actions";
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

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Generation..." : "Generer le PDF"}
    </button>
  );
}

export function PdfGenerationForm({ stages, action }: PdfGenerationFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-[32px] border border-border/80 bg-card p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.28)] sm:p-8"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Generer un PDF standard</h2>
        <p className="text-sm leading-6 text-muted">
          Produisez une attestation, une fiche recapitulative ou un rapport consolide a partir des donnees du stage.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium">Stage</span>
          <select
            name="stageId"
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
          >
            <option value="">Selectionner un stage</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium">Modele</span>
          <select
            name="template"
            defaultValue={pdfTemplateDefinitions[0]?.key}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
          >
            {pdfTemplateDefinitions.map((template) => (
              <option key={template.key} value={template.key}>
                {template.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}
