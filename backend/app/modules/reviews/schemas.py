from pydantic import BaseModel, Field


class CreateReviewInput(BaseModel):
    bookingId: str
    vehicleRating: int = Field(ge=1, le=5)
    partnerRating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)
    imageUrls: list[str] | None = Field(default=None, max_length=6)


class ReplyInput(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


class ReportInput(BaseModel):
    reason: str = Field(min_length=1, max_length=500)
