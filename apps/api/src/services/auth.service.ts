import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { AppError } from "../errors/app-error.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";

// التحقق من بيانات التسجيل وتخزين كلمة المرور مجزأة.
export async function registerWithEmail(input: unknown) {
  const result = registerSchema.safeParse(input);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => issue.message)
      .join(", ");

    throw new AppError(message, 400);
  }

  const email = result.data.email.toLowerCase();

  // توحيد حالة أحرف البريد وفحص عدم استخدامه من قبل.
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  // تجزئة كلمة المرور قبل حفظها في قاعدة البيانات.
  const passwordHash = await hashPassword(result.data.password);

  // إنشاء المستخدم وإرجاع الحقول الآمنة فقط دون تجزئة كلمة المرور.
  const user = await prisma.user.create({
    data: {
      email,
      name: result.data.name,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  return user;
}

// التحقق من بيانات الدخول ثم إرجاع بيانات المستخدم غير الحساسة.
export async function loginWithEmail(input: unknown) {
  const result = loginSchema.safeParse(input);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => issue.message)
      .join(", ");

    throw new AppError(message, 400);
  }

  const email = result.data.email.toLowerCase();

  // البحث بالبريد الموحّد؛ تُستخدم رسالة عامة لبيانات الدخول غير الصحيحة.
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.passwordHash) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await verifyPassword(
    result.data.password,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  // عدم تضمين تجزئة كلمة المرور ضمن بيانات المستخدم المعادة.
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

