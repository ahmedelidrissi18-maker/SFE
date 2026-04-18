import { LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { FeedbackBanner } from "@/components/ui/feedback-banner";

const trustHighlights = [
  {
    label: "RBAC",
    description: "Acces adapte au role de chaque profil.",
    icon: ShieldCheck,
  },
  {
    label: "2FA",
    description: "Protection renforcee pour les profils sensibles.",
    icon: LockKeyhole,
  },
  {
    label: "Audit",
    description: "Tracabilite des actions et des connexions.",
    icon: Sparkles,
  },
];

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.2),_transparent_56%)]" />

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[36px] border border-border/80 bg-linear-to-br from-card via-card to-surface shadow-[0_40px_120px_-48px_rgba(16,32,51,0.38)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-linear-to-br from-[#0d5f61] via-primary to-[#0b7a8d] p-10 text-primary-foreground lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_36%)]" />
          <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex h-full flex-col justify-between">
            <div>
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm">
                Plateforme interne
              </span>
              <h1 className="mt-8 max-w-lg text-4xl font-semibold leading-tight xl:text-5xl">
                Un espace unique pour piloter stagiaires, rapports et documents.
              </h1>
              <p className="mt-5 max-w-md text-sm leading-7 text-white/82">
                Connectez-vous pour acceder a un environnement structure, securise et adapte a
                votre role dans le cycle de suivi des stages.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {trustHighlights.map(({ label, description, icon: Icon }) => (
                <article
                  key={label}
                  className="rounded-[24px] border border-white/12 bg-white/10 p-4 backdrop-blur-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-white/14 text-white">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="mt-4 text-sm font-semibold">{label}</p>
                  <p className="mt-2 text-xs leading-5 text-white/78">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-md">
            <div className="space-y-3">
              <p className="inline-flex items-center rounded-full bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                Acces securise
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">Se connecter</h2>
              <p className="text-sm leading-6 text-muted">
                Le login est relie au systeme d authentification de l application avec
                durcissement de session, audit et prise en charge du 2FA pour les profils
                sensibles.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {trustHighlights.map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-[22px] border border-border/80 bg-linear-to-br from-card to-surface p-4 shadow-[var(--shadow-soft)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-primary-soft text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-sm font-semibold">{label}</p>
                </div>
              ))}
            </div>

            <LoginForm />

            <div className="mt-6">
              <FeedbackBanner
                kind="info"
                title="Comptes de demonstration"
                message="Des comptes de demo sont disponibles via le seed Prisma."
                description="Consultez le README pour les adresses et le mot de passe initial."
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
