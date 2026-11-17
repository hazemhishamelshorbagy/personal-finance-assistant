import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env.js";
const { PrismaClient } = require("../../generated/prisma/client.js");

// استخدام محول PostgreSQL لربط Prisma بقاعدة البيانات المحددة في الإعدادات.
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

// إنشاء عميل مشترك تستخدمه خدمات التطبيق للتعامل مع قاعدة البيانات.
export const prisma = new PrismaClient({
  adapter,
});