import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-xl rounded-[28px] border border-border bg-card p-10 text-center shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
          Acces refuse
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Cette page n&apos;est pas autorisee pour votre profil.
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted">
          Votre session est active, mais votre role ne permet pas d&apos;ouvrir cette ressource.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Retour au dashboard
          </Link>
          <Link
            href="/"
            className="rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold"
          >
            Retour a l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
