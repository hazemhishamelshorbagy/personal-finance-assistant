import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error.js";
import { findValidSession } from "../services/session.service.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // قراءة رمز الجلسة من ملف تعريف الارتباط الذي أرسله المتصفح.
    const token = req.cookies?.pfa_session;

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    // التحقق من وجود جلسة غير منتهية مرتبطة بهذا الرمز.
    const session = await findValidSession(token);

    if (!session) {
      throw new AppError("Invalid or expired session", 401);
    }

    // إتاحة بيانات المستخدم ورمز الجلسة للمسار الذي سيعالج الطلب.
    res.locals.authUser = session.user;
    res.locals.sessionToken = token;

    next();
  } catch (error) {
    next(error);
  }
}