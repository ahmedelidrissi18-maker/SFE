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
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,_rgba(36,56,156,0.12),_transparent_58%)]" />
      <div className="pointer-events-none fixed bottom-[-10rem] right-[-8rem] -z-10 h-[24rem] w-[24rem] rounded-full bg-[rgba(255,183,132,0.08)] blur-3xl" />
      <div className="lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-[240px] lg:p-4">
        <AppSidebar role={session.user.role} />
      </div>
      <div className="min-w-0 px-3 py-3 sm:px-4 sm:py-4 lg:ml-[240px] lg:p-4">
        <div className="min-w-0 flex min-h-[calc(100vh-1.5rem)] flex-col rounded-[32px] bg-surface-container-low p-3 shadow-[var(--shadow-card)] sm:min-h-[calc(100vh-2rem)] sm:p-4">
          <AppHeader user={session.user} unreadNotificationsCount={unreadNotificationsCount} />
          <main className="min-w-0 flex-1 px-2 py-5 sm:px-4 lg:px-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
