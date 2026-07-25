import traceback

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.responses import ApiError


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def handle_api_error(request: Request, exc: ApiError) -> JSONResponse:
        body: dict = {"success": False, "message": exc.message}
        if exc.details is not None:
            body["details"] = exc.details
        return JSONResponse(status_code=exc.status_code, content=body)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "Validation failed", "details": exc.errors()},
        )

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_exception(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        if exc.status_code == 404:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": f"Route not found: {request.method} {request.url.path}"},
            )
        return JSONResponse(status_code=exc.status_code, content={"success": False, "message": str(exc.detail)})

    @app.exception_handler(IntegrityError)
    async def handle_integrity_error(request: Request, exc: IntegrityError) -> JSONResponse:
        message = str(exc.orig).lower()
        if "unique" in message or "duplicate" in message:
            return JSONResponse(status_code=409, content={"success": False, "message": "Duplicate value for unique field"})
        if "foreign key" in message:
            return JSONResponse(status_code=409, content={"success": False, "message": "Related resource not found"})
        return JSONResponse(status_code=409, content={"success": False, "message": "Database constraint violation"})

    @app.exception_handler(Exception)
    async def handle_generic_error(request: Request, exc: Exception) -> JSONResponse:
        traceback.print_exc()
        body: dict = {"success": False, "message": "Internal server error"}
        if not settings.is_production:
            body["stack"] = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
        return JSONResponse(status_code=500, content=body)
