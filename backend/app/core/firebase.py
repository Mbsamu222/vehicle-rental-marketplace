"""Firebase Admin SDK wiring.

Credentials resolve from `backend/.env` in this precedence order, so the same
code path works locally, in CI, and on a managed host:

  1. FIREBASE_AUTH_EMULATOR_HOST — local emulator, needs no real credential
  2. GOOGLE_APPLICATION_CREDENTIALS — service-account JSON on disk (Cloud Run, k8s)
  3. FIREBASE_SERVICE_ACCOUNT_B64 — base64 of that JSON, for env-only hosts
  4. Application Default Credentials — implicit on GCP in production

See `Settings.firebase_credential_source`.
"""

import base64
import binascii
import json
import logging
import os
from functools import lru_cache

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials

from app.core.config import settings

logger = logging.getLogger(__name__)


class FirebaseNotConfiguredError(RuntimeError):
    """Raised when an auth operation is attempted with no usable credential.

    Carries the remediation steps, because the SDK's own message ("Certificate
    must contain a 'type' field") gives no hint about which env var is wrong or
    how to produce a correct value.
    """

    def __init__(self) -> None:
        super().__init__(
            "Firebase Admin is not configured, so ID tokens cannot be verified.\n"
            "Set ONE of the following in backend/.env:\n"
            "  FIREBASE_AUTH_EMULATOR_HOST=localhost:9099\n"
            "      Local development with no secret. Start it with:\n"
            "      firebase emulators:start --only auth\n"
            "  GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json\n"
            "  FIREBASE_SERVICE_ACCOUNT_B64=<base64 of that JSON>\n"
            "      Generate with: python tools/encode_service_account.py <file.json> --write\n"
            "Download the key from Firebase Console -> Project Settings -> Service accounts."
        )


def _decode_base64_credential(raw: str) -> credentials.Base:
    try:
        decoded = base64.b64decode(raw, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise FirebaseNotConfiguredError() from exc

    try:
        info = json.loads(decoded)
    except json.JSONDecodeError as exc:
        raise FirebaseNotConfiguredError() from exc

    # Guard against the web app config being pasted here by mistake — it is
    # valid JSON and valid base64, so only a field check catches it.
    if not isinstance(info, dict) or info.get("type") != "service_account":
        raise FirebaseNotConfiguredError()

    return credentials.Certificate(info)


@lru_cache
def get_app() -> firebase_admin.App:
    source = settings.firebase_credential_source

    if source == "none":
        raise FirebaseNotConfiguredError()

    if source == "emulator":
        # The Admin SDK reads this env var directly and skips signature
        # verification, so any project id works.
        os.environ.setdefault("FIREBASE_AUTH_EMULATOR_HOST", settings.firebase_auth_emulator_host)
        logger.warning(
            "Firebase Auth emulator in use (%s) — ID token signatures are NOT verified. "
            "Never enable this in production.",
            settings.firebase_auth_emulator_host,
        )
        return firebase_admin.initialize_app(options={"projectId": _emulator_project_id()})

    if source == "file":
        cred = credentials.Certificate(settings.google_application_credentials)
    elif source == "base64":
        cred = _decode_base64_credential(settings.firebase_service_account_b64)
    else:  # "adc"
        cred = credentials.ApplicationDefault()

    return firebase_admin.initialize_app(cred)


def _emulator_project_id() -> str:
    """The emulator doesn't validate the project id, but the SDK requires one."""
    return settings.firebase_project_id or "demo-project"


def check_configuration() -> str:
    """Validates credentials at startup and returns the source in use.

    Called from the app factory so a misconfigured deployment fails fast and
    loudly, instead of serving traffic that 500s on the first login.
    """
    source = settings.firebase_credential_source
    if source == "none":
        raise FirebaseNotConfiguredError()
    get_app()
    return source


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
