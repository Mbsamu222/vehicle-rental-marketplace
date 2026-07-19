import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, paginationMeta } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../config/prisma";
import { getPagination } from "../../utils/pagination";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const partner = await prisma.rentalPartner.findUnique({ where: { userId: req.user!.id } });

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: req.user!.id,
      rentalPartnerId: partner?.id,
      subject: req.body.subject,
      messages: { create: { authorId: req.user!.id, message: req.body.message } },
    },
    include: { messages: true },
  });
  return sendSuccess(res, ticket, 201);
});

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, take } = getPagination(req);
  const where = { userId: req.user!.id };
  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({ where, skip, take, orderBy: { updatedAt: "desc" } }),
    prisma.supportTicket.count({ where }),
  ]);
  return sendSuccess(res, tickets, 200, paginationMeta(page, limit, total));
});

async function getTicketWithAccessCheck(ticketId: string, userId: string, userType: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: { messages: { orderBy: { createdAt: "asc" }, include: { author: true } } },
  });
  if (!ticket) throw ApiError.notFound("Support ticket not found");
  const isAdmin = userType === "ADMIN" || userType === "SUPER_ADMIN";
  if (ticket.userId !== userId && !isAdmin) throw ApiError.forbidden();
  return ticket;
}

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await getTicketWithAccessCheck(req.params.id, req.user!.id, req.user!.userType);
  return sendSuccess(res, ticket);
});

export const addMessage = asyncHandler(async (req: Request, res: Response) => {
  await getTicketWithAccessCheck(req.params.id, req.user!.id, req.user!.userType);
  const message = await prisma.supportTicketMessage.create({
    data: { ticketId: req.params.id, authorId: req.user!.id, message: req.body.message },
  });
  await prisma.supportTicket.update({ where: { id: req.params.id }, data: { updatedAt: new Date() } });
  return sendSuccess(res, message, 201);
});

// ─── Admin ───

export const listAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, take } = getPagination(req);
  const { status } = req.query as { status?: string };
  const where = status ? { status: status as never } : {};
  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({ where, skip, take, orderBy: { updatedAt: "desc" }, include: { user: true } }),
    prisma.supportTicket.count({ where }),
  ]);
  return sendSuccess(res, tickets, 200, paginationMeta(page, limit, total));
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await prisma.supportTicket.update({
    where: { id: req.params.id },
    data: { status: req.body.status },
  });
  return sendSuccess(res, ticket);
});
