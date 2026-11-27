import { Router } from "express";
import {
  getWards,
  getDepartments,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  suggestRouting,
} from "../controllers/civicController";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/wards", getWards);
router.get("/departments", getDepartments);
router.get("/announcements", getAnnouncements);
router.post("/announcements", requireAuth, requireAdmin, createAnnouncement);
router.patch("/announcements/:id", requireAuth, requireAdmin, updateAnnouncement);
router.delete("/announcements/:id", requireAuth, requireAdmin, deleteAnnouncement);
router.post("/suggest", suggestRouting);

export default router;
