import { z } from "zod";
import { Prisma } from "../generated/prisma/client.js";
const accountFields = {
  name: z
    .string()
    .trim()
    .min(2, "Account name must be at least 2 characters"),

  currency: z.enum(["EGP", "USD", "EUR"]),

  openingBalance: z
    .string()
    .regex(/^\d+(\.\d{1,4})?$/, "Invalid opening balance")
    .default("0"),
};

// Credit limit must be greater than zero.
const creditLimitSchema = z
  .string()
  .regex(
    /^(?:0|[1-9]\d{0,14})(?:\.\d{1,4})?$/,
    "Invalid credit limit",
  )
  .refine(
    (value) => /[1-9]/.test(value),
    "Credit limit must be greater than zero",
  );

// Outstanding balance can be zero or a positive amount.
const outstandingBalanceSchema = z
  .string()
  .regex(
    /^(?:0|[1-9]\d{0,14})(?:\.\d{1,4})?$/,
    "Invalid outstanding balance",
  )
  .default("0");

// Create account validation.
export const createAccountSchema = z
  .discriminatedUnion("type", [
    z.object({
      ...accountFields,
      type: z.literal("CASH"),
    }),

    z.object({
      ...accountFields,
      type: z.literal("BANK_ACCOUNT"),
    }),

    z.object({
      ...accountFields,
      type: z.literal("CREDIT_CARD"),
      creditLimit: creditLimitSchema,
      outstandingBalance: outstandingBalanceSchema,
    }),

    z.object({
      ...accountFields,
      type: z.literal("SAVINGS_ACCOUNT"),
    }),

    z.object({
      ...accountFields,
      type: z.literal("DIGITAL_WALLET"),
    }),
  ])
  .superRefine((data, ctx) => {
    if (data.type !== "CREDIT_CARD") {
      return;
    }

    const creditLimit = new Prisma.Decimal(data.creditLimit);
    const outstandingBalance = new Prisma.Decimal(
      data.outstandingBalance,
    );

    if (outstandingBalance.greaterThan(creditLimit)) {
      ctx.addIssue({
        code: "custom",
        path: ["outstandingBalance"],
        message: "Outstanding balance cannot exceed credit limit",
      });
    }
  });

// Update account validation.
export const updateAccountSchema = z
  .object({
    ...accountFields,

    type: z.enum([
      "CASH",
      "BANK_ACCOUNT",
      "CREDIT_CARD",
      "SAVINGS_ACCOUNT",
      "DIGITAL_WALLET",
    ]),

    creditLimit: creditLimitSchema.optional(),
    outstandingBalance: outstandingBalanceSchema.optional(),
  })
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided",
  );