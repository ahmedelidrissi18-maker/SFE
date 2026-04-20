import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/login/actions";

type LogoutButtonProps = {
  className?: string;
  formClassName?: string;
};

export function LogoutButton({ className, formClassName }: LogoutButtonProps) {
  return (
    <form className={cn("sm:self-stretch", formClassName)} action={logoutAction}>
      <button
        type="submit"
        className={cn(
          "inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface shadow-[var(--shadow-soft)] transition hover:bg-surface-container-high hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:w-auto",
          className,
        )}
      >
        Se deconnecter
      </button>
    </form>
  );
}
