import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  cancelTwoFactorSetupAction,
  confirmTwoFactorSetupAction,
  disableTwoFactorAction,
  prepareTwoFactorSetupAction,
} from "@/app/(dashboard)/securite/actions";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { Card } from "@/components/ui/card";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import {
  buildTwoFactorOtpAuthUri,
  decryptTwoFactorSecret,
  formatTwoFactorSecret,
  generateTwoFactorQrCodeDataUrl,
  isSensitiveTwoFactorRole,
} from "@/lib/security/two-factor";
import { formatDate } from "@/lib/stagiaires";

type SecurityPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getStringParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

const successMessages: Record<string, string> = {
  "two-factor-prepared": "Le secret 2FA a ete prepare. Scannez le QR code puis confirmez avec un code valide.",
  "two-factor-cancelled": "La preparation du 2FA a ete annulee.",
  "two-factor-enabled": "Le 2FA est maintenant actif sur votre compte.",
  "two-factor-disabled": "Le 2FA a ete desactive pour votre compte.",
};

const errorMessages: Record<string, string> = {
  "two-factor-already-enabled": "Le 2FA est deja actif sur ce compte.",
  "two-factor-code-invalid": "Le code saisi est invalide. Utilisez un code a 6 chiffres.",
  "two-factor-code-mismatch": "Le code 2FA ne correspond pas au secret prepare. Merci de reessayer.",
  "two-factor-disable-invalid-code": "Le code 2FA fourni ne permet pas de desactiver la protection.",
  "two-factor-not-enabled": "Le 2FA n est pas actif sur ce compte.",
  "two-factor-not-prepared": "Aucun secret 2FA en attente n est disponible. Lancez d abord la preparation.",
  "two-factor-secret-unavailable": "Le secret 2FA n est pas lisible. Regenez un secret puis recommencez.",
};

