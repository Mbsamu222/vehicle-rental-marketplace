from typing import Annotated

from fastapi import Path

# Mirrors the Express routes' `z.object({ id: z.string().uuid() })` param validation.
UuidPath = Annotated[
    str,
    Path(pattern=r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"),
]
