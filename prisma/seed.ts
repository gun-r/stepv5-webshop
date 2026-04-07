import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Default roles
  const adminRole = await prisma.userRole.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      label: "Administrator",
      permissions: JSON.stringify([
        "users.view", "users.manage",
        "products.view", "products.manage",
        "sites.view", "sites.manage",
        "setup.view", "setup.manage",
        "activity.view",
      ]),
    },
  });

  await prisma.userRole.upsert({
    where: { name: "manager" },
    update: {},
    create: {
      name: "manager",
      label: "Manager",
      permissions: JSON.stringify([
        "products.view", "products.manage",
        "sites.view", "sites.manage",
        "activity.view",
      ]),
    },
  });

  await prisma.userRole.upsert({
    where: { name: "user" },
    update: {},
    create: {
      name: "user",
      label: "User",
      permissions: JSON.stringify(["products.view"]),
    },
  });

  console.log("Created default roles");

  // Admin user
  const hashedPassword = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@webshop.com" },
    update: { userRole: { connect: { id: adminRole.id } }, role: "admin" },
    create: {
      email: "admin@webshop.com",
      password: hashedPassword,
      name: "Administrator",
      role: "admin",
      userRole: { connect: { id: adminRole.id } },
    },
  });
  console.log("Created admin user:", admin.email);

  // Default app config
  const configs = [
    { key: "libreTranslateUrl", value: "https://libretranslate.com" },
    { key: "libreTranslateApiKey", value: "" },
    { key: "autoTranslate", value: "false" },
    { key: "defaultSourceLanguage", value: "en" },
  ];

  for (const config of configs) {
    await prisma.appConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }
  console.log("Created default app configs");
  console.log("✅ Seeding complete!");
  console.log("   Login: admin@webshop.com / Admin@123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
