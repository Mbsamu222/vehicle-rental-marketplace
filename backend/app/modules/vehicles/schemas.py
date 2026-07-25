from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Transmission = Literal["MANUAL", "AUTOMATIC"]
FuelType = Literal["PETROL", "DIESEL", "ELECTRIC", "HYBRID", "CNG"]


class CreateVehicleInput(BaseModel):
    categoryId: str
    brandId: str
    cityId: str
    model: str = Field(min_length=1, max_length=150)
    year: int
    registrationNumber: str = Field(min_length=3, max_length=30)
    transmission: Transmission
    fuelType: FuelType
    seatingCapacity: int = Field(ge=1, le=100)
    pricePerHour: float = Field(gt=0)
    pricePerDay: float = Field(gt=0)
    securityDeposit: float = Field(default=0, ge=0)
    insuranceDetails: str | None = Field(default=None, max_length=2000)
    rentalPolicies: str | None = Field(default=None, max_length=4000)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class UpdateVehicleInput(BaseModel):
    categoryId: str | None = None
    brandId: str | None = None
    cityId: str | None = None
    model: str | None = Field(default=None, min_length=1, max_length=150)
    year: int | None = None
    registrationNumber: str | None = Field(default=None, min_length=3, max_length=30)
    transmission: Transmission | None = None
    fuelType: FuelType | None = None
    seatingCapacity: int | None = Field(default=None, ge=1, le=100)
    pricePerHour: float | None = Field(default=None, gt=0)
    pricePerDay: float | None = Field(default=None, gt=0)
    securityDeposit: float | None = Field(default=None, ge=0)
    insuranceDetails: str | None = Field(default=None, max_length=2000)
    rentalPolicies: str | None = Field(default=None, max_length=4000)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class VehicleImageInput(BaseModel):
    url: str
    isPrimary: bool | None = None
    sortOrder: int | None = None


class AddImagesInput(BaseModel):
    images: list[VehicleImageInput] = Field(min_length=1)


class BlockAvailabilityInput(BaseModel):
    startDate: datetime
    endDate: datetime
    reason: str | None = Field(default=None, max_length=200)


class ApproveVehicleInput(BaseModel):
    status: Literal["APPROVED", "REJECTED"]
    rejectionReason: str | None = Field(default=None, max_length=500)


class BoostVehicleInput(BaseModel):
    days: int = Field(gt=0, le=365)
    amountCharged: float = Field(default=0, ge=0)
