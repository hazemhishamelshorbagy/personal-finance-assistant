import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";
import { createIncomeSchema } from "../validators/transactions.validator.js";
import { getTransactionsQuerySchema } from "../validators/transactions.validator.js";
import { createExpenseSchema } from "../validators/transactions.validator.js";
import { createTransferSchema } from "../validators/transactions.validator.js";
import { createAdjustmentSchema } from "../validators/transactions.validator.js";
// إنشاء معاملة دخل وقيدها وتحديث رصيد الحساب ضمن عملية قاعدة بيانات واحدة.
export async function createIncomeTransaction(userId: string, input: unknown) {
  // التحقق من صحة بيانات الدخل قبل استخدامها.
  const result = createIncomeSchema.safeParse(input);

  if (!result.success) {
    // جمع رسائل التحقق وإرجاعها كخطأ بطلب غير صالح.
    const message = result.error.issues
      .map((issue) => issue.message)
      .join(", ");

    throw new AppError(message, 400);
  }

  // استخراج البيانات التي تم التحقق منها.
  const { amount, description, transactionDate, accountId } = result.data;

  // تنفيذ كل التغييرات كوحدة واحدة؛ تُلغى جميعها إذا فشلت أي خطوة.
  return prisma.$transaction(async (tx: any) => {
    // التأكد من أن الحساب موجود، تابع للمستخدم، ونشط.
    const account = await tx.financialAccounts.findFirst({
      where: {
        id: accountId,
        userId,
        isActive: true,
      },
    });

    if (!account) {
      // لا يُسمح بإنشاء دخل على حساب غير موجود أو غير تابع للمستخدم.
      throw new AppError("Account not found", 404);
    }

    // إنشاء سجل المعاملة بنوع دخل، واستخدام التاريخ الحالي عند عدم تحديد تاريخ.
    const transaction = await tx.transaction.create({
      data: {
        type: "INCOME",
        amount,
        description,
        transactionDate: transactionDate ?? new Date(),
        userId,
      },
    });

    // تسجيل حركة المبلغ وربطها بالمعاملة والحساب.
    await tx.transactionEntry.create({
      data: {
        amount,
        userId,
        transactionId: transaction.id,
        accountId,
      },
    });

    // إضافة مبلغ الدخل إلى الرصيد الحالي للحساب.
    const updatedAccount = await tx.financialAccounts.update({
      where: {
        id: account.id,
      },
      data: {
        currentBalance: {
          increment: amount,
        },
      },
    });

    // إرجاع المعاملة الجديدة والحساب بعد تحديث رصيده.
    return {
      transaction,
      account: updatedAccount,
    };
  });
}
export async function createExpenseTransaction(userId: string, input: unknown) {
  // التحقق من مدخلات المصروف قبل إجراء أي تغيير.
  const result = createExpenseSchema.safeParse(input);

  if (!result.success) {
    // إرجاع جميع أخطاء التحقق في رسالة واحدة.
    const message = result.error.issues
      .map((issue) => issue.message)
      .join(", ");

    throw new AppError(message, 400);
  }

  // استخراج المبلغ والوصف والتاريخ والحساب بعد نجاح التحقق.
  const { amount, description, transactionDate, accountId } = result.data;

  // حفظ المعاملة والقيد وتحديث الرصيد كوحدة واحدة قابلة للتراجع.
  return prisma.$transaction(async (tx: any) => {
    // التأكد من أن الحساب نشط ويتبع المستخدم الذي ينشئ المصروف.
    const account = await tx.financialAccounts.findFirst({
      where: {
        id: accountId,
        userId,
        isActive: true,
      },
    });

    if (!account) {
      throw new AppError("Account not found", 404);
    }
    const isCreditCard = account.type === "CREDIT_CARD";
    if (isCreditCard) {
      if (account.creditLimit === null || account.outstandingBalance === null) {
        throw new AppError(
          "Credit card limit and outstanding balance must be configured",
          400,
        );
      }

      const newOutstandingBalance = account.outstandingBalance.plus(amount);

      if (newOutstandingBalance.greaterThan(account.creditLimit)) {
        throw new AppError("Credit limit exceeded", 400);
      }
    }
    // إنشاء سجل المصروف؛ وإذا لم يُحدد التاريخ يُستخدم الوقت الحالي.
    const transaction = await tx.transaction.create({
      data: {
        type: "EXPENSE",
        amount,
        description,
        transactionDate: transactionDate ?? new Date(),
        userId,
      },
    });

    // تمثيل المصروف كقيد سالب لتقليل قيمة الحساب في السجل المالي.
    await tx.transactionEntry.create({
      data: {
        amount: isCreditCard ? amount : `-${amount}`,
        userId,
        transactionId: transaction.id,
        accountId,
      },
    });

    // إنقاص رصيد الحساب بمقدار المصروف.
    let updatedAccount;

    if (isCreditCard) {
      const updateResult = await tx.financialAccounts.updateMany({
        where: {
          id: accountId,
          userId,
          isActive: true,
          outstandingBalance: account.outstandingBalance,
          creditLimit: account.creditLimit,
        },
        data: {
          outstandingBalance: {
            increment: amount,
          },
        },
      });

      if (updateResult.count === 0) {
        throw new AppError("Credit card balance changed. Please retry", 409);
      }

      updatedAccount = await tx.financialAccounts.findUniqueOrThrow({
        where: { id: accountId },
      });
    } else {
      updatedAccount = await tx.financialAccounts.update({
        where: { id: accountId },
        data: {
          currentBalance: {
            decrement: amount,
          },
        },
      });
    }

    // إعادة المعاملة والحساب بعد تحديث رصيده.
    return {
      transaction,
      account: updatedAccount,
    };
  });
}

