"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notificationActionSchema } from "@/lib/validations/document";

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

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      destinataireId: session.user.id,
    },
    data: {
      isRead: true,
    },
  });

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

  revalidatePath("/notifications");
}
