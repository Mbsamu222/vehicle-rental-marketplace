from dataclasses import dataclass, field

from fastapi import Depends, Header
from firebase_admin import auth as firebase_auth
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.firebase import verify_id_token
from app.core.permissions import get_user_permissions
from app.core.responses import ApiError
from app.db.enums import AccountStatus, UserType
from app.db.models import User
from app.db.session import get_db


@dataclass
class AuthUser:
    id: str
    user_type: UserType
    permissions: list[str] = field(default_factory=list)


def _decode_bearer(authorization: str | None) -> dict | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[len("Bearer ") :]
    try:
        return verify_id_token(token)
    except (
        firebase_auth.InvalidIdTokenError,
        firebase_auth.ExpiredIdTokenError,
        firebase_auth.RevokedIdTokenError,
        firebase_auth.UserDisabledError,
        firebase_auth.CertificateFetchError,
    ):
        return None


async def _load_local_user(db: AsyncSession, firebase_uid: str) -> User:
    user = (await db.execute(select(User).where(User.firebase_uid == firebase_uid))).scalar_one_or_none()
    if user is None:
        raise ApiError.not_found("No profile found for this account yet — call /auth/sync first")
    if user.account_status in (AccountStatus.SUSPENDED, AccountStatus.BANNED):
        raise ApiError.forbidden("Your account has been suspended. Contact support.")
    return user


async def get_current_user(
    authorization: str | None = Header(None), db: AsyncSession = Depends(get_db)
) -> AuthUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise ApiError.unauthorized("Missing or malformed Authorization header")

    decoded = _decode_bearer(authorization)
    if decoded is None:
        raise ApiError.unauthorized("Invalid or expired access token")

    user = await _load_local_user(db, decoded["uid"])
    permissions = await get_user_permissions(db, user.id, user.user_type)
    return AuthUser(id=user.id, user_type=user.user_type, permissions=permissions)


async def get_optional_user(
    authorization: str | None = Header(None), db: AsyncSession = Depends(get_db)
) -> AuthUser | None:
    decoded = _decode_bearer(authorization)
    if decoded is None:
        return None
    try:
        user = await _load_local_user(db, decoded["uid"])
    except ApiError:
        return None
    permissions = await get_user_permissions(db, user.id, user.user_type)
    return AuthUser(id=user.id, user_type=user.user_type, permissions=permissions)
