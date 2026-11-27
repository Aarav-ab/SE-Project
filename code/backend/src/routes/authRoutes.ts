import { Router } from "express";
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  verifyPassword,
} from "../controllers/authController";
import { requireAuth, optionalAuth } from "../middlewares/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getMe);
router.patch("/profile", requireAuth, updateProfile);
router.post("/change-password", optionalAuth, changePassword);
router.post("/verify-password", optionalAuth, verifyPassword);

export default router;
