import { z } from "zod";

// تعريف متغيرات البيئة المطلوبة، مع تحويل PORT والتحقق من قيمه الافتراضية.
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().url(),
});

// إيقاف تشغيل التطبيق برسالة واضحة إذا كانت إعدادات البيئة غير صالحة.
export const env = envSchema.parse(process.env);