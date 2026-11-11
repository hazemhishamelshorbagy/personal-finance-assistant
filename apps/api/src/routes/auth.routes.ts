import { Router } from "express";
import { loginWithEmail, registerWithEmail } from "../services/auth.service.js";

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
router.post("/login", async (req, res, next) => {
  try {
    const user = await loginWithEmail(req.body);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});
export default router;