import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  FolderKanban,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const pillars = [
  {
    title: "Gestion des stagiaires",
    description:
      "Centralisez fiches stagiaires, stages, rapports hebdomadaires et documents dans une seule interface.",
    icon: Users,
  },
  {
    title: "Socle securise",
    description:
      "Authentification, RBAC, journalisation et parcours sensibles prepares pour un usage interne fiable.",
    icon: ShieldCheck,
  },
  {
    title: "Suivi evolutif",
    description:
      "Architecture deja structuree pour analytics, notifications temps reel, GitHub et workflows documentaires.",
    icon: FolderKanban,
  },
];

const launchPanels = [
  {
    title: "Parcours metiers",
    value: "4",
    description: "ADMIN, RH, encadrant et stagiaire disposent chacun d une vue adaptee.",
  },
  {
    title: "Modules visibles",
    value: "9",
    description: "Dashboard, rapports, documents, notifications, securite et plus encore.",
  },
  {
    title: "Signalement",
    value: "Live",
    description: "Notifications temps reel pour garder les actions prioritaires visibles.",
  },
];

const overviewCards = [
  {
    title: "Pilotage",
    text: "Tableau de bord, KPI et signaux de priorite par role.",
    icon: Sparkles,
  },
  {
    title: "Collaboration",
    text: "Encadrants, RH et stagiaires partagent un meme socle de suivi.",
    icon: BellRing,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[36px] border border-border/80 bg-linear-to-br from-card via-card to-surface shadow-[0_36px_120px_-52px_rgba(16,32,51,0.34)]">
          <div className="grid gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-12 lg:py-12">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-primary-soft px-4 py-1 text-sm font-semibold text-primary">
                  Socle V2 pret a l usage
                </span>
                <span className="inline-flex items-center rounded-full border border-border bg-background/80 px-4 py-1 text-sm font-medium text-muted">
                  Outil interne de gestion
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl xl:text-6xl">
                  Une application plus lisible pour suivre chaque stage sans dispersion.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
                  La plateforme regroupe suivi administratif, rapports, documents, evaluation et
                  securite dans une experience unique, structuree pour la prise de decision.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_22px_42px_-28px_rgba(15,118,110,0.72)] transition hover:-translate-y-0.5 hover:opacity-95"
                >
                  Ouvrir le dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-linear-to-b from-background to-card px-5 py-3 text-sm font-semibold shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
                >
                  Voir l ecran de connexion
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {launchPanels.map((panel) => (
                  <article
                    key={panel.title}
                    className="rounded-[24px] border border-border/80 bg-linear-to-br from-card to-surface p-4 shadow-[var(--shadow-soft)]"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                      {panel.title}
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight">{panel.value}</p>
                    <p className="mt-2 text-sm leading-6 text-muted">{panel.description}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[28px] border border-border/80 bg-linear-to-br from-primary to-cyan-700 p-6 text-primary-foreground shadow-[0_30px_70px_-34px_rgba(15,118,110,0.7)]">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/72">
                  Vue produit
                </p>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                  Un shell unifie pour tous les modules sensibles.
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/82">
                  L interface privilegie la clarte des statuts, la priorisation des actions et une
                  navigation adaptee a chaque role.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {overviewCards.map(({ title, text, icon: Icon }) => (
                  <article
                    key={title}
                    className="rounded-[24px] border border-border/80 bg-linear-to-br from-card to-surface p-5 shadow-[var(--shadow-soft)]"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-primary-soft text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {pillars.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="rounded-[28px] border border-border/80 bg-linear-to-br from-card via-card to-surface p-6 shadow-[var(--shadow-soft)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-primary text-primary-foreground shadow-[0_20px_40px_-28px_rgba(15,118,110,0.72)]">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-xl font-semibold tracking-tight">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
