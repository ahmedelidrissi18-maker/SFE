import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { getConfiguredLoginProviders } from "@/lib/auth-providers";

const trustHighlights = [
  {
    label: "RBAC",
    description: "Acces adapte au role de chaque profil.",
    icon: "shield",
  },
  {
    label: "2FA",
    description: "Protection renforcee pour les profils sensibles.",
    icon: "verified_user",
  },
  {
    label: "Audit",
    description: "Tracabilite des actions et des connexions.",
    icon: "history",
  },
];

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getStringParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getOAuthErrorMessage(errorCode?: string) {
  switch (errorCode) {
    case "oauth_email_missing":
      return "Le fournisseur externe n a pas renvoye d adresse e-mail exploitable pour retrouver votre compte.";
    case "oauth_email_not_verified":
      return "Le compte Google utilise n expose pas une adresse e-mail verifiee. Merci d utiliser votre compte professionnel verifie.";
    case "oauth_account_not_allowed":
      return "Aucun compte actif correspondant n a ete trouve dans la plateforme pour cette adresse e-mail.";
    case "oauth_sensitive_role_blocked":
      return "Les roles sensibles doivent continuer a se connecter avec leur mot de passe interne et, si requis, le 2FA.";
    case "oauth_provider_not_configured":
    case "Configuration":
      return "La connexion externe selectionnee n est pas configuree dans l environnement courant.";
    case "AccessDenied":
      return "La connexion externe a ete refusee par les regles de securite de la plateforme.";
    case "OAuthSignin":
    case "OAuthCallback":
    case "Callback":
      return "La connexion via le fournisseur externe a echoue. Merci de reessayer.";
    default:
      return undefined;
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};
  const oauthErrorMessage = getOAuthErrorMessage(getStringParam(params.error)?.trim());
  const oauthProviders = getConfiguredLoginProviders();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -top-[10%] -left-[5%] h-[40%] w-[40%] rounded-full bg-primary-fixed opacity-20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-[10%] -right-[5%] h-[40%] w-[40%] rounded-full bg-tertiary-fixed opacity-20 blur-[120px]" />

      <div className="relative w-full max-w-[520px]">
        <div className="mb-10 flex flex-col items-center">
          <div className="signature-gradient flex h-12 w-12 items-center justify-center rounded-xl text-on-primary shadow-[var(--shadow-ambient)]">
            <MaterialSymbol icon="work" className="text-[24px]" filled />
          </div>
          <h1 className="mt-4 text-xl font-extrabold tracking-tight text-primary">
            Gestion des stagiaires
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">Enterprise Management</p>
        </div>

        <section className="rounded-[28px] bg-surface-container-lowest p-8 shadow-[var(--shadow-card)] sm:p-10">
          <header className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Acces securise
            </p>
            <h2 className="text-[28px] font-medium tracking-[-0.02em] text-on-surface">
              Connexion a la plateforme
            </h2>
            <p className="text-[15px] leading-relaxed text-on-surface-variant">
              Entrez vos identifiants pour acceder a votre espace stagiaire, RH ou encadrant.
            </p>
          </header>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {trustHighlights.map(({ label, description, icon }) => (
              <article key={label} className="rounded-[20px] bg-surface-container-low p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-surface-container-lowest text-primary">
                  <MaterialSymbol icon={icon} className="text-[18px]" />
                </div>
                <p className="mt-3 text-sm font-semibold text-on-surface">{label}</p>
                <p className="mt-2 text-xs leading-5 text-on-surface-variant">{description}</p>
              </article>
            ))}
          </div>

          <LoginForm
            oauthProviders={oauthProviders}
            oauthErrorMessage={oauthErrorMessage}
          />

          <div className="mt-8 pt-8">
            <FeedbackBanner
              kind="info"
              title="Comptes de demonstration"
              message="Des comptes de demo sont disponibles via le seed Prisma."
              description="Consultez le README pour les adresses et le mot de passe initial."
            />
          </div>
        </section>
      </div>
    </main>
  );
}
