import { AppError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";
import { createAccountSchema,updateAccountSchema  } from "../validators/accounts.validator.js";

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
export async function createUserAccount(
  userId: string,
  input: unknown,
) {
  const result = createAccountSchema.safeParse(input);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => issue.message)
      .join(", ");

    throw new AppError(message, 400);
  }

  const account = await prisma.financialAccounts.create({
    data: {
      name: result.data.name,
      type: result.data.type,
      currency: result.data.currency,
      openingBalance: result.data.openingBalance,
      currentBalance: result.data.openingBalance,
      userId,
    },
  });

  return account;
}
export async function updateUserAccount(
  userId: string,
  accountId: string,
  input: unknown,
) {
  const result = updateAccountSchema.safeParse(input);

  if (!result.success) {
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

  if (updatedAccount.count === 0) {
    throw new AppError("Account not found", 404);
  }

  return prisma.financialAccounts.findFirst({
    where: {
      id: accountId,
      userId,
    },
  });
}

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

  if (result.count === 0) {
    throw new AppError("Account not found", 404);
  }
}