from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import UserType
from app.db.models import Permission, Role, RolePermission, UserRole


async def get_user_permissions(db: AsyncSession, user_id: str, user_type: UserType) -> list[str]:
    """Only ADMIN/SUPER_ADMIN accounts carry granular RBAC roles; other user types get none."""
    if user_type not in (UserType.ADMIN, UserType.SUPER_ADMIN):
        return []

    stmt = (
        select(Permission.key)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(Role, Role.id == RolePermission.role_id)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(UserRole.user_id == user_id)
        .distinct()
    )
    result = await db.execute(stmt)
    return [row[0] for row in result.all()]
