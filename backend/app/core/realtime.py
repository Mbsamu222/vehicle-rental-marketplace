import socketio
from sqlalchemy import select

from app.core.config import settings
from app.core.firebase import verify_id_token
from app.db.models import User
from app.db.session import AsyncSessionLocal

# Clients authenticate the socket with the same Firebase ID token used for REST
# calls, then join a per-user room so booking/notification events can be pushed
# to them directly.
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins=settings.cors_origins)


@sio.event
async def connect(sid: str, environ: dict, auth: dict | None) -> None:
    token = (auth or {}).get("token")
    if not token:
        raise socketio.exceptions.ConnectionRefusedError("Authentication required")
    try:
        decoded = verify_id_token(token)
    except Exception as exc:
        raise socketio.exceptions.ConnectionRefusedError("Invalid or expired token") from exc

    async with AsyncSessionLocal() as db:
        user = (await db.execute(select(User).where(User.firebase_uid == decoded["uid"]))).scalar_one_or_none()
    if user is None:
        raise socketio.exceptions.ConnectionRefusedError("No profile found for this account")

    await sio.save_session(sid, {"userId": user.id})
    await sio.enter_room(sid, f"user:{user.id}")


async def notify_user(user_id: str, event: str, data: dict) -> None:
    await sio.emit(event, data, room=f"user:{user_id}")
