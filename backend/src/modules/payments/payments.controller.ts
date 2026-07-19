import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, paginationMeta } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../config/prisma";
import { getPagination } from "../../utils/pagination";
import * as paymentsService from "./payments.service";

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId, provider } = req.body;
  const result = await paymentsService.createPaymentOrder(bookingId, req.user!.id, provider);
  return sendSuccess(res, result, 201);
});

export const verify = asyncHandler(async (req: Request, res: Response) => {
  const { paymentId, providerRefId, providerSignature } = req.body;
  const payment = await paymentsService.verifyPayment(paymentId, providerRefId, providerSignature);
  return sendSuccess(res, payment);
});

export const listMyPayments = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, take } = getPagination(req);
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: { booking: { customerId: req.user!.id } },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { booking: true },
    }),
    prisma.payment.count({ where: { booking: { customerId: req.user!.id } } }),
  ]);
  return sendSuccess(res, payments, 200, paginationMeta(page, limit, total));
});

export const getWallet = asyncHandler(async (req: Request, res: Response) => {
  const wallet = await prisma.wallet.findUnique({
    where: { userId: req.user!.id },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
  });
  if (!wallet) throw ApiError.notFound("Wallet not found");
  return sendSuccess(res, wallet);
});

// ─── Admin ───

export const refund = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentsService.refundPayment(req.params.id, req.body.amount, req.body.reason);
  return sendSuccess(res, payment);
});

export const listTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, take } = getPagination(req);
  const { type, rentalPartnerId } = req.query as { type?: string; rentalPartnerId?: string };
  const where = {
    ...(type ? { type: type as never } : {}),
    ...(rentalPartnerId ? { rentalPartnerId } : {}),
  };
  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.transaction.count({ where }),
  ]);
  return sendSuccess(res, transactions, 200, paginationMeta(page, limit, total));
});
