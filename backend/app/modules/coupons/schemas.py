from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

CouponTypeLiteral = Literal["FLAT", "PERCENTAGE"]


class CreateCouponInput(BaseModel):
    code: str = Field(min_length=3, max_length=30)
    type: CouponTypeLiteral
    value: float = Field(gt=0)
    maxDiscount: float | None = Field(default=None, gt=0)
    minBookingValue: float | None = Field(default=None, ge=0)
    usageLimit: int | None = Field(default=None, gt=0)
    perUserLimit: int = Field(default=1, gt=0)
    validFrom: datetime
    validUntil: datetime

    @field_validator("code")
    @classmethod
    def _upper(cls, v: str) -> str:
        return v.upper()


class UpdateCouponInput(BaseModel):
    code: str | None = Field(default=None, min_length=3, max_length=30)
    type: CouponTypeLiteral | None = None
    value: float | None = Field(default=None, gt=0)
    maxDiscount: float | None = Field(default=None, gt=0)
    minBookingValue: float | None = Field(default=None, ge=0)
    usageLimit: int | None = Field(default=None, gt=0)
    perUserLimit: int | None = Field(default=None, gt=0)
    validFrom: datetime | None = None
    validUntil: datetime | None = None
    isActive: bool | None = None

    @field_validator("code")
    @classmethod
    def _upper(cls, v: str | None) -> str | None:
        return v.upper() if v else v


class ValidateCouponInput(BaseModel):
    code: str = Field(min_length=1)
    bookingAmount: float = Field(gt=0)
