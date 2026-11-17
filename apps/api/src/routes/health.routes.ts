import { Router } from "express";

const router = Router();

// نقطة فحص بسيطة للتأكد من أن خادم واجهة API يستجيب.
router.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "personal-finance-api",
  });
});

export default router;