// جلب معاملات المستخدم على صفحات مع العدد الإجمالي لحساب بيانات الترقيم.
export async function getUserTransactions(userId: string, query: unknown) {
  const result = getTransactionsQuerySchema.safeParse(query);

  if (!result.success) {
    // رفض قيم الصفحة أو الحد غير الصالحة قبل الاستعلام.
    const message = result.error.issues
      .map((issue) => issue.message)
      .join(", ");

    throw new AppError(message, 400);
  }

  const { page, limit } = result.data;

  // حساب عدد السجلات التي يجب تجاوزها للوصول إلى الصفحة المطلوبة.
  const skip = (page - 1) * limit;

  // جلب المعاملات والعدد الإجمالي معًا لإرجاع نتائج متسقة للواجهة.
  const [transactions, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      where: { userId },
      include: {
        entries: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                currency: true,
              },
            },
          },
        },
      },
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),

    prisma.transaction.count({
      where: { userId },
    }),
  ]);

  // تضمين عدد الصفحات لتسهيل تنقل الواجهة بين النتائج.
  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
export async function createTransferTransaction(
  userId: string,
  input: unknown,
) {
  // التحقق من قيمة التحويل والحسابين قبل الوصول إلى قاعدة البيانات.
  const result = createTransferSchema.safeParse(input);

  if (!result.success) {
    // إرجاع تفاصيل أخطاء التحقق بصيغة خطأ طلب غير صالح.
    const message = result.error.issues
      .map((issue) => issue.message)
      .join(", ");

    throw new AppError(message, 400);
  }

  // استخراج المبلغ والوصف والتاريخ ومعرّفي حساب المصدر والوجهة.
  const {
    amount,
    description,
    transactionDate,
    sourceAccountId,
    destinationAccountId,
  } = result.data;

  // تنفيذ التحويل كاملًا كوحدة واحدة للحفاظ على تطابق القيود والأرصدة.
  return prisma.$transaction(async (tx: any) => {
    // جلب الحسابين النشطين اللذين يملكهما المستخدم الحالي.
    const accounts = await tx.financialAccounts.findMany({
      where: {
        id: {
          in: [sourceAccountId, destinationAccountId],
        },
        userId,
        isActive: true,
      },
    });

    // تحديد حساب الخصم وحساب الإضافة من نتائج الاستعلام.
    const sourceAccount = accounts.find(
      (account: any) => account.id === sourceAccountId,
    );

    const destinationAccount = accounts.find(
      (account: any) => account.id === destinationAccountId,
    );

    // رفض التحويل إذا كان أحد الحسابين غير موجود أو لا يخص المستخدم.
    if (!sourceAccount || !destinationAccount) {
      throw new AppError("One or both accounts were not found", 404);
    }

    // يجب أن تكون عملة الحسابين واحدة لأن التحويل لا يدعم صرف العملات.
    if (sourceAccount.currency !== destinationAccount.currency) {
      throw new AppError(
        "Transfers between different currencies are not supported yet",
        400,
      );
    }

    // لا يُسمح باستخدام بطاقة الائتمان كمصدر للتحويل.
    if (sourceAccount.type === "CREDIT_CARD") {
      throw new AppError(
        "Transfers from credit cards are not supported yet",
        400,
      );
    }

    // عند كون الوجهة بطاقة ائتمان، يُعامل التحويل كسداد للرصيد المستحق.
    const isCreditCardPayment = destinationAccount.type === "CREDIT_CARD";

    if (isCreditCardPayment) {
      if (destinationAccount.outstandingBalance === null) {
        throw new AppError(
          "Credit card outstanding balance is not configured",
          400,
        );
      }

      if (destinationAccount.outstandingBalance.lessThan(amount)) {
        throw new AppError("Payment exceeds outstanding balance", 400);
      }
    }

    // إنشاء سجل رئيسي يصف عملية التحويل بين الحسابين.
    const transaction = await tx.transaction.create({
      data: {
        type: "TRANSFER",
        amount,
        description,
        transactionDate: transactionDate ?? new Date(),
        userId,
      },
    });

    // تسجيل قيد سالب للمصدر وآخر موجب للوجهة وربطهما بالمعاملة نفسها.
    await tx.transactionEntry.createMany({
      data: [
        {
          amount: `-${amount}`,
          userId,
          transactionId: transaction.id,
          accountId: sourceAccountId,
        },
        {
          // سداد البطاقة يقلل الدين، بينما الإيداع في الحساب العادي يزيد رصيده.
          amount: isCreditCardPayment ? `-${amount}` : amount,
          userId,
          transactionId: transaction.id,
          accountId: destinationAccountId,
        },
      ],
    });

    // خصم المبلغ فقط إذا كان الرصيد الحالي كافيًا، لتجنب الرصيد السالب.
    const sourceUpdate = await tx.financialAccounts.updateMany({
      where: {
        id: sourceAccountId,
        userId,
        isActive: true,
        currentBalance: {
          gte: amount,
        },
      },
      data: {
        currentBalance: {
          decrement: amount,
        },
      },
    });

    // إذا لم يتغير الحساب فهذا يعني أن الرصيد غير كافٍ أو أن الحساب لم يعد نشطًا.
    if (sourceUpdate.count === 0) {
      throw new AppError("Insufficient balance", 400);
    }

    let updatedDestinationAccount;

    if (isCreditCardPayment) {
      // خفض الدين فقط إذا لم يتغير الرصيد المستحق منذ التحقق منه.
      const destinationUpdate = await tx.financialAccounts.updateMany({
        where: {
          id: destinationAccountId,
          userId,
          isActive: true,
          outstandingBalance: destinationAccount.outstandingBalance,
        },
        data: {
          outstandingBalance: {
            decrement: amount,
          },
        },
      });

      if (destinationUpdate.count === 0) {
        throw new AppError("Credit card balance changed. Please retry", 409);
      }

      updatedDestinationAccount = await tx.financialAccounts.findUniqueOrThrow({
        where: {
          id: destinationAccountId,
        },
      });
    } else {
      // إضافة المبلغ إلى رصيد الحساب العادي المستلم.
      updatedDestinationAccount = await tx.financialAccounts.update({
        where: {
          id: destinationAccountId,
        },
        data: {
          currentBalance: {
            increment: amount,
          },
        },
      });
    }

    // جلب حساب المصدر بعد الخصم لإرجاع الرصيدين المحدثين.
    const updatedSourceAccount = await tx.financialAccounts.findUniqueOrThrow({
      where: {
        id: sourceAccountId,
      },
    });

    // إرجاع سجل التحويل والحسابين بعد تحديث أرصدتهما.
    return {
      transaction,
      accounts: {
        source: updatedSourceAccount,
        destination: updatedDestinationAccount,
      },
    };
  });
}
export async function createAdjustmentTransaction(
  userId: string,
  input: unknown,
) {
  const result = createAdjustmentSchema.safeParse(input);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => issue.message)
      .join(", ");

    throw new AppError(message, 400);
  }

  const { amount, direction, description, transactionDate, accountId } =
    result.data;

  return prisma.$transaction(async (tx: any) => {
    // 1. Verify account ownership and status
    const account = await tx.financialAccounts.findFirst({
      where: {
        id: accountId,
        userId,
        isActive: true,
      },
    });

    if (!account) {
      throw new AppError("Account not found", 404);
    }
    const isCreditCard = account.type === "CREDIT_CARD";

    if (isCreditCard && account.outstandingBalance === null) {
      throw new AppError(
        "Credit card outstanding balance is not configured",
        400,
      );
    }

    // 3. Create the adjustment transaction
    const transaction = await tx.transaction.create({
      data: {
        type: "ADJUSTMENT",
        amount,
        description,
        transactionDate: transactionDate ?? new Date(),
        userId,
      },
    });

    // تحديد اتجاه التعديل وقيمة القيد الموقعة مرة واحدة.
    const isIncrease = direction === "INCREASE";
    const entryAmount = isIncrease ? amount : `-${amount}`;

    await tx.transactionEntry.create({
      data: {
        amount: entryAmount,
        userId,
        transactionId: transaction.id,
        accountId,
      },
    });

    // تحديث رصيد الدين للبطاقة أو الرصيد النقدي للحساب، حسب نوعه واتجاه التعديل.
    const updateResult = isCreditCard
      ? await tx.financialAccounts.updateMany({
          where: {
            id: accountId,
            userId,
            isActive: true,
            ...(!isIncrease
              ? { outstandingBalance: { gte: amount } }
              : {}),
          },
          data: {
            outstandingBalance: {
              [isIncrease ? "increment" : "decrement"]: amount,
            },
          },
        })
      : await tx.financialAccounts.updateMany({
          where: {
            id: accountId,
            userId,
            isActive: true,
            ...(!isIncrease ? { currentBalance: { gte: amount } } : {}),
          },
          data: {
            currentBalance: {
              [isIncrease ? "increment" : "decrement"]: amount,
            },
          },
        });

    if (updateResult.count === 0) {
      throw new AppError(
        "Insufficient balance or account changed. Please retry",
        409,
      );
    }

    // 6. Return the updated account
    const updatedAccount = await tx.financialAccounts.findUniqueOrThrow({
      where: {
        id: accountId,
      },
    });

    return {
      transaction,
      account: updatedAccount,
    };
  });
}
