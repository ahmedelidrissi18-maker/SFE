import Link from "next/link";
import { ArrowRight, FolderKanban, ShieldCheck, Users } from "lucide-react";

const pillars = [
  {
    title: "Gestion des stagiaires",
    description:
      "Base de travail pour centraliser les stagiaires, les stages, les rapports et les documents.",
    icon: Users,
  },
  {
    title: "Socle securise",
    description:
      "Structure preparee pour authentification, roles, Prisma et PostgreSQL.",
    icon: ShieldCheck,
  },
  {
    title: "Modules evolutifs",
    description:
      "Architecture prete pour les dashboards, notifications, GitHub API et evaluation.",
    icon: FolderKanban,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.16),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(246,247,251,1))] px-6 py-10 dark:bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.16),_transparent_30%),linear-gradient(180deg,_rgba(8,17,31,1),_rgba(8,17,31,1))]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="overflow-hidden rounded-[28px] border border-border/80 bg-card shadow-[0_30px_120px_rgba(15,23,42,0.10)]">
          <div className="grid gap-8 px-8 py-12 lg:grid-cols-[1.4fr_0.9fr] lg:px-12">
            <div className="space-y-6">
              <span className="inline-flex rounded-full bg-accent px-4 py-1 text-sm font-medium text-primary">
                Socle de demarrage
              </span>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                  Systeme de gestion des stagiaires pret a etre implemente.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
                  Cette base projet pose Next.js, Prisma et PostgreSQL, avec une premiere
                  organisation des pages, composants, donnees et scripts de developpement.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Ouvrir le dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold transition hover:bg-accent"
                >
                  Voir l ecran de connexion
                </Link>
              </div>
            </div>

            <div className="grid gap-4 rounded-[24px] border border-border bg-background/80 p-5">
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-sm text-muted">Stack initiale</p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>Next.js 16 + App Router</li>
                  <li>TypeScript strict</li>
                  <li>Prisma + PostgreSQL</li>
                  <li>Tailwind CSS 4</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-sm text-muted">Pret pour la suite</p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>Schema Prisma initial</li>
                  <li>Seed de donnees de demo</li>
                  <li>Route API healthcheck</li>
                  <li>Structure auth / dashboard / stagiaires</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {pillars.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="rounded-[24px] border border-border bg-card p-6 shadow-sm"
            >
              <div className="mb-4 inline-flex rounded-2xl bg-accent p-3 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
