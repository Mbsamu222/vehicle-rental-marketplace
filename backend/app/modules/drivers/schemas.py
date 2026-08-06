from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

DriverDocumentTypeInput = Literal[
    "DRIVING_LICENSE", "IDENTITY_PROOF", "ADDRESS_PROOF", "POLICE_VERIFICATION", "PHOTO"
]
VerificationStatusInput = Literal["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED", "SUSPENDED"]


class CreateDriverProfileInput(BaseModel):
    cityId: str
    licenseNumber: str = Field(min_length=4, max_length=32)
    licenseExpiry: datetime
    yearsOfExperience: int = Field(default=0, ge=0, le=60)
    dailyRate: float = Field(gt=0)
    hourlyRate: float = Field(gt=0)
    bio: str | None = Field(default=None, max_length=1000)
    photoUrl: str | None = None
    languages: str | None = Field(default=None, max_length=200)


class UpdateDriverProfileInput(BaseModel):
    dailyRate: float | None = Field(default=None, gt=0)
    hourlyRate: float | None = Field(default=None, gt=0)
    bio: str | None = Field(default=None, max_length=1000)
    photoUrl: str | None = None
    languages: str | None = Field(default=None, max_length=200)
    isAvailable: bool | None = None


class UploadDriverDocumentInput(BaseModel):
    type: DriverDocumentTypeInput
    fileUrl: str = Field(min_length=1)


class ReviewDriverInput(BaseModel):
    status: VerificationStatusInput
    rejectionReason: str | None = Field(default=None, max_length=500)


class RequestDriverInput(BaseModel):
    driverId: str


class RespondAssignmentInput(BaseModel):
    accept: bool
    declineReason: str | None = Field(default=None, max_length=500)
