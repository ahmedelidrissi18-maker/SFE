"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { DocumentActionState } from "@/app/(dashboard)/documents/actions";

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
          className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
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
            className="rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Traitement..." : "Rejeter"}
          </button>
          <button
            type="submit"
            name="intent"
            value="validate"
            disabled={pending}
            className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
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
          className="rounded-full border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
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
          className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
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
      className="space-y-5 rounded-[32px] border border-border/80 bg-card p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.28)] sm:p-8"
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
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
        />
      </label>

      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
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
