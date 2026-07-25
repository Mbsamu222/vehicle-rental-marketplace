from typing import Literal

from pydantic import BaseModel, EmailStr, Field

DocumentType = Literal["BUSINESS_LICENSE", "GST_CERTIFICATE", "IDENTITY_PROOF", "ADDRESS_PROOF", "BANK_PROOF", "OTHER"]


class CreatePartnerProfileInput(BaseModel):
    businessName: str = Field(min_length=1, max_length=200)
    businessEmail: EmailStr
    businessPhone: str = Field(min_length=7, max_length=20)
    cityId: str
    address: str = Field(min_length=1)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    logoUrl: str | None = None
    description: str | None = Field(default=None, max_length=2000)


class UpdatePartnerProfileInput(BaseModel):
    businessName: str | None = Field(default=None, min_length=1, max_length=200)
    businessEmail: EmailStr | None = None
    businessPhone: str | None = Field(default=None, min_length=7, max_length=20)
    cityId: str | None = None
    address: str | None = Field(default=None, min_length=1)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    logoUrl: str | None = None
    description: str | None = Field(default=None, max_length=2000)


class UploadDocumentInput(BaseModel):
    type: DocumentType
    fileUrl: str


class ReviewDocumentInput(BaseModel):
    status: Literal["APPROVED", "REJECTED"]
    rejectionReason: str | None = Field(default=None, max_length=500)


class SetBankDetailsInput(BaseModel):
    accountHolder: str = Field(min_length=1, max_length=150)
    accountNumber: str = Field(min_length=4, max_length=34)
    ifscCode: str = Field(min_length=4, max_length=20)
    bankName: str = Field(min_length=1, max_length=150)
    branch: str | None = Field(default=None, max_length=150)
    upiId: str | None = Field(default=None, max_length=50)


class UpdateVerificationStatusInput(BaseModel):
    status: Literal["UNDER_REVIEW", "VERIFIED", "REJECTED"]
