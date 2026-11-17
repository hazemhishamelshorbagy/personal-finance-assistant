import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  getUserAccounts,
  createUserAccount,
  updateUserAccount,
  deleteUserAccount,
} from "../services/accounts.service.js";
import { AppError } from "../errors/app-error.js";
import { createTransferTransaction } from "../services/transactions.service.js";

const router = Router();

// إرجاع الحسابات النشطة الخاصة بالمستخدم المسجل دخوله.
router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const userId = res.locals.authUser.id;

    const accounts = await getUserAccounts(userId);

    res.status(200).json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    next(error);
  }
});

// إنشاء حساب مالي جديد للمستخدم الحالي.
router.post("/", requireAuth, async (req, res, next) => {
  try {
    // أخذ هوية المستخدم من بيانات المصادقة التي أضافها الوسيط.
    const userId = res.locals.authUser.id;

    // التحقق من البيانات وإنشاء الحساب عبر طبقة الخدمات.
    const account = await createUserAccount(userId, req.body);

    res.status(201).json({
      success: true,
      data: account,
    });
  } catch (error) {
    next(error);
  }
});

// تحديث بيانات حساب يخص المستخدم الحالي.
router.put("/:accountId", requireAuth, async (req, res, next) => {
  try {
    const userId = res.locals.authUser.id;
    const accountId = req.params.accountId;

    // التأكد من أن معرّف الحساب المأخوذ من المسار قيمة نصية صالحة.
    if (typeof accountId !== "string") {
      throw new AppError("Invalid account ID", 400);
    }

    const account = await updateUserAccount(userId, accountId, req.body);

    res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    next(error);
  }
});

// إيقاف الحساب بدل حذفه فعليًا للحفاظ على السجلات المرتبطة به.
router.delete("/:accountId", requireAuth, async (req, res, next) => {
  try {
    const userId = res.locals.authUser.id;
    const accountId = req.params.accountId;

    // رفض الطلب إذا لم يكن معرّف الحساب نصًا صالحًا.
    if (typeof accountId !== "string") {
      throw new AppError("Invalid account ID", 400);
    }

    // تنفيذ الإيقاف المنطقي ثم تأكيد نجاح العملية للعميل.
    await deleteUserAccount(userId, accountId);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
