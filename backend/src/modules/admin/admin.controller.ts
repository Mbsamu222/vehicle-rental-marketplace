import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, paginationMeta } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../config/prisma";
import { getPagination } from "../../utils/pagination";

// ─── Dashboard analytics ───

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const [
    totalCustomers,
    totalPartners,
    verifiedPartners,
    totalVehicles,
    pendingVehicleApprovals,
    totalBookings,
    activeBookings,
    revenueAgg,
    pendingSupportTickets,
  ] = await Promise.all([
    prisma.user.count({ where: { userType: "CUSTOMER" } }),
    prisma.rentalPartner.count(),
    prisma.rentalPartner.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { approvalStatus: "PENDING" } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: { in: ["CONFIRMED", "APPROVED", "VEHICLE_READY", "PICKED_UP", "ACTIVE", "RETURNING"] } } }),
    prisma.booking.aggregate({ where: { status: "COMPLETED" }, _sum: { totalAmount: true } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
  ]);

  return sendSuccess(res, {
    totalCustomers,
    totalPartners,
    verifiedPartners,
    totalVehicles,
    pendingVehicleApprovals,
    totalBookings,
    activeBookings,
    totalRevenue: revenueAgg._sum.totalAmount ?? 0,
    pendingSupportTickets,
  });
});

// ─── Roles & Permissions ───

export const listPermissions = asyncHandler(async (_req: Request, res: Response) => {
  const permissions = await prisma.permission.findMany({ orderBy: [{ module: "asc" }, { key: "asc" }] });
  return sendSuccess(res, permissions);
});

export const listRoles = asyncHandler(async (_req: Request, res: Response) => {
  const roles = await prisma.role.findMany({
    include: { permissions: { include: { permission: true } } },
    orderBy: { name: "asc" },
  });
  return sendSuccess(res, roles);
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, permissionIds } = req.body;
  const role = await prisma.role.create({
    data: {
      name,
      description,
      permissions: { create: permissionIds.map((permissionId: string) => ({ permissionId })) },
    },
    include: { permissions: { include: { permission: true } } },
  });
  return sendSuccess(res, role, 201);
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, permissionIds } = req.body;
  const role = await prisma.role.findUnique({ where: { id: req.params.id } });
  if (!role) throw ApiError.notFound("Role not found");
  if (role.isSystem) throw ApiError.forbidden("System roles cannot be modified");

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.role.update({ where: { id: req.params.id }, data: { name, description } });
    if (permissionIds) {
      await tx.rolePermission.deleteMany({ where: { roleId: req.params.id } });
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId: string) => ({ roleId: req.params.id, permissionId })),
      });
    }
    return result;
  });

  return sendSuccess(res, updated);
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await prisma.role.findUnique({ where: { id: req.params.id } });
  if (!role) throw ApiError.notFound("Role not found");
  if (role.isSystem) throw ApiError.forbidden("System roles cannot be deleted");
  await prisma.role.delete({ where: { id: req.params.id } });
  return sendSuccess(res, { message: "Role deleted" });
});

export const assignRoleToUser = asyncHandler(async (req: Request, res: Response) => {
  const targetUser = await prisma.user.findUnique({ where: { id: req.params.userId } });
  if (!targetUser) throw ApiError.notFound("User not found");
  if (targetUser.userType !== "ADMIN" && targetUser.userType !== "SUPER_ADMIN") {
    throw ApiError.badRequest("Only admin accounts can be assigned RBAC roles");
  }

  const assignment = await prisma.userRole.upsert({
    where: { userId_roleId: { userId: targetUser.id, roleId: req.body.roleId } },
    create: { userId: targetUser.id, roleId: req.body.roleId },
    update: {},
  });
  return sendSuccess(res, assignment, 201);
});

// ─── Users ───

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, take } = getPagination(req);
  const { userType, status } = req.query as { userType?: string; status?: string };
  const where = {
    ...(userType ? { userType: userType as never } : {}),
    ...(status ? { accountStatus: status as never } : {}),
  };
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.user.count({ where }),
  ]);
  return sendSuccess(
    res,
    users.map(({ passwordHash: _omit, ...u }) => u),
    200,
    paginationMeta(page, limit, total),
  );
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { accountStatus: req.body.status },
  });
  const { passwordHash: _omit, ...rest } = user;
  return sendSuccess(res, rest);
});

// ─── Audit logs ───

export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, take } = getPagination(req);
  const { entityType } = req.query as { entityType?: string };
  const where = entityType ? { entityType } : {};
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.auditLog.count({ where }),
  ]);
  return sendSuccess(res, logs, 200, paginationMeta(page, limit, total));
});

// ─── CMS ───

export const upsertCmsPage = asyncHandler(async (req: Request, res: Response) => {
  const page = await prisma.cmsPage.upsert({
    where: { slug: req.body.slug },
    create: req.body,
    update: { title: req.body.title, content: req.body.content },
  });
  return sendSuccess(res, page);
});

export const getCmsPage = asyncHandler(async (req: Request, res: Response) => {
  const page = await prisma.cmsPage.findUnique({ where: { slug: req.params.slug } });
  if (!page) throw ApiError.notFound("Page not found");
  return sendSuccess(res, page);
});

// ─── Blog ───

export const upsertBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const data = { ...req.body, publishedAt: req.body.status === "PUBLISHED" ? new Date() : null };
  const post = await prisma.blogPost.upsert({
    where: { slug: req.body.slug },
    create: data,
    update: data,
  });
  return sendSuccess(res, post);
});

export const listBlogPosts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, take } = getPagination(req);
  const where = { status: "PUBLISHED" as const };
  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({ where, skip, take, orderBy: { publishedAt: "desc" } }),
    prisma.blogPost.count({ where }),
  ]);
  return sendSuccess(res, posts, 200, paginationMeta(page, limit, total));
});

export const getBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await prisma.blogPost.findUnique({ where: { slug: req.params.slug } });
  if (!post) throw ApiError.notFound("Blog post not found");
  return sendSuccess(res, post);
});

// ─── Driving licenses ───

export const listDrivingLicenses = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, take } = getPagination(req);
  const { status } = req.query as { status?: string };
  const where = status ? { status: status as never } : {};
  const [licenses, total] = await Promise.all([
    prisma.drivingLicense.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, include: { user: true } }),
    prisma.drivingLicense.count({ where }),
  ]);
  return sendSuccess(res, licenses, 200, paginationMeta(page, limit, total));
});

export const reviewDrivingLicense = asyncHandler(async (req: Request, res: Response) => {
  const license = await prisma.drivingLicense.update({
    where: { id: req.params.id },
    data: {
      status: req.body.status,
      rejectionReason: req.body.rejectionReason,
      verifiedAt: req.body.status === "VERIFIED" ? new Date() : null,
    },
  });
  return sendSuccess(res, license);
});

// ─── Settings ───

export const getSetting = asyncHandler(async (req: Request, res: Response) => {
  const setting = await prisma.setting.findUnique({ where: { key: req.params.key } });
  if (!setting) throw ApiError.notFound("Setting not found");
  return sendSuccess(res, setting);
});

export const upsertSetting = asyncHandler(async (req: Request, res: Response) => {
  const setting = await prisma.setting.upsert({
    where: { key: req.params.key },
    create: { key: req.params.key, value: req.body.value as never },
    update: { value: req.body.value as never },
  });
  return sendSuccess(res, setting);
});
