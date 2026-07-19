import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PERMISSIONS: Array<{ key: string; module: string; description: string }> = [
  { key: "partners.view", module: "partners", description: "View rental partner profiles and documents" },
  { key: "partners.verify", module: "partners", description: "Approve or reject partner KYC/verification" },
  { key: "vehicles.approve", module: "vehicles", description: "Approve or reject vehicle listings" },
  { key: "payments.view", module: "payments", description: "View transactions and payment records" },
  { key: "payments.refund", module: "payments", description: "Issue refunds for payments" },
  { key: "coupons.manage", module: "coupons", description: "Create and manage coupons" },
  { key: "support.manage", module: "support", description: "Manage support tickets" },
  { key: "analytics.view", module: "analytics", description: "View platform analytics dashboard" },
  { key: "roles.manage", module: "roles", description: "Manage roles, permissions, and admin assignments" },
  { key: "users.manage", module: "users", description: "Manage customer/partner account status" },
  { key: "audit.view", module: "audit", description: "View audit logs" },
  { key: "cms.manage", module: "cms", description: "Manage CMS pages and blog posts" },
  { key: "settings.manage", module: "settings", description: "Manage system settings" },
];

async function main() {
  console.log("Seeding permissions...");
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      create: permission,
      update: { module: permission.module, description: permission.description },
    });
  }

  console.log("Seeding Super Admin role...");
  const allPermissions = await prisma.permission.findMany();
  const superAdminRole = await prisma.role.upsert({
    where: { name: "Super Admin" },
    create: {
      name: "Super Admin",
      description: "Full platform access",
      isSystem: true,
      permissions: { create: allPermissions.map((p) => ({ permissionId: p.id })) },
    },
    update: {},
  });

  await prisma.role.upsert({
    where: { name: "Support Agent" },
    create: {
      name: "Support Agent",
      description: "Handles customer support tickets and reviews",
      permissions: {
        create: allPermissions
          .filter((p) => ["support.manage", "audit.view"].includes(p.key))
          .map((p) => ({ permissionId: p.id })),
      },
    },
    update: {},
  });

  console.log("Seeding Super Admin user...");
  const superAdminEmail = "admin@rentalmarketplace.example";
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
  const superAdminUser = await prisma.user.upsert({
    where: { email: superAdminEmail },
    create: {
      email: superAdminEmail,
      firstName: "Platform",
      lastName: "Admin",
      passwordHash,
      userType: "SUPER_ADMIN",
      accountStatus: "ACTIVE",
      emailVerifiedAt: new Date(),
      referralCode: "SUPERADMIN",
    },
    update: {},
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: superAdminUser.id, roleId: superAdminRole.id } },
    create: { userId: superAdminUser.id, roleId: superAdminRole.id },
    update: {},
  });

  console.log("Seeding countries and cities...");
  const india = await prisma.country.upsert({
    where: { code: "IN" },
    create: { name: "India", code: "IN" },
    update: {},
  });

  // Launching in a single city first — more cities are added later via the
  // admin catalog management screen as the platform expands, not pre-seeded.
  const cities = [{ name: "Chennai", isPopular: true }];
  for (const city of cities) {
    await prisma.city.upsert({
      where: { name_countryId: { name: city.name, countryId: india.id } },
      create: { ...city, countryId: india.id },
      update: { isPopular: city.isPopular },
    });
  }

  console.log("Seeding vehicle categories...");
  const categories = [
    { name: "Hatchback", slug: "hatchback" },
    { name: "Sedan", slug: "sedan" },
    { name: "SUV", slug: "suv" },
    { name: "Luxury", slug: "luxury" },
    { name: "Bike", slug: "bike" },
    { name: "Electric", slug: "electric" },
  ];
  for (const category of categories) {
    await prisma.vehicleCategory.upsert({
      where: { slug: category.slug },
      create: category,
      update: {},
    });
  }

  console.log("Seeding vehicle brands...");
  const brands = ["Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Toyota", "Honda", "Kia", "MG"];
  for (const name of brands) {
    await prisma.vehicleBrand.upsert({ where: { name }, create: { name }, update: {} });
  }

  console.log("Seeding a starter subscription plan...");
  await prisma.subscriptionPlan.upsert({
    where: { name: "Starter" },
    create: {
      name: "Starter",
      description: "For partners listing up to 10 vehicles",
      price: 999,
      durationDays: 30,
      maxVehicles: 10,
      features: { support: "email", listingBoost: false },
    },
    update: {},
  });

  console.log("Seed complete.");
  console.log(`Super Admin login: ${superAdminEmail} / ChangeMe123! (change this immediately)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
