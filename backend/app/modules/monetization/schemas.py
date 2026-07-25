from typing import Any

from pydantic import BaseModel


class UpdateFeatureInput(BaseModel):
    isEnabled: bool | None = None
    config: dict[str, Any] | None = None
