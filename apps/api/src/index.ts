import express from "express";
import "dotenv/config";
import { env } from "./config/env";
import cors from "cors";
import { errorHandler } from "./middleware/error-handler";
import { AppError } from "./errors/app-error.js";
import healthRouter from "./routes/health.routes.js";
import { prisma } from "./lib/prisma.js";
import authRouter from "./routes/auth.routes.js";
import accountsRouter from "./routes/accounts.routes.js";
import transactionsRouter from "./routes/transactions.routes.js";

import cookieParser from "cookie-parser";
const app = express();
const PORT = env.PORT;

// السماح للواجهة المحددة بإرسال الطلبات وملفات تعريف الارتباط إلى الخادم.
app.use(
  cors({
    origin: env.WEB_ORIGIN,
    credentials: true,
  }),
);

// تجهيز قراءة أجسام JSON وملفات تعريف الارتباط قبل الوصول إلى المسارات.
app.use(express.json());
app.use(cookieParser());

// ربط مسارات فحص الخدمة والحسابات والمصادقة والمعاملات.
app.use("/api", healthRouter);
app.use("/api/accounts", accountsRouter);
app.use("/api/auth", authRouter);
app.use("/api/transactions", transactionsRouter);


// تحويل أي مسار غير معروف إلى خطأ 404.
app.use((_req, _res, next) => {
  next(new AppError("Route not found", 404));
});

// تمرير الأخطاء غير المعالجة داخل المسارات إلى المعالج الموحد.
app.use(errorHandler);

// الاتصال بقاعدة البيانات قبل استقبال الطلبات، ثم تجهيز الإغلاق الآمن.
async function startServer() {
  try {
    await prisma.$connect();

    console.log("Database connected successfully");

    const server = app.listen(env.PORT, () => {
      console.log(`API running on http://localhost:${env.PORT}`);
    });

    // إيقاف استقبال الطلبات أولًا ثم إغلاق اتصال قاعدة البيانات.
    const shutdown = (signal: string) => {
      console.log(`${signal} received. Shutting down...`);

      server.close(async () => {
        await prisma.$disconnect();

        console.log("Database disconnected successfully");
        console.log("Server shutdown complete");
      });
    };

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start server:", error);

    await prisma.$disconnect();
    process.exitCode = 1;
  }
}

startServer();
