function LoadingCard({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[28px] bg-surface-container-low ${className}`.trim()} />;
}

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <LoadingCard className="h-4 w-28 rounded-full" />
        <LoadingCard className="h-10 w-80 rounded-full" />
        <LoadingCard className="h-4 w-full max-w-3xl rounded-full" />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingCard key={index} className="h-[176px]" />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <LoadingCard className="h-[360px]" />
        <LoadingCard className="h-[360px]" />
      </section>

      <LoadingCard className="h-[280px]" />
    </div>
  );
}
