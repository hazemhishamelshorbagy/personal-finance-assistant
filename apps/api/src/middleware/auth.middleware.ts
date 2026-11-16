import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error.js";
import { findValidSession } from "../services/session.service.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // Read the session token from the browser cookie
    const token = req.cookies?.pfa_session;

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    // Find a valid session in the database
    const session = await findValidSession(token);

    if (!session) {
      throw new AppError("Invalid or expired session", 401);
    }

    // Make the authenticated user available to the next handler
    res.locals.authUser = session.user;
    res.locals.sessionToken = token;

    next();
  } catch (error) {
    next(error);
  }
}