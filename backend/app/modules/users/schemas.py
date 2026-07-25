from datetime import date

from pydantic import BaseModel, Field


class UpdateProfileInput(BaseModel):
    firstName: str | None = Field(default=None, min_length=1, max_length=100)
    lastName: str | None = Field(default=None, min_length=1, max_length=100)
    phone: str | None = Field(default=None, min_length=7, max_length=20)
    avatarUrl: str | None = None


class AddDrivingLicenseInput(BaseModel):
    licenseNumber: str = Field(min_length=4, max_length=50)
    frontImageUrl: str
    backImageUrl: str | None = None
    expiryDate: date


class AddSavedLocationInput(BaseModel):
    cityId: str
    label: str = Field(min_length=1, max_length=100)
    address: str = Field(min_length=1)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
