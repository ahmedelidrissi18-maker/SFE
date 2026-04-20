"use client";

import { useState } from "react";
import { toggleStagiaireArchiveAction } from "@/app/(dashboard)/stagiaires/actions";

type StagiaireArchiveToggleProps = {
  stagiaireId: string;
  userId: string;
  isActive: boolean;
  returnTo: string;
};

export function StagiaireArchiveToggle({
  stagiaireId,
  userId,
  isActive,
  returnTo,
}: StagiaireArchiveToggleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!isActive) {
    return (
      <form action={toggleStagiaireArchiveAction}>
        <input type="hidden" name="stagiaireId" value={stagiaireId} />
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="nextActiveValue" value="true" />
        <input type="hidden" name="returnTo" value={returnTo} />
        <button type="submit" className="action-button action-button-secondary px-5 py-3 text-sm">
          Reactiver
        </button>
      </form>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-[#ba1a1a] transition hover:bg-error-container/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ba1a1a]/20 focus-visible:ring-offset-2"
      >
        Archiver
      </button>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 py-6">
          <div
            className="w-full max-w-md rounded-[28px] bg-surface-container-lowest p-6 shadow-[var(--shadow-card)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-stagiaire-title"
          >
            <div className="space-y-3">
              <h2 id="archive-stagiaire-title" className="text-xl font-semibold tracking-tight">
                Archiver ce stagiaire ?
              </h2>
              <p className="text-sm leading-6 text-on-surface-variant">
                Etes-vous sur de vouloir archiver ce stagiaire ? Cette action est irreversible.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="action-button action-button-secondary px-5 py-3 text-sm"
              >
                Annuler
              </button>

              <form action={toggleStagiaireArchiveAction}>
                <input type="hidden" name="stagiaireId" value={stagiaireId} />
                <input type="hidden" name="userId" value={userId} />
                <input type="hidden" name="nextActiveValue" value="false" />
                <input type="hidden" name="returnTo" value={returnTo} />
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-[#ba1a1a] transition hover:bg-error-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ba1a1a]/20 focus-visible:ring-offset-2"
                >
                  Confirmer
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
