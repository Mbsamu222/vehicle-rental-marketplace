from typing import Literal

from pydantic import BaseModel, Field


class SyncInput(BaseModel):
    """Profile fields supplied on first sync (account creation). Ignored on
    subsequent calls except firstName/lastName/phone, which are patched if present."""

    firstName: str | None = Field(default=None, min_length=1, max_length=100)
    lastName: str | None = Field(default=None, min_length=1, max_length=100)
    phone: str | None = Field(default=None, min_length=7, max_length=20)
    userType: Literal["CUSTOMER", "RENTAL_PARTNER"] = "CUSTOMER"
    referralCode: str | None = None


class LookupInput(BaseModel):
    phone: str = Field(min_length=7, max_length=20)
