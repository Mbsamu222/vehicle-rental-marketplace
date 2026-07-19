import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, paginationMeta } from "../../utils/ApiResponse";
import { prisma } from "../../config/prisma";
import { getPagination } from "../../utils/pagination";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, take } = getPagination(req);
  const { unreadOnly } = req.query as { unreadOnly?: string };
  const where = { userId: req.user!.id, ...(unreadOnly === "true" ? { readAt: null } : {}) };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: req.user!.id, readAt: null } }),
  ]);

  return sendSuccess(res, notifications, 200, { ...paginationMeta(page, limit, total), unreadCount });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: { readAt: new Date() },
  });
  return sendSuccess(res, { message: "Marked as read" });
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, readAt: null },
    data: { readAt: new Date() },
  });
  return sendSuccess(res, { message: "All notifications marked as read" });
});
