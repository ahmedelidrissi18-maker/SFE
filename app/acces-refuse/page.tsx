import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-xl rounded-[28px] bg-card p-10 text-center shadow-[var(--shadow-card)]">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
          Acces refuse
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-on-surface">
          Cette page n&apos;est pas autorisee pour votre profil.
        </h1>
        <p className="mt-4 text-sm leading-7 text-on-surface-variant">
          Votre session est active, mais votre role ne permet pas d&apos;ouvrir cette ressource.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-[var(--shadow-soft)]"
          >
            Retour au dashboard
          </Link>
          <Link
            href="/"
            className="rounded-full bg-surface-container-low px-5 py-3 text-sm font-semibold text-on-surface shadow-[var(--shadow-soft)]"
          >
            Retour a l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
