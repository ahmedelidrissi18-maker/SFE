import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { prisma } from "@/lib/prisma";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const unreadNotificationsCount = await prisma.notification.count({
    where: {
      destinataireId: session.user.id,
      isRead: false,
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.18),_transparent_58%)]" />
      <div className="pointer-events-none fixed bottom-[-10rem] right-[-8rem] -z-10 h-[24rem] w-[24rem] rounded-full bg-[rgba(14,165,233,0.08)] blur-3xl" />
      <div className="mx-auto grid min-h-screen max-w-[98rem] items-start gap-4 px-3 py-3 sm:gap-5 sm:px-4 sm:py-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6">
        <AppSidebar role={session.user.role} />
        <div className="min-w-0 flex min-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-[32px] border border-border/80 bg-linear-to-br from-card via-card to-surface shadow-[var(--shadow-card)] supports-[backdrop-filter]:backdrop-blur-xl sm:min-h-[calc(100vh-2rem)]">
          <AppHeader user={session.user} unreadNotificationsCount={unreadNotificationsCount} />
          <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
