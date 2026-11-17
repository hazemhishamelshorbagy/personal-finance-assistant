import { Router } from "express";
import { loginWithEmail, registerWithEmail } from "../services/auth.service.js";
import { createSession,deleteSession } from "../services/session.service.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// تسجيل مستخدم جديد بعد التحقق من بيانات الطلب في خدمة المصادقة.
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

// تسجيل الدخول وإنشاء جلسة تُرسل للمتصفح كملف تعريف ارتباط آمن.
router.post("/login", async (req, res, next) => {
  try {
    // التحقق من البريد وكلمة المرور.
    const user = await loginWithEmail(req.body);

    // إنشاء جلسة جديدة للمستخدم.
    const session = await createSession(user.id);

    // إرسال الرمز في ملف ارتباط لا تستطيع JavaScript قراءته.
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

// إرجاع بيانات المستخدم المرتبطة بالجلسة الحالية.
router.get("/me", requireAuth, (req, res) => {
  res.status(200).json({
    success: true,
    data: res.locals.authUser,
  });
});

// حذف الجلسة الحالية وإزالة ملف الارتباط من المتصفح.
router.post("/logout", async (req, res, next) => {
  try {
    const token = req.cookies?.pfa_session;

    // حذف الجلسة من قاعدة البيانات إذا كان هناك رمز جلسة.
    if (token) {
      await deleteSession(token);
    }

    // مسح ملف الارتباط بإعدادات مطابقة لإعدادات إنشائه.
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