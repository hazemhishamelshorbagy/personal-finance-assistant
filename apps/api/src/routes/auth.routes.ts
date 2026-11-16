import { Router } from "express";
import { loginWithEmail, registerWithEmail } from "../services/auth.service.js";
import { createSession,deleteSession } from "../services/session.service.js";
import { requireAuth } from "../middleware/auth.middleware.js";

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
    // Verify email and password
    const user = await loginWithEmail(req.body);

    // Create a new database session
    const session = await createSession(user.id);

    // Send the session token as an HttpOnly cookie
    res.cookie("pfa_session", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: session.expires,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});
router.get("/me", requireAuth, (req, res) => {
  res.status(200).json({
    success: true,
    data: res.locals.authUser,
  });
});

router.post("/logout", async (req, res, next) => {
  try {
    const token = req.cookies?.pfa_session;

    // Delete the current session from the database
    if (token) {
      await deleteSession(token);
    }

    // Remove the cookie from the browser
    res.clearCookie("pfa_session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
});
export default router;