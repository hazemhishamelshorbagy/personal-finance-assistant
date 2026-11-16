import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  getUserAccounts,
  createUserAccount,
  updateUserAccount,
  deleteUserAccount,
} from "../services/accounts.service.js";
import { AppError } from "../errors/app-error.js";

const router = Router();

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

router.post("/", requireAuth, async (req, res, next) => {
  try {
    // Get the authenticated user's ID
    const userId = res.locals.authUser.id;

    // Create a new financial account
    const account = await createUserAccount(userId, req.body);

    res.status(201).json({
      success: true,
      data: account,
    });
  } catch (error) {
    next(error);
  }
});
router.put("/:accountId", requireAuth, async (req, res, next) => {
  try {
    const userId = res.locals.authUser.id;
    const accountId = req.params.accountId;
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

router.delete("/:accountId", requireAuth, async (req, res, next) => {
  try {
    const userId = res.locals.authUser.id;
    const accountId = req.params.accountId;

    if (typeof accountId !== "string") {
      throw new AppError("Invalid account ID", 400);
    }

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
