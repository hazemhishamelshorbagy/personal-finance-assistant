import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "personal-finance-api",
  });
});

export default router;