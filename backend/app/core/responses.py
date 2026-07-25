from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse


class ApiError(Exception):
    def __init__(self, status_code: int, message: str, details: Any = None):
        self.status_code = status_code
        self.message = message
        self.details = details
        super().__init__(message)

    @classmethod
    def bad_request(cls, message: str, details: Any = None) -> "ApiError":
        return cls(400, message, details)

    @classmethod
    def unauthorized(cls, message: str = "Unauthorized") -> "ApiError":
        return cls(401, message)

    @classmethod
    def forbidden(cls, message: str = "Forbidden") -> "ApiError":
        return cls(403, message)

    @classmethod
    def not_found(cls, message: str = "Resource not found") -> "ApiError":
        return cls(404, message)

    @classmethod
    def conflict(cls, message: str) -> "ApiError":
        return cls(409, message)

    @classmethod
    def internal(cls, message: str = "Internal server error") -> "ApiError":
        return cls(500, message)


def _iso(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


_CUSTOM_ENCODERS = {Decimal: str, datetime: _iso}


def success_response(data: Any, status_code: int = 200, meta: dict | None = None) -> JSONResponse:
    body: dict[str, Any] = {"success": True, "data": jsonable_encoder(data, custom_encoder=_CUSTOM_ENCODERS)}
    if meta is not None:
        body["meta"] = jsonable_encoder(meta, custom_encoder=_CUSTOM_ENCODERS)
    return JSONResponse(status_code=status_code, content=body)


def pagination_meta(page: int, limit: int, total: int) -> dict[str, Any]:
    return {
        "page": page,
        "limit": limit,
        "total": total,
        "totalPages": max(1, -(-total // limit)),
    }
