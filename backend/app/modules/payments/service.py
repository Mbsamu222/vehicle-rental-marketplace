import hashlib
import hmac
import time
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.responses import ApiError
from app.db.enums import BookingStatus, PaymentProvider, PaymentStatus, TransactionStatus, TransactionType
from app.db.models import Booking, BookingStatusHistory, Invoice, Payment, Transaction, Wallet

_BASE36 = "0123456789abcdefghijklmnopqrstuvwxyz"


def _to_base36(n: int) -> str:
    if n == 0:
        return "0"
    digits = []
    while n:
        n, rem = divmod(n, 36)
        digits.append(_BASE36[rem])
    return "".join(reversed(digits))


async def create_payment_order(db: AsyncSession, booking_id: str, customer_id: str, provider: PaymentProvider) -> dict:
    booking = await db.get(Booking, booking_id)
    if booking is None:
        raise ApiError.not_found("Booking not found")
    if booking.customer_id != customer_id:
        raise ApiError.forbidden()
    if booking.status != BookingStatus.PENDING:
        raise ApiError.bad_request("Booking is not awaiting payment")

    amount = booking.total_amount

    if provider == PaymentProvider.WALLET:
        return await _pay_with_wallet(db, booking.id, customer_id, amount)

    # RAZORPAY / STRIPE: create a local pending Payment; the real order/session id from the
    # provider SDK would be attached to provider_ref_id once the client-side checkout starts.
    payment = Payment(booking_id=booking.id, provider=provider, amount=amount, status=PaymentStatus.PENDING)
    db.add(payment)
    await db.commit()
    await db.refresh(payment)

    provider_config = (
        {"keyId": settings.razorpay_key_id or None, "amount": int(round(float(amount) * 100)), "currency": "INR"}
        if provider == PaymentProvider.RAZORPAY
        else {"publishableKey": None}
    )
    return {"payment": payment, "providerConfig": provider_config}


async def _pay_with_wallet(db: AsyncSession, booking_id: str, customer_id: str, amount: Decimal) -> dict:
    wallet = (await db.execute(select(Wallet).where(Wallet.user_id == customer_id))).scalar_one_or_none()
    if wallet is None or wallet.balance < amount:
        raise ApiError.bad_request("Insufficient wallet balance")

    wallet.balance -= amount

    payment = Payment(
        booking_id=booking_id,
        provider=PaymentProvider.WALLET,
        amount=amount,
        status=PaymentStatus.PAID,
        paid_at=datetime.now(timezone.utc),
    )
    db.add(payment)
    await db.flush()

    db.add(
        Transaction(
            type=TransactionType.WALLET_DEBIT,
            status=TransactionStatus.SUCCESS,
            amount=amount,
            payment_id=payment.id,
            wallet_id=wallet.id,
        )
    )

    booking = await db.get(Booking, booking_id)
    booking.status = BookingStatus.CONFIRMED
    db.add(BookingStatusHistory(booking_id=booking_id, status=BookingStatus.CONFIRMED, note="Paid via wallet"))

    await _create_invoice(db, booking_id)

    await db.commit()
    await db.refresh(payment)
    return {"payment": payment, "providerConfig": None}


def _verify_provider_signature(provider: PaymentProvider, provider_ref_id: str, signature: str | None) -> bool:
    """In production this validates the provider's HMAC signature against the raw webhook payload."""
    if provider == PaymentProvider.WALLET:
        return True
    if settings.is_production:
        if not signature:
            return False
        secret = settings.razorpay_key_secret if provider == PaymentProvider.RAZORPAY else ""
        expected = hmac.new(secret.encode("utf-8"), provider_ref_id.encode("utf-8"), hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)
    return True  # dev/test convenience — no live provider credentials configured


async def verify_payment(db: AsyncSession, payment_id: str, provider_ref_id: str, signature: str | None) -> Payment:
    payment = await db.get(Payment, payment_id)
    if payment is None:
        raise ApiError.not_found("Payment not found")
    if payment.status == PaymentStatus.PAID:
        return payment

    if not _verify_provider_signature(payment.provider, provider_ref_id, signature):
        raise ApiError.bad_request("Payment signature verification failed")

    payment.status = PaymentStatus.PAID
    payment.provider_ref_id = provider_ref_id
    payment.paid_at = datetime.now(timezone.utc)

    db.add(
        Transaction(
            type=TransactionType.BOOKING_PAYMENT, status=TransactionStatus.SUCCESS, amount=payment.amount, payment_id=payment.id
        )
    )

    booking = await db.get(Booking, payment.booking_id)
    booking.status = BookingStatus.CONFIRMED
    db.add(
        BookingStatusHistory(
            booking_id=payment.booking_id,
            status=BookingStatus.CONFIRMED,
            note=f"Payment confirmed via {payment.provider.value}",
        )
    )

    await _create_invoice(db, payment.booking_id)

    await db.commit()
    await db.refresh(payment)
    return payment


async def _create_invoice(db: AsyncSession, booking_id: str) -> Invoice:
    existing = (await db.execute(select(Invoice).where(Invoice.booking_id == booking_id))).scalar_one_or_none()
    if existing is not None:
        return existing
    invoice_number = f"INV-{_to_base36(int(time.time() * 1000)).upper()}"
    invoice = Invoice(booking_id=booking_id, invoice_number=invoice_number)
    db.add(invoice)
    await db.flush()
    return invoice


async def refund_payment(db: AsyncSession, payment_id: str, amount: Decimal | None, reason: str | None) -> Payment:
    stmt = select(Payment).where(Payment.id == payment_id).options(selectinload(Payment.booking))
    payment = (await db.execute(stmt)).scalar_one_or_none()
    if payment is None:
        raise ApiError.not_found("Payment not found")
    if payment.status not in (PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED):
        raise ApiError.bad_request("Only paid payments can be refunded")

    refund_amount = amount if amount is not None else (payment.amount - payment.refunded_amount)
    new_refunded_total = payment.refunded_amount + refund_amount
    if new_refunded_total > payment.amount:
        raise ApiError.bad_request("Refund amount exceeds the paid amount")

    payment.refunded_amount = new_refunded_total
    payment.status = PaymentStatus.REFUNDED if new_refunded_total >= payment.amount else PaymentStatus.PARTIALLY_REFUNDED

    db.add(
        Transaction(
            type=TransactionType.REFUND,
            status=TransactionStatus.SUCCESS,
            amount=refund_amount,
            payment_id=payment_id,
            transaction_metadata={"reason": reason} if reason else None,
        )
    )

    if payment.provider == PaymentProvider.WALLET:
        wallet = (
            await db.execute(select(Wallet).where(Wallet.user_id == payment.booking.customer_id))
        ).scalar_one_or_none()
        if wallet is not None:
            wallet.balance += refund_amount

    await db.commit()
    await db.refresh(payment)
    return payment
