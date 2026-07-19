import { prisma } from "../config/prisma";
import type { UserType } from "@prisma/client";

/** Only ADMIN/SUPER_ADMIN accounts carry granular RBAC roles; other user types get no permission keys. */
export async function getUserPermissions(userId: string, userType: UserType): Promise<string[]> {
  if (userType !== "ADMIN" && userType !== "SUPER_ADMIN") return [];

  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });

  const keys = new Set<string>();
  for (const ur of userRoles) {
    for (const rp of ur.role.permissions) {
      keys.add(rp.permission.key);
    }
  }
  return [...keys];
}
