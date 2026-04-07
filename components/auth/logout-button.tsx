import { logoutAction } from "@/app/(auth)/login/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
      >
        Se deconnecter
      </button>
    </form>
  );
}
