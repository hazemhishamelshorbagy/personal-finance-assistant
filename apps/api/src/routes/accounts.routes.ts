import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.status(501).json({
    success: false,
    error: {
      message: "Authentication is not implemented yet",
    },
  });
});


export default router;