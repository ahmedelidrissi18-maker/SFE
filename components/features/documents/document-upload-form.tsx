"use client";

import { DocumentType } from "@prisma/client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { DocumentActionState } from "@/app/(dashboard)/documents/actions";
import { getDocumentTypeLabel } from "@/lib/documents";

type DocumentUploadFormProps = {
  stageId: string;
  action: (state: DocumentActionState, formData: FormData) => Promise<DocumentActionState>;
};

const initialState: DocumentActionState = {};
const manualDocumentTypes = [
  DocumentType.CONVENTION,
  DocumentType.CIN,
  DocumentType.CV,
  DocumentType.RAPPORT,
  DocumentType.JUSTIFICATIF,
  DocumentType.RAPPORT_EVAL,
  DocumentType.AUTRE,
];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Televersement..." : "Ajouter le document"}
    </button>
  );
}

export function DocumentUploadForm({ stageId, action }: DocumentUploadFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-[32px] border border-border/80 bg-card p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.28)] sm:p-8"
    >
      <input type="hidden" name="stageId" value={stageId} />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Ajouter un document</h2>
        <p className="text-sm leading-6 text-muted">
          Formats autorises : PDF, JPG, PNG, DOC et DOCX. Taille maximale : 5 Mo.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium">Categorie</span>
          <select
            name="type"
            defaultValue={DocumentType.CONVENTION}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
          >
            {manualDocumentTypes.map((type) => (
              <option key={type} value={type}>
                {getDocumentTypeLabel(type)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium">Fichier</span>
          <input
            name="file"
            type="file"
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
          />
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
