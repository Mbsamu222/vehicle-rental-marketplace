from typing import Literal

from pydantic import BaseModel, Field

SupportTicketStatusLiteral = Literal["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]


class CreateTicketInput(BaseModel):
    subject: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=4000)


class AddMessageInput(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


class UpdateTicketStatusInput(BaseModel):
    status: SupportTicketStatusLiteral
