import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/app-error.js";

export const errorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next,
) => {
  console.error(err);

  // أخطاء التطبيق تحمل رمز HTTP ورسالة مناسبة يمكن إرجاعها للعميل.
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
      },
    });

    return;
  }

  // إخفاء تفاصيل الأخطاء غير المتوقعة عن العميل وإرجاع خطأ عام.
  res.status(500).json({
    success: false,
    error: {
      message: "Internal server error",
    },
  });
};