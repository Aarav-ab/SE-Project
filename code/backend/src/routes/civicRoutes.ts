import { Router } from "express";
import {
  getWards,
  getDepartments,
  getAnnouncements,
  suggestRouting,
} from "../controllers/civicController";

const router = Router();

router.get("/wards", getWards);
router.get("/departments", getDepartments);
router.get("/announcements", getAnnouncements);
router.post("/suggest", suggestRouting);

export default router;
