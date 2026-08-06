from typing import Any, Literal

from pydantic import BaseModel, Field

BlogStatusLiteral = Literal["DRAFT", "PUBLISHED"]
AccountStatusLiteral = Literal["ACTIVE", "SUSPENDED", "BANNED"]
DrivingLicenseReviewStatus = Literal["VERIFIED", "REJECTED"]


class CreateRoleInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    permissionIds: list[str] = Field(default_factory=list)


class UpdateRoleInput(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    permissionIds: list[str] | None = None


class AssignRoleInput(BaseModel):
    roleId: str


class UpdateUserStatusInput(BaseModel):
    status: AccountStatusLiteral


class UpsertCmsPageInput(BaseModel):
    slug: str = Field(min_length=1, max_length=150)
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)


class UpsertBlogPostInput(BaseModel):
    slug: str = Field(min_length=1, max_length=150)
    title: str = Field(min_length=1, max_length=200)
    excerpt: str | None = Field(default=None, max_length=500)
    content: str = Field(min_length=1)
    coverImageUrl: str | None = None
    status: BlogStatusLiteral = "DRAFT"


class UpsertSettingInput(BaseModel):
    value: Any = None


class ReviewDrivingLicenseInput(BaseModel):
    status: DrivingLicenseReviewStatus
    rejectionReason: str | None = Field(default=None, max_length=500)


class CreateHeroBannerSlideInput(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    subtitle: str | None = Field(default=None, max_length=300)
    imageUrl: str
    ctaLabel: str | None = Field(default=None, max_length=50)
    ctaUrl: str | None = Field(default=None, max_length=500)
    sortOrder: int = 0
    isActive: bool | None = None
    isSponsored: bool | None = None
    sponsorName: str | None = Field(default=None, max_length=200)
    amountCharged: float | None = Field(default=None, ge=0)


class UpdateHeroBannerSlideInput(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    subtitle: str | None = Field(default=None, max_length=300)
    imageUrl: str | None = None
    ctaLabel: str | None = Field(default=None, max_length=50)
    ctaUrl: str | None = Field(default=None, max_length=500)
    sortOrder: int | None = None
    isActive: bool | None = None
    isSponsored: bool | None = None
    sponsorName: str | None = Field(default=None, max_length=200)
    amountCharged: float | None = Field(default=None, ge=0)


AffiliateCategoryLiteral = Literal["INSURANCE", "ROADSIDE_ASSISTANCE", "FUEL", "OTHER"]


class CreateAdSlotInput(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    subtitle: str | None = Field(default=None, max_length=300)
    imageUrl: str
    ctaLabel: str | None = Field(default=None, max_length=50)
    ctaUrl: str | None = Field(default=None, max_length=500)
    sponsorName: str | None = Field(default=None, max_length=200)
    amountCharged: float | None = Field(default=None, ge=0)
    sortOrder: int = 0
    isActive: bool | None = None


class UpdateAdSlotInput(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    subtitle: str | None = Field(default=None, max_length=300)
    imageUrl: str | None = None
    ctaLabel: str | None = Field(default=None, max_length=50)
    ctaUrl: str | None = Field(default=None, max_length=500)
    sponsorName: str | None = Field(default=None, max_length=200)
    amountCharged: float | None = Field(default=None, ge=0)
    sortOrder: int | None = None
    isActive: bool | None = None


class CreateAffiliatePartnerInput(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    category: AffiliateCategoryLiteral
    tagline: str | None = Field(default=None, max_length=500)
    ctaLabel: str | None = Field(default=None, max_length=50)
    referralUrl: str
    logoUrl: str | None = None
    sortOrder: int = 0
    isActive: bool | None = None


class UpdateAffiliatePartnerInput(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    category: AffiliateCategoryLiteral | None = None
    tagline: str | None = Field(default=None, max_length=500)
    ctaLabel: str | None = Field(default=None, max_length=50)
    referralUrl: str | None = None
    logoUrl: str | None = None
    sortOrder: int | None = None
    isActive: bool | None = None


class UpsertSeoSettingInput(BaseModel):
    """All meta fields are optional: an unset field means "fall back to the
    value the site computes in code", not "blank this tag out"."""

    path: str = Field(min_length=1, max_length=200)
    title: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=400)
    keywords: str | None = Field(default=None, max_length=1000)
    ogImageUrl: str | None = None
    noIndex: bool = False


class UpdateVehicleSeoInput(BaseModel):
    seoTitle: str | None = Field(default=None, max_length=200)
    seoDescription: str | None = Field(default=None, max_length=400)
