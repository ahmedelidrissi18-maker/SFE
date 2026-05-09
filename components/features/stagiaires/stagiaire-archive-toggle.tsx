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
        <button
          type="submit"
          className="action-button action-button-secondary w-full px-5 py-3 text-sm sm:w-auto"
        >
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 px-4 py-4 sm:items-center sm:py-6">
          <div
            className="w-full max-w-md rounded-[28px] bg-surface-container-lowest p-5 shadow-[var(--shadow-card)] sm:p-6"
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

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="action-button action-button-secondary w-full px-5 py-3 text-sm sm:w-auto"
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
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-[#ba1a1a] transition hover:bg-error-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ba1a1a]/20 focus-visible:ring-offset-2 sm:w-auto"
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
