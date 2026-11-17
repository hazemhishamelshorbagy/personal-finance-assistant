import { AppError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";
import { createAccountSchema,updateAccountSchema  } from "../validators/accounts.validator.js";

// جلب الحسابات النشطة للمستخدم مع عرض الأحدث إنشاءً أولًا.
export async function getUserAccounts(userId: string) {
  return prisma.financialAccounts.findMany({
    where: {
      userId,
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// التحقق من مدخلات الحساب ثم إنشاء الحساب ورصيد البداية.
export async function createUserAccount(
  userId: string,
  input: unknown,
) {
  const result = createAccountSchema.safeParse(input);

  if (!result.success) {
    // تحويل أخطاء التحقق إلى خطأ طلب مفهوم للعميل.
    const message = result.error.issues
      .map((issue) => issue.message)
      .join(", ");

    throw new AppError(message, 400);
  }

  // تهيئة حقول بطاقة الائتمان عند إنشائها؛ يبدأ الدين المستحق من الصفر.
 const creditCardFields =
  result.data.type === "CREDIT_CARD"
    ? {
        creditLimit: result.data.creditLimit,
        outstandingBalance: result.data.outstandingBalance,
      }
    : {};

  const account = await prisma.financialAccounts.create({
    data: {
      name: result.data.name,
      type: result.data.type,
      currency: result.data.currency,
      openingBalance: result.data.openingBalance,
      currentBalance: result.data.openingBalance,
      userId,
      ...creditCardFields,
    },
  });

  return account;
}

// تحديث الحقول المرسلة فقط، مع التأكد أن الحساب تابع للمستخدم.
export async function updateUserAccount(
  userId: string,
  accountId: string,
  input: unknown,
) {
  const result = updateAccountSchema.safeParse(input);

  if (!result.success) {
    // رفض البيانات غير الصالحة قبل تنفيذ التحديث.
    const message = result.error.issues
      .map((issue) => issue.message)
      .join(", ");

    throw new AppError(message, 400);
  }

  const updatedAccount = await prisma.financialAccounts.updateMany({
    where: {
      id: accountId,
      userId,
    },
    data: result.data,
  });

  // عدم وجود صفوف محدثة يعني أن الحساب غير موجود أو لا يخص هذا المستخدم.
  if (updatedAccount.count === 0) {
    throw new AppError("Account not found", 404);
  }

  // جلب بيانات الحساب بعد التحديث لإرجاعها إلى المسار.
  return prisma.financialAccounts.findFirst({
    where: {
      id: accountId,
      userId,
    },
  });
}

// تعطيل الحساب منطقيًا حتى تبقى المعاملات والسجلات التاريخية محفوظة.
export async function deleteUserAccount(
  userId: string,
  accountId: string,
) {
  const result = await prisma.financialAccounts.updateMany({
    where: {
      id: accountId,
      userId,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  // الإبلاغ عن الحساب غير الموجود أو الذي سبق تعطيله.
  if (result.count === 0) {
    throw new AppError("Account not found", 404);
  }
}