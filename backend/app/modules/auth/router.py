from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.firebase import verify_id_token
from app.core.rate_limit import AUTH_RATE_LIMIT, limiter
from app.core.responses import ApiError, success_response
from app.db.models import User
from app.db.session import get_db
from app.deps.auth import AuthUser, get_current_user
from app.modules.auth import service
from app.modules.auth.schemas import LookupInput, SyncInput

router = APIRouter()


def _require_decoded_token(authorization: str | None) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise ApiError.unauthorized("Missing or malformed Authorization header")
    try:
        return verify_id_token(authorization[len("Bearer ") :])
    except Exception:
        raise ApiError.unauthorized("Invalid or expired access token")


@router.post("/sync")
@limiter.limit(AUTH_RATE_LIMIT)
async def sync(
    request: Request,
    payload: SyncInput,
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
):
    decoded = _require_decoded_token(authorization)
    result = await service.sync(db, decoded, payload.model_dump(exclude_none=True))
    return success_response(result)


@router.get("/me")
async def me(user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    db_user = await db.get(User, user.id)
    if db_user is None:
        raise ApiError.not_found("User not found")
    return success_response(service.sanitize_user(db_user))


@router.post("/lookup")
@limiter.limit(AUTH_RATE_LIMIT)
async def lookup(request: Request, payload: LookupInput):
    exists = await service.lookup_by_phone(payload.phone)
    return success_response({"exists": exists})


@router.post("/discard-unlinked")
async def discard_unlinked(authorization: str | None = Header(None), db: AsyncSession = Depends(get_db)):
    decoded = _require_decoded_token(authorization)
    await service.discard_unlinked(db, decoded)
    return success_response({"message": "Discarded"})
