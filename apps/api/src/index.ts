import express from "express";
import "dotenv/config";
import { env } from "./config/env";
import cors from "cors";
import { errorHandler } from "./middleware/error-handler";
import { AppError } from "./errors/app-error";
import healthRouter from "./routes/health.routes.js";
import { prisma } from "./lib/prisma.js";
import authRouter from "./routes/auth.routes.js";
import accountsRouter from "./routes/accounts.routes.js";
const app = express();
const PORT = env.PORT;

app.use(
  cors({
   origin: env.WEB_ORIGIN
  }),
);

app.use(express.json());

// Routes
  app.use("/api", healthRouter);
  // show qccounts for juser 
  app.use("/api/accounts", accountsRouter);
  // regitser user
app.use("/api/auth", authRouter);
//login user
app.use("/api/auth", authRouter);

app.use((_req, _res, next) => {
  next(new AppError("Route not found", 404));
});
app.use(errorHandler);
async function startServer() {
  try {
    await prisma.$connect();

    console.log("Database connected successfully");

    const server = app.listen(env.PORT, () => {
      console.log(`API running on http://localhost:${env.PORT}`);
    });

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