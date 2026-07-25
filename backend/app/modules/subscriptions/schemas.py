from typing import Any

from pydantic import BaseModel, Field


class CreateSubscriptionPlanInput(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    price: float = Field(ge=0)
    durationDays: int = Field(gt=0)
    maxVehicles: int | None = Field(default=None, gt=0)
    features: dict[str, Any] | None = None
    isActive: bool | None = None


class UpdateSubscriptionPlanInput(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    price: float | None = Field(default=None, ge=0)
    durationDays: int | None = Field(default=None, gt=0)
    maxVehicles: int | None = Field(default=None, gt=0)
    features: dict[str, Any] | None = None
    isActive: bool | None = None


class RequestSubscriptionInput(BaseModel):
    planId: str
