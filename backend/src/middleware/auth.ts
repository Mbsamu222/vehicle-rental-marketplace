import type { NextFunction, Request, Response } from "express";
import type { UserType } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthUser {
  id: string;
  userType: UserType;
  permissions: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Missing or malformed Authorization header"));
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      userType: payload.userType,
      permissions: payload.permissions ?? [],
    };
    return next();
  } catch {
    return next(ApiError.unauthorized("Invalid or expired access token"));
  }
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next();
  }
  try {
    const payload = verifyAccessToken(header.slice("Bearer ".length));
    req.user = {
      id: payload.sub,
      userType: payload.userType,
      permissions: payload.permissions ?? [],
    };
  } catch {
    // ignore invalid token for optional auth
  }
  return next();
}
