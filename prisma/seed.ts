import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@webshop.com" },
    update: {},
    create: {
      email: "admin@webshop.com",
      password: hashedPassword,
      name: "Admin",
      role: "admin",
    },
  });
  console.log("Created admin user:", admin.email);

  // Seed default app config
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

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
