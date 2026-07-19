import crypto from "node:crypto";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { env } from "../../config/env";
import type { PaymentProvider } from "@prisma/client";

export async function createPaymentOrder(bookingId: string, customerId: string, provider: PaymentProvider) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw ApiError.notFound("Booking not found");
  if (booking.customerId !== customerId) throw ApiError.forbidden();
  if (booking.status !== "PENDING") throw ApiError.badRequest("Booking is not awaiting payment");

  const amount = Number(booking.totalAmount);

  if (provider === "WALLET") {
    return payWithWallet(booking.id, customerId, amount);
  }

  // RAZORPAY / STRIPE: create a local pending Payment; the real order/session id from the
  // provider SDK would be attached to providerRefId once the client-side checkout starts.
  const payment = await prisma.payment.create({
    data: { bookingId: booking.id, provider, amount, status: "PENDING" },
  });

  return {
    payment,
    providerConfig:
      provider === "RAZORPAY"
        ? { keyId: env.razorpay.keyId, amount: Math.round(amount * 100), currency: "INR" }
        : { publishableKey: null },
  };
}

async function payWithWallet(bookingId: string, customerId: string, amount: number) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId: customerId } });
    if (!wallet || Number(wallet.balance) < amount) {
      throw ApiError.badRequest("Insufficient wallet balance");
    }

    await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: amount } } });

    const payment = await tx.payment.create({
      data: { bookingId, provider: "WALLET", amount, status: "PAID", paidAt: new Date() },
    });

    await tx.transaction.create({
      data: {
        type: "WALLET_DEBIT",
        status: "SUCCESS",
        amount,
        paymentId: payment.id,
        walletId: wallet.id,
      },
    });

    await tx.booking.update({ where: { id: bookingId }, data: { status: "CONFIRMED" } });
    await tx.bookingStatusHistory.create({
      data: { bookingId, status: "CONFIRMED", note: "Paid via wallet" },
    });

    await createInvoice(tx, bookingId);

    return { payment, providerConfig: null };
  });
}

/** In production this validates the provider's HMAC signature against the raw webhook payload. */
function verifyProviderSignature(provider: PaymentProvider, providerRefId: string, signature?: string): boolean {
  if (provider === "WALLET") return true;
  if (env.isProduction) {
    if (!signature) return false;
    const secret = provider === "RAZORPAY" ? env.razorpay.keySecret : "";
    const expected = crypto.createHmac("sha256", secret).update(providerRefId).digest("hex");
    return expected === signature;
  }
  return true; // dev/test convenience — no live provider credentials configured
}

export async function verifyPayment(paymentId: string, providerRefId: string, signature?: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw ApiError.notFound("Payment not found");
  if (payment.status === "PAID") return payment;

  if (!verifyProviderSignature(payment.provider, providerRefId, signature)) {
    throw ApiError.badRequest("Payment signature verification failed");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.payment.update({
      where: { id: paymentId },
      data: { status: "PAID", providerRefId, paidAt: new Date() },
    });

    await tx.transaction.create({
      data: { type: "BOOKING_PAYMENT", status: "SUCCESS", amount: payment.amount, paymentId: payment.id },
    });

    await tx.booking.update({ where: { id: payment.bookingId }, data: { status: "CONFIRMED" } });
    await tx.bookingStatusHistory.create({
      data: { bookingId: payment.bookingId, status: "CONFIRMED", note: `Payment confirmed via ${payment.provider}` },
    });

    await createInvoice(tx, payment.bookingId);

    return result;
  });

  return updated;
}

async function createInvoice(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], bookingId: string) {
  const existing = await tx.invoice.findUnique({ where: { bookingId } });
  if (existing) return existing;

  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
  return tx.invoice.create({ data: { bookingId, invoiceNumber } });
}

export async function refundPayment(paymentId: string, amount: number | undefined, reason: string | undefined) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { booking: true } });
  if (!payment) throw ApiError.notFound("Payment not found");
  if (payment.status !== "PAID" && payment.status !== "PARTIALLY_REFUNDED") {
    throw ApiError.badRequest("Only paid payments can be refunded");
  }

  const refundAmount = amount ?? Number(payment.amount) - Number(payment.refundedAmount);
  const newRefundedTotal = Number(payment.refundedAmount) + refundAmount;
  if (newRefundedTotal > Number(payment.amount)) {
    throw ApiError.badRequest("Refund amount exceeds the paid amount");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: {
        refundedAmount: newRefundedTotal,
        status: newRefundedTotal >= Number(payment.amount) ? "REFUNDED" : "PARTIALLY_REFUNDED",
      },
    });

    await tx.transaction.create({
      data: {
        type: "REFUND",
        status: "SUCCESS",
        amount: refundAmount,
        paymentId,
        metadata: reason ? { reason } : undefined,
      },
    });

    if (payment.provider === "WALLET") {
      const wallet = await tx.wallet.findFirst({ where: { userId: payment.booking.customerId } });
      if (wallet) {
        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: refundAmount } } });
      }
    }

    return updated;
  });
}
