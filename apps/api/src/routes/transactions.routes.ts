import { Router } from "express";

import { createIncomeTransaction, createTransferTransaction } from "../services/transactions.service.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { getUserTransactions } from "../services/transactions.service.js";
import { createExpenseTransaction } from "../services/transactions.service.js";
import { createAdjustmentTransaction } from "../services/transactions.service.js";
const router = Router();

// جلب معاملات المستخدم المسجل مع خيارات الترقيم الواردة في الاستعلام.
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const userId = res.locals.authUser.id;

    const result = await getUserTransactions(userId, req.query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// إنشاء معاملة دخل للمستخدم الحالي.
router.post("/income", requireAuth, async (req, res, next) => {
  try {
    const userId = res.locals.authUser.id;

    const result = await createIncomeTransaction(userId, req.body);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// إنشاء معاملة مصروف للمستخدم الحالي.
router.post("/expense", requireAuth, async (req, res, next) => {
  try {
    const userId = res.locals.authUser.id;

    const result = await createExpenseTransaction(userId, req.body);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// تحويل مبلغ بين حسابين يملكهما المستخدم الحالي.
router.post("/transfer", requireAuth, async (req, res, next) => {
  try {
    const userId = res.locals.authUser.id;

    const result = await createTransferTransaction(userId, req.body);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});
router.post("/adjustment", requireAuth, async (req, res, next) => {
  try {
    const userId = res.locals.authUser.id;

    const result = await createAdjustmentTransaction(userId, req.body);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});
export default router;