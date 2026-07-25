from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

UpdatableBookingStatus = Literal["APPROVED", "REJECTED", "VEHICLE_READY", "PICKED_UP", "ACTIVE", "RETURNING", "COMPLETED"]


class CreateBookingInput(BaseModel):
    vehicleId: str
    drivingLicenseId: str
    pickupDatetime: datetime
    returnDatetime: datetime
    pickupLocation: str = Field(min_length=1)
    returnLocation: str = Field(min_length=1)
    couponCode: str | None = None
    extraDriverCount: int = Field(default=0, ge=0, le=5)
    isYoungDriver: bool = False

    @field_validator("returnDatetime")
    @classmethod
    def _after_pickup(cls, v: datetime, info) -> datetime:
        pickup = info.data.get("pickupDatetime")
        if pickup is not None and v <= pickup:
            raise ValueError("returnDatetime must be after pickupDatetime")
        return v


class CancelBookingInput(BaseModel):
    reason: str | None = Field(default=None, max_length=500)


class UpdateStatusInput(BaseModel):
    status: UpdatableBookingStatus
    note: str | None = Field(default=None, max_length=500)
    actualReturnAt: datetime | None = None
