import { prisma } from "../../config/prisma";
import type { NotificationChannel, Prisma } from "@prisma/client";

export async function notify(
  userId: string,
  title: string,
  message: string,
  channel: NotificationChannel = "IN_APP",
  data?: Record<string, unknown>,
) {
  return prisma.notification.create({
    data: { userId, title, message, channel, data: data as Prisma.InputJsonValue | undefined },
  });
}
