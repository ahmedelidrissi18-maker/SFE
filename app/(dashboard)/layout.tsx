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
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-4 lg:grid-cols-[260px_1fr]">
        <AppSidebar role={session.user.role} />
        <div className="flex min-h-[calc(100vh-2rem)] flex-col rounded-[28px] border border-border/80 bg-card shadow-[0_24px_48px_-32px_rgba(15,23,42,0.45)]">
          <AppHeader user={session.user} unreadNotificationsCount={unreadNotificationsCount} />
          <main className="flex-1 px-5 py-6 sm:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
