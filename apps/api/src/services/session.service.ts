import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../lib/prisma.js";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function hashSessionToken(token: string): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function createSession(userId: string) {
  // Generate a cryptographically secure random token
  const token = randomBytes(32).toString("hex");

  // Store only the hashed token in the database
  const sessionToken = hashSessionToken(token);

  // Session expires after 7 days
  const expires = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
  });

  // Return the original token to be sent in the cookie
  return {
    token,
    expires,
  };
}

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

export async function deleteSession(token: string) {
  const sessionToken = hashSessionToken(token);

  await prisma.session.deleteMany({
    where: {
      sessionToken,
    },
  });
}