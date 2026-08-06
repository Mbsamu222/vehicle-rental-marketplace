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


# ── Handover / return inspections ────────────────────────────────────────

InspectionTypeInput = Literal["PICKUP", "RETURN"]
FuelLevelInput = Literal["EMPTY", "QUARTER", "HALF", "THREE_QUARTER", "FULL"]


class InspectionPhotoInput(BaseModel):
    url: str = Field(min_length=1)
    # Which angle was shot, so a RETURN photo can be compared against the same
    # angle from PICKUP: front, rear, left, right, interior, odometer, damage.
    label: str | None = Field(default=None, max_length=40)


class CreateInspectionInput(BaseModel):
    type: InspectionTypeInput
    odometerKm: int = Field(ge=0, le=10_000_000)
    fuelLevel: FuelLevelInput
    exteriorNotes: str | None = Field(default=None, max_length=2000)
    interiorNotes: str | None = Field(default=None, max_length=2000)
    damageNotes: str | None = Field(default=None, max_length=2000)
    customerAcknowledged: bool = False
    photos: list[InspectionPhotoInput] = Field(default_factory=list, max_length=20)


# ── Booking extensions ───────────────────────────────────────────────────


class RequestExtensionInput(BaseModel):
    requestedReturnDatetime: datetime


class DecideExtensionInput(BaseModel):
    approve: bool
    rejectionReason: str | None = Field(default=None, max_length=500)


# ── Traffic fines ────────────────────────────────────────────────────────

TrafficFineStatusInput = Literal[
    "PENDING", "NOTIFIED", "PAID_BY_CUSTOMER", "DEDUCTED_FROM_DEPOSIT", "WAIVED", "DISPUTED"
]


class CreateTrafficFineInput(BaseModel):
    bookingId: str
    violationAt: datetime
    amount: float = Field(gt=0)
    challanNumber: str | None = Field(default=None, max_length=64)
    description: str | None = Field(default=None, max_length=1000)
    evidenceUrl: str | None = None


class UpdateTrafficFineStatusInput(BaseModel):
    status: TrafficFineStatusInput
