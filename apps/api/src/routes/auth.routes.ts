import { Router } from "express";
import { registerWithEmail } from "../services/auth.service.js";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const user = await registerWithEmail(req.body);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

export default router;