"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { notificationService } from "@/lib/notification-service";
import { prisma } from "@/lib/prisma";
import { notificationActionSchema } from "@/lib/validations/document";
import { notificationPreferenceSchema } from "@/lib/validations/notification";
import { publishNotificationRealtimeEvent } from "@/lib/realtime-notifications";

export async function markNotificationReadAction(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    return;
  }

  const parsedData = notificationActionSchema.safeParse({
    notificationId: formData.get("notificationId"),
  });

  if (!parsedData.success) {
    return;
  }

  const { notificationId } = parsedData.data;

  await notificationService.markAsRead(notificationId, session.user.id);

  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction() {
  const session = await auth();

  if (!session?.user) {
    return;
  }

  await prisma.notification.updateMany({
    where: {
      destinataireId: session.user.id,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  const unreadCount = await prisma.notification.count({
    where: {
      destinataireId: session.user.id,
      isRead: false,
    },
  });

  publishNotificationRealtimeEvent({
    kind: "notification_read",
    userId: session.user.id,
    unreadCount,
  });

  revalidatePath("/notifications");
  redirect("/notifications?success=all-read");
}

export async function updateNotificationPreferenceAction(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    return;
  }

  const parsedData = notificationPreferenceSchema.safeParse({
    eventType: formData.get("eventType"),
    inAppEnabled: formData.get("inAppEnabled"),
    liveEnabled: formData.get("liveEnabled"),
  });

  if (!parsedData.success) {
    return;
  }

  await notificationService.updatePreferences({
    userId: session.user.id,
    eventType: parsedData.data.eventType,
    inAppEnabled: parsedData.data.inAppEnabled,
    liveEnabled: parsedData.data.liveEnabled,
  });

  revalidatePath("/notifications");
  redirect("/notifications?success=preferences-updated");
}
