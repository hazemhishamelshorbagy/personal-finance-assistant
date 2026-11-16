import { z } from "zod";

export const createAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Account name must be at least 2 characters"),

  type: z.enum([
    "CASH",
    "BANK_ACCOUNT",
    "CREDIT_CARD",
    "SAVINGS_ACCOUNT",
    "DIGITAL_WALLET",
  ]),

  currency: z.enum(["EGP", "USD", "EUR"]),

  openingBalance: z
    .string()
    .regex(/^\d+(\.\d{1,4})?$/, "Invalid opening balance")
    .default("0"),
});
export const updateAccountSchema = createAccountSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided",
  );