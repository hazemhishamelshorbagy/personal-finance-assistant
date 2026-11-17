import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../lib/prisma.js";

// تحديد مدة صلاحية الجلسة بأسبوع واحد بالميلي ثانية.
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// تجزئة رمز الجلسة لاستخدامه في البحث والتخزين الآمن بقاعدة البيانات.
export function hashSessionToken(token: string): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function createSession(userId: string) {
  // إنشاء رمز عشوائي آمن تشفيريًا وإرسال نسخته الأصلية للمتصفح لاحقًا.
  const token = randomBytes(32).toString("hex");

  // حفظ التجزئة فقط في قاعدة البيانات بدل الرمز القابل للاستخدام.
  const sessionToken = hashSessionToken(token);

  // حساب موعد انتهاء صلاحية الجلسة.
  const expires = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
  });

  // إعادة الرمز الأصلي وموعد انتهائه لإعداد ملف الارتباط.
  return {
    token,
    expires,
  };
}

// البحث عن جلسة مطابقة لم تنتهِ صلاحيتها، مع جلب بيانات المستخدم الآمنة.
export async function findValidSession(token: string) {
  const sessionToken = hashSessionToken(token);

  return prisma.session.findFirst({
    where: {
      sessionToken,
      expires: {
        gt: new Date(),
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          createdAt: true,
        },
      },
    },
  });
}

// حذف الجلسة المطابقة بعد تجزئة الرمز الوارد من المتصفح.
export async function deleteSession(token: string) {
  const sessionToken = hashSessionToken(token);

  await prisma.session.deleteMany({
    where: {
      sessionToken,
    },
  });
}