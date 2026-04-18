"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { EvaluationActionState } from "@/app/(dashboard)/evaluations/actions";
import { FeedbackBanner } from "@/components/ui/feedback-banner";

type EvaluationReviewFormProps = {
  evaluationId: string;
  defaultComment?: string;
  action: (state: EvaluationActionState, formData: FormData) => Promise<EvaluationActionState>;
};

const initialState: EvaluationActionState = {};

function ReviewButtons() {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        name="intent"
        value="return"
        disabled={pending}
        className="rounded-full border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-semibold text-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Traitement..." : "Retourner l evaluation"}
      </button>
      <button
        type="submit"
        name="intent"
        value="validate"
        disabled={pending}
        className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Traitement..." : "Valider l evaluation"}
      </button>
    </div>
  );
}

export function EvaluationReviewForm({
  evaluationId,
  defaultComment,
  action,
}: EvaluationReviewFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-[32px] border border-border/80 bg-card p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.28)] sm:p-8"
    >
      <input type="hidden" name="evaluationId" value={evaluationId} />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Validation RH</h2>
        <p className="text-sm leading-6 text-muted">
          Ajoutez votre commentaire RH puis validez l evaluation ou retournez-la a l encadrant.
        </p>
      </div>

      <label className="space-y-2 text-sm">
        <span className="font-medium">Commentaire RH</span>
        <textarea
          name="commentaireRh"
          defaultValue={defaultComment}
          rows={5}
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
        />
        <p className="text-xs leading-5 text-muted">
          En cas de retour, detaillez clairement les ajustements attendus pour l encadrant.
        </p>
      </label>

      {state.error ? (
        <FeedbackBanner kind="error" title="Action impossible" message={state.error} />
      ) : null}

      <ReviewButtons />
    </form>
  );
}
