import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_20px_80px_rgba(15,23,42,0.12)] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden bg-[linear-gradient(145deg,_rgba(15,118,110,1),_rgba(13,148,136,0.82))] p-10 text-primary-foreground lg:block">
          <p className="text-sm uppercase tracking-[0.25em] text-white/70">Connexion</p>
          <h1 className="mt-6 max-w-sm text-4xl font-semibold leading-tight">
            Bienvenue sur la plateforme de gestion des stages.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/80">
            Connectez-vous avec un compte autorise pour acceder aux espaces proteges.
          </p>
        </section>

        <section className="p-8 sm:p-10">
          <div className="mx-auto max-w-md">
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">Acces plateforme</p>
              <h2 className="text-3xl font-semibold tracking-tight">Se connecter</h2>
              <p className="text-sm leading-6 text-muted">
                Le login est maintenant relie au systeme d authentification de l application.
              </p>
            </div>

            <LoginForm />

            <div className="mt-8 rounded-2xl border border-dashed border-border bg-background p-4 text-sm text-muted">
              Comptes de demo disponibles via le seed Prisma. Voir le fichier README pour les
              adresses et le mot de passe initial.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
