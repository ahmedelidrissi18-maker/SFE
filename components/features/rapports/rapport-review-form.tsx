"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { RapportActionState } from "@/app/(dashboard)/rapports/actions";
import { FeedbackBanner } from "@/components/ui/feedback-banner";

type RapportReviewFormProps = {
  rapportId: string;
  defaultComment?: string;
  action: (state: RapportActionState, formData: FormData) => Promise<RapportActionState>;
};

const initialState: RapportActionState = {};
const fieldClassName =
  "field-shell w-full rounded-2xl px-4 py-3 outline-none transition";

function ReviewButtons() {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <button
        type="submit"
        name="intent"
        value="return"
        disabled={pending}
        className="action-button action-button-warning w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {pending ? "Traitement..." : "Retourner le rapport"}
      </button>
      <button
        type="submit"
        name="intent"
        value="validate"
        disabled={pending}
        className="action-button action-button-primary w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {pending ? "Traitement..." : "Valider le rapport"}
      </button>
    </div>
  );
}

export function RapportReviewForm({ rapportId, defaultComment, action }: RapportReviewFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="form-shell space-y-5 rounded-[32px] p-6 sm:p-8"
    >
      <input type="hidden" name="rapportId" value={rapportId} />

      <div className="space-y-2">
        <h2 className="text-lg font-semibold sm:text-xl">Revue de l encadrant</h2>
        <p className="text-sm leading-6 text-muted">
          Ajoutez un retour puis validez ou retournez ce rapport au stagiaire.
        </p>
      </div>

      <label className="space-y-2 text-sm">
        <span className="font-medium">Commentaire</span>
        <textarea
          name="commentaireEncadrant"
          defaultValue={defaultComment}
          rows={5}
          className={fieldClassName}
        />
        <p className="text-xs leading-5 text-muted">
          Si vous retournez le rapport, expliquez clairement ce qui doit etre corrige.
        </p>
      </label>

      {state.error ? (
        <FeedbackBanner kind="error" title="Action impossible" message={state.error} />
      ) : null}

      <ReviewButtons />
    </form>
  );
}