export default async function SecurityPage({ searchParams }: SecurityPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!isSensitiveTwoFactorRole(session.user.role)) {
    redirect("/acces-refuse");
  }

  const params = (await searchParams) ?? {};
  const success = getStringParam(params.success)?.trim() ?? "";
  const error = getStringParam(params.error)?.trim() ?? "";

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      email: true,
      role: true,
      twoFactorEnabled: true,
      twoFactorEnabledAt: true,
      twoFactorPendingSecret: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const pendingSecret = decryptTwoFactorSecret(user.twoFactorPendingSecret);
  const qrCodeDataUrl = pendingSecret
    ? await generateTwoFactorQrCodeDataUrl(buildTwoFactorOtpAuthUri(user.email, pendingSecret))
    : null;

  return (
    <div className="space-y-8">
      {successMessages[success] ? <FeedbackBanner message={successMessages[success]} /> : null}
      {errorMessages[error] ? (
        <FeedbackBanner kind="error" message={errorMessages[error]} />
      ) : null}

      <PageHeader
        eyebrow="Sprint 6"
        title="Securite du compte"
        description="Le module de securite V2 permet d activer une authentification a deux facteurs pour les roles sensibles, avec audit des changements et protection renforcee de la session."
      />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <MaterialSymbol icon="shield" className="text-[20px]" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">Authentification forte</p>
              <h2 className="text-2xl font-semibold tracking-tight">
                {user.twoFactorEnabled ? "2FA active" : "2FA non active"}
              </h2>
              <p className="text-sm leading-6 text-muted">
                Les comptes `ADMIN` et `RH` peuvent proteger leur connexion avec un code
                a usage unique genere par une application d authentification.
              </p>
            </div>
          </div>

          {user.twoFactorEnabled ? (
            <div className="space-y-4">
              <div className="rounded-[24px] bg-secondary-fixed p-5 text-on-secondary-fixed">
                <p className="text-sm font-medium">Protection active</p>
                <p className="mt-2 text-sm leading-6">
                  Votre compte exige maintenant un mot de passe et un code temporaire lors
                  de la connexion.
                </p>
                <p className="mt-3 text-xs opacity-80">
                  Activation le{" "}
                  {user.twoFactorEnabledAt ? formatDate(user.twoFactorEnabledAt) : "date indisponible"}
                </p>
              </div>

              <form className="space-y-4" action={disableTwoFactorAction}>
                <label className="space-y-2 text-sm">
                  <span className="font-medium">Code 2FA actuel</span>
                  <input
                    name="twoFactorCode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="123456"
                    className="field-shell w-full rounded-2xl px-4 py-3 outline-none transition"
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="action-button action-button-danger px-5 py-3 text-sm"
                >
                  Desactiver le 2FA
                </button>
              </form>
            </div>
          ) : pendingSecret && qrCodeDataUrl ? (
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="tonal-card rounded-[24px] p-5">
                <p className="text-sm font-medium text-primary">1. Scanner le QR code</p>
                <div className="mt-4 flex justify-center rounded-[20px] bg-white p-4 shadow-[var(--shadow-soft)]">
                  <Image
                    src={qrCodeDataUrl}
                    alt="QR code 2FA"
                    width={224}
                    height={224}
                    unoptimized
                    className="h-56 w-56"
                  />
                </div>
              </div>

              <div className="tonal-card space-y-4 rounded-[24px] p-5">
                <div>
                  <p className="text-sm font-medium text-primary">2. Saisir le code genere</p>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight">
                    Finaliser l activation
                  </h3>
                </div>

                <div className="rounded-2xl bg-surface-container-lowest px-4 py-3 text-sm shadow-[var(--shadow-soft)]">
                  <p className="font-medium">Cle manuelle</p>
                  <p className="mt-2 font-mono tracking-[0.2em] text-primary">
                    {formatTwoFactorSecret(pendingSecret)}
                  </p>
                </div>

                <form className="space-y-4" action={confirmTwoFactorSetupAction}>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium">Code a 6 chiffres</span>
                    <input
                      name="twoFactorCode"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="123456"
                      className="field-shell w-full rounded-2xl px-4 py-3 outline-none transition"
                      required
                    />
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="action-button action-button-primary px-5 py-3 text-sm"
                    >
                      Confirmer l activation
                    </button>
                  </div>
                </form>

                <form action={cancelTwoFactorSetupAction}>
                  <button
                    type="submit"
                    className="action-button action-button-secondary px-5 py-3 text-sm"
                  >
                    Annuler cette preparation
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-[24px] bg-tertiary-fixed p-5 text-on-tertiary-fixed-variant">
                <p className="text-sm font-medium">Protection recommandee</p>
                <p className="mt-2 text-sm leading-6">
                  Votre role fait partie des profils sensibles de la V2. L activation du 2FA
                  ajoute une verification forte au moment de la connexion.
                </p>
              </div>

              <form action={prepareTwoFactorSetupAction}>
                <button
                  type="submit"
                  className="action-button action-button-primary px-5 py-3 text-sm"
                >
                  Generer un QR code 2FA
                </button>
              </form>
            </div>
          )}
        </Card>

        <Card className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <MaterialSymbol icon="verified_user" className="text-[20px]" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">Hardening Sprint 6</p>
              <h2 className="text-2xl font-semibold tracking-tight">Protections actives</h2>
            </div>
          </div>

          <div className="space-y-3 text-sm leading-6 text-muted">
            <p>
              Les sessions JWT sont maintenant raccourcies et renouvelees plus souvent pour
              limiter la duree d exposition d un cookie actif.
            </p>
            <p>
              Le login et les endpoints sensibles utilisent une limitation de debit cote
              serveur pour freiner les tentatives de brute-force et les abus repetes.
            </p>
            <p>
              Les activations, annulations et desactivations du 2FA sont journalisees dans
              `AuditLog` pour renforcer la tracabilite du Sprint 6.
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
