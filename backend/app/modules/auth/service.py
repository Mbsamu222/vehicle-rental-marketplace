from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.firebase import delete_user, get_user_by_phone_number
from app.core.otp import generate_token
from app.core.responses import ApiError
from app.core.serialize import orm_to_dict
from app.db.enums import AccountStatus, UserType
from app.db.models import User, Wallet


def sanitize_user(user: User) -> dict:
    return orm_to_dict(user, exclude=frozenset({"password_hash"}))


async def sync(db: AsyncSession, decoded_token: dict, data: dict) -> dict:
    firebase_uid = decoded_token["uid"]
    existing = (await db.execute(select(User).where(User.firebase_uid == firebase_uid))).scalar_one_or_none()

    if existing is not None:
        if data.get("firstName"):
            existing.first_name = data["firstName"]
        if data.get("lastName"):
            existing.last_name = data["lastName"]
        if data.get("phone"):
            existing.phone = data["phone"]
        await db.commit()
        await db.refresh(existing)
        return sanitize_user(existing)

    email = decoded_token.get("email")
    if not email:
        raise ApiError.bad_request("This account has no email on file — email is required to register")

    referred_by_id = None
    referral_code_input = data.get("referralCode")
    if referral_code_input:
        referrer = (await db.execute(select(User).where(User.referral_code == referral_code_input))).scalar_one_or_none()
        if referrer is not None:
            referred_by_id = referrer.id

    referral_code = generate_token(4).upper()

    user = User(
        firebase_uid=firebase_uid,
        email=email,
        phone=data.get("phone") or decoded_token.get("phone_number"),
        first_name=data.get("firstName") or "",
        last_name=data.get("lastName") or "",
        user_type=UserType(data.get("userType") or "CUSTOMER"),
        account_status=AccountStatus.ACTIVE,
        email_verified_at=None,
        referral_code=referral_code,
        referred_by_id=referred_by_id,
    )
    db.add(user)
    await db.flush()
    db.add(Wallet(user_id=user.id, balance=0))
    await db.commit()
    await db.refresh(user)

    return sanitize_user(user)


async def lookup_by_phone(phone: str) -> bool:
    return get_user_by_phone_number(phone) is not None


async def discard_unlinked(db: AsyncSession, decoded_token: dict) -> None:
    """Deletes the Firebase user for a token whose uid has no local profile row —
    used to clean up the ghost account Firebase Phone Auth creates when someone
    enters a phone number that was never registered."""
    firebase_uid = decoded_token["uid"]
    existing = (await db.execute(select(User).where(User.firebase_uid == firebase_uid))).scalar_one_or_none()
    if existing is not None:
        raise ApiError.conflict("This account already has a profile and cannot be discarded")
    delete_user(firebase_uid)
