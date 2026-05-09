import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { NotificationRealtimeProvider } from "@/components/features/notifications/notification-realtime-provider";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { prisma } from "@/lib/prisma";
import { isSensitiveTwoFactorRole } from "@/lib/security/two-factor";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth();
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-sfe-pathname") ?? "/dashboard";

  if (!session?.user) {
    redirect("/login");
  }

  const securityState = isSensitiveTwoFactorRole(session.user.role)
    ? await prisma.user.findUnique({
        where: {
          id: session.user.id,
        },
        select: {
          twoFactorEnabled: true,
        },
      })
    : null;

  if (
    isSensitiveTwoFactorRole(session.user.role) &&
    !securityState?.twoFactorEnabled &&
    !(pathname === "/securite" || pathname.startsWith("/securite/"))
  ) {
    redirect("/securite?error=two-factor-enrollment-required");
  }

  const unreadNotificationsCount = await prisma.notification.count({
    where: {
      destinataireId: session.user.id,
      isRead: false,
    },
  });

  return (
    <div className="min-h-screen bg-background lg:[--dashboard-sidebar-width:280px]">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-[var(--dashboard-sidebar-width)] lg:p-4">
        <AppSidebar role={session.user.role} />
      </div>
      <div className="min-w-0 px-2 py-2 sm:px-4 sm:py-4 lg:ml-[var(--dashboard-sidebar-width)] lg:p-4">
        <div className="min-w-0 flex min-h-[calc(100vh-1rem)] flex-col rounded-xl border border-border bg-surface-container-low p-2 shadow-sm sm:min-h-[calc(100vh-2rem)] sm:p-4">
          <NotificationRealtimeProvider initialUnreadCount={unreadNotificationsCount}>
            <AppHeader user={session.user} />
            <main className="min-w-0 flex-1 px-2 py-4 sm:px-4 sm:py-6 lg:px-8 xl:px-10">{children}</main>
          </NotificationRealtimeProvider>
        </div>
      </div>
    </div>
  );
}
