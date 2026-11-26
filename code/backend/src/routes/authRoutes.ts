import { Router } from "express";
import {
  register,
  login,
  getMe,
  changePassword,
  verifyPassword,
} from "../controllers/authController";
import { requireAuth, optionalAuth } from "../middlewares/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getMe);
router.post("/change-password", optionalAuth, changePassword);
router.post("/verify-password", optionalAuth, verifyPassword);

export default router;
