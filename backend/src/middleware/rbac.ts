import type { NextFunction, Request, Response } from "express";
import type { UserType } from "@prisma/client";
import { ApiError } from "../utils/ApiError";

/** Coarse-grained gate by account type (customer / rental partner / admin / super admin). */
export function requireUserType(...allowed: UserType[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!allowed.includes(req.user.userType)) {
      return next(ApiError.forbidden("Your account type cannot access this resource"));
    }
    return next();
  };
}

/** Fine-grained gate for admin/staff roles carrying explicit permission keys (e.g. "vehicles.approve"). */
export function requirePermission(...permissionKeys: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.user.userType === "SUPER_ADMIN") return next();

    const hasAll = permissionKeys.every((key) => req.user!.permissions.includes(key));
    if (!hasAll) {
      return next(ApiError.forbidden("You do not have permission to perform this action"));
    }
    return next();
  };
}
