from typing import Literal

from pydantic import BaseModel, Field

PaymentProviderLiteral = Literal["RAZORPAY", "STRIPE", "WALLET"]


class CreatePaymentOrderInput(BaseModel):
    bookingId: str
    provider: PaymentProviderLiteral


class VerifyPaymentInput(BaseModel):
    paymentId: str
    providerRefId: str = Field(min_length=1)
    providerSignature: str | None = Field(default=None, min_length=1)


class RefundPaymentInput(BaseModel):
    amount: float | None = Field(default=None, gt=0)
    reason: str | None = Field(default=None, max_length=500)
