import express from "express";
import "dotenv/config";
import { env } from "./config/env";
import cors from "cors";
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

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});