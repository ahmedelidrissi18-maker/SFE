"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { DocumentActionState } from "@/app/(dashboard)/documents/actions";
import { FeedbackBanner } from "@/components/ui/feedback-banner";

type DocumentReviewFormProps = {
  documentId: string;
  defaultComment?: string;
  action: (state: DocumentActionState, formData: FormData) => Promise<DocumentActionState>;
  canSubmit?: boolean;
  canReview?: boolean;
  canPrepareSignature?: boolean;
  canMarkSigned?: boolean;
};

const initialState: DocumentActionState = {};
const fieldClassName =
  "field-shell w-full rounded-2xl px-4 py-3 outline-none transition";

function ActionButtons(props: {
  canSubmit?: boolean;
  canReview?: boolean;
  canPrepareSignature?: boolean;
  canMarkSigned?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-wrap items-center gap-3">
      {props.canSubmit ? (
        <button
          type="submit"
          name="intent"
          value="submit"
          disabled={pending}
          className="action-button action-button-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Traitement..." : "Envoyer en verification"}
        </button>
      ) : null}
      {props.canReview ? (
        <>
          <button
            type="submit"
            name="intent"
            value="reject"
            disabled={pending}
            className="action-button action-button-danger px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Traitement..." : "Rejeter"}
          </button>
          <button
            type="submit"
            name="intent"
            value="validate"
            disabled={pending}
            className="action-button action-button-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Traitement..." : "Valider"}
          </button>
        </>
      ) : null}
      {props.canPrepareSignature ? (
        <button
          type="submit"
          name="intent"
          value="prepare-signature"
          disabled={pending}
          className="action-button action-button-warning px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Preparation..." : "Preparer la signature"}
        </button>
      ) : null}
      {props.canMarkSigned ? (
        <button
          type="submit"
          name="intent"
          value="mark-signed"
          disabled={pending}
          className="action-button action-button-success px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Validation..." : "Marquer signe"}
        </button>
      ) : null}
    </div>
  );
}

export function DocumentReviewForm({
  documentId,
  defaultComment,
  action,
  canSubmit,
  canReview,
  canPrepareSignature,
  canMarkSigned,
}: DocumentReviewFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="form-shell space-y-5 rounded-[32px] p-6 sm:p-8"
    >
      <input type="hidden" name="documentId" value={documentId} />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Workflow documentaire</h2>
        <p className="text-sm leading-6 text-muted">
          Soumettez le document, validez-le, rejetez-le avec motif ou preparez sa signature selon vos droits.
        </p>
      </div>

      <label className="space-y-2 text-sm">
        <span className="font-medium">Commentaire / motif</span>
        <textarea
          name="commentaire"
          defaultValue={defaultComment}
          rows={5}
          className={fieldClassName}
        />
        <p className="text-xs leading-5 text-muted">
          Ajoutez un motif clair si vous rejetez le document ou si vous preparez une signature.
        </p>
      </label>

      {state.error ? (
        <FeedbackBanner kind="error" title="Action impossible" message={state.error} />
      ) : null}

      <ActionButtons
        canSubmit={canSubmit}
        canReview={canReview}
        canPrepareSignature={canPrepareSignature}
        canMarkSigned={canMarkSigned}
      />
    </form>
  );
}
