from collections.abc import Callable

from fastapi import Depends

from app.core.responses import ApiError
from app.db.enums import UserType
from app.deps.auth import AuthUser, get_current_user


def require_user_type(*allowed: UserType) -> Callable[..., AuthUser]:
    """Coarse-grained gate by account type (customer / rental partner / admin / super admin)."""

    async def dependency(user: AuthUser = Depends(get_current_user)) -> AuthUser:
        if user.user_type not in allowed:
            raise ApiError.forbidden("Your account type cannot access this resource")
        return user

    return dependency


def require_permission(*permission_keys: str) -> Callable[..., AuthUser]:
    """Fine-grained gate for admin/staff roles carrying explicit permission keys."""

    async def dependency(user: AuthUser = Depends(get_current_user)) -> AuthUser:
        if user.user_type == UserType.SUPER_ADMIN:
            return user
        if not all(key in user.permissions for key in permission_keys):
            raise ApiError.forbidden("You do not have permission to perform this action")
        return user

    return dependency
