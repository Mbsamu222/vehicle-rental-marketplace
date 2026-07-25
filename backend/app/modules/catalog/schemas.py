from pydantic import BaseModel, Field


class CreateCountryInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    code: str = Field(min_length=2, max_length=3)


class UpdateCountryInput(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    code: str | None = Field(default=None, min_length=2, max_length=3)
    isActive: bool | None = None


class CreateCityInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    countryId: str
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    isPopular: bool | None = None
    imageUrl: str | None = None


class UpdateCityInput(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    countryId: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    isPopular: bool | None = None
    imageUrl: str | None = None
    isActive: bool | None = None


class CreateCategoryInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=100)
    iconUrl: str | None = None


class UpdateCategoryInput(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    slug: str | None = Field(default=None, min_length=1, max_length=100)
    iconUrl: str | None = None
    isActive: bool | None = None


class CreateBrandInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    logoUrl: str | None = None


class UpdateBrandInput(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    logoUrl: str | None = None
    isActive: bool | None = None
