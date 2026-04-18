import { logoutAction } from "@/app/login/actions";

export function LogoutButton() {
  return (
    <form className="sm:self-stretch" action={logoutAction}>
      <button
        type="submit"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-[20px] border border-border bg-linear-to-b from-background to-card px-4 py-2 text-sm font-semibold text-foreground shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-primary/25 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:w-auto"
      >
        Se deconnecter
      </button>
    </form>
  );
}
