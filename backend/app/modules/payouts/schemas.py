from pydantic import BaseModel


class CreatePayoutInput(BaseModel):
    rentalPartnerId: str
