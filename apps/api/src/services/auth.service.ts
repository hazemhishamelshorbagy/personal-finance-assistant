import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../lib/password.js";
import { AppError } from "../errors/app-error.js";
import { registerSchema } from "../validators/auth.validator.js";

export async function registerWithEmail(input: unknown) {
  const result = registerSchema.safeParse(input);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => issue.message)
      .join(", ");

    throw new AppError(message, 400);
  }

  const email = result.data.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  const passwordHash = await hashPassword(result.data.password);

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