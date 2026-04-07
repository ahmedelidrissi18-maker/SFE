type FeedbackBannerProps = {
  kind?: "success" | "error";
  message: string;
};

const styles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-red-200 bg-red-50 text-red-700",
};

export function FeedbackBanner({ kind = "success", message }: FeedbackBannerProps) {
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles[kind]}`}>{message}</div>
  );
}
