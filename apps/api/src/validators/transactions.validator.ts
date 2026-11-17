import { z } from "zod";

// قواعد بيانات معاملة الدخل: مبلغ موجب، ومعرّف حساب صحيح، وحقول اختيارية.
export const createIncomeSchema = z.object({
 amount: z
  .string()
  .regex(
    /^(?:0|[1-9]\d{0,14})(?:\.\d{1,4})?$/,
    "Invalid amount",
  )
  .refine(
    (value) => /[1-9]/.test(value),
    "Amount must be greater than zero",
  ),

  description: z.string().trim().max(500).optional(),

  transactionDate: z.coerce.date().optional(),

  accountId: z.string().uuid("Invalid account ID"),
});

// تحويل قيم الاستعلام إلى أرقام وتحديد قيم افتراضية وحد أقصى للنتائج.
export const getTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// قواعد بيانات المصروف، بنفس قيود المبلغ والحساب مع وصف وتاريخ اختياريين.
export const createExpenseSchema = z.object({
  amount: z
    .string()
    .regex(
      /^(?:0|[1-9]\d{0,14})(?:\.\d{1,4})?$/,
      "Invalid amount",
    )
    .refine(
      (value) => /[1-9]/.test(value),
      "Amount must be greater than zero",
    ),

  description: z.string().trim().max(500).optional(),

  transactionDate: z.coerce.date().optional(),

  accountId: z.string().uuid("Invalid account ID"),
});

export const createTransferSchema = z
  .object({
    amount: z
      .string()
      .regex(
        /^(?:0|[1-9]\d{0,14})(?:\.\d{1,4})?$/,
        "Invalid amount",
      )
      .refine(
        (value) => /[1-9]/.test(value),
        "Amount must be greater than zero",
      ),

    description: z.string().trim().max(500).optional(),

    transactionDate: z.coerce.date().optional(),

    sourceAccountId: z.string().uuid("Invalid source account ID"),

    destinationAccountId: z
      .string()
      .uuid("Invalid destination account ID"),
  })
  .refine(
    (data) => data.sourceAccountId !== data.destinationAccountId,
    {
      message: "Source and destination accounts must be different",
      path: ["destinationAccountId"],
    },
  );

  export const createAdjustmentSchema = z.object({
  amount: z
    .string()
    .regex(
      /^(?:0|[1-9]\d{0,14})(?:\.\d{1,4})?$/,
      "Invalid amount",
    )
    .refine(
      (value) => /[1-9]/.test(value),
      "Amount must be greater than zero",
    ),

  direction: z.enum(["INCREASE", "DECREASE"]),

  description: z.string().trim().max(500).optional(),

  transactionDate: z.coerce.date().optional(),

  accountId: z.string().uuid("Invalid account ID"),
});