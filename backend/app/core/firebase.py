import base64
import json
from functools import lru_cache

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials

from app.core.config import settings


@lru_cache
def get_app() -> firebase_admin.App:
    service_account_info = json.loads(base64.b64decode(settings.firebase_service_account_b64))
    cred = credentials.Certificate(service_account_info)
    return firebase_admin.initialize_app(cred)


def verify_id_token(token: str) -> dict:
    """Raises firebase_admin.auth.* exceptions (InvalidIdTokenError, ExpiredIdTokenError,
    RevokedIdTokenError, UserDisabledError, ...) on failure — callers translate to ApiError."""
    return firebase_auth.verify_id_token(token, app=get_app(), check_revoked=True)


def get_user_by_phone_number(phone: str) -> firebase_auth.UserRecord | None:
    try:
        return firebase_auth.get_user_by_phone_number(phone, app=get_app())
    except firebase_auth.UserNotFoundError:
        return None


def create_user(**kwargs) -> firebase_auth.UserRecord:
    return firebase_auth.create_user(app=get_app(), **kwargs)


def update_user(uid: str, **kwargs) -> firebase_auth.UserRecord:
    return firebase_auth.update_user(uid, app=get_app(), **kwargs)


def revoke_refresh_tokens(uid: str) -> None:
    firebase_auth.revoke_refresh_tokens(uid, app=get_app())


def delete_user(uid: str) -> None:
    firebase_auth.delete_user(uid, app=get_app())
