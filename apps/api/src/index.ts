import express from "express";
import "dotenv/config";
import { env } from "./config/env";
import cors from "cors";
import { errorHandler } from "./middleware/error-handler";
import { AppError } from "./errors/app-error";
const app = express();
const PORT = env.PORT;

app.use(
  cors({
   origin: env.WEB_ORIGIN
  }),
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "personal-finance-api",
  });
});
app.use((_req, _res, next) => {
  next(new AppError("Route not found", 404));
});
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});