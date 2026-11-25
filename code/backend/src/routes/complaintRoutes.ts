import { Router } from "express";
import {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaintWorker,
  addComplaintFeedback,
  deleteComplaint,
} from "../controllers/complaintController";
import { optionalAuth, requireAuth } from "../middlewares/auth";
import { upload } from "../middlewares/upload";

const router = Router();

// Create complaint (supports file uploads: files is field name in form-data)
router.post("/", optionalAuth, upload.array("files", 5), createComplaint);

// List complaints (with query params: status, category, departmentId, wardId, search)
router.get("/", optionalAuth, getAllComplaints);

// Get single complaint by ID
router.get("/:id", optionalAuth, getComplaintById);

// Update complaint status
router.patch("/:id/status", optionalAuth, updateComplaintStatus);

// Assign field worker
router.patch("/:id/assign", optionalAuth, assignComplaintWorker);

// Add citizen feedback
router.post("/:id/feedback", optionalAuth, addComplaintFeedback);

// Delete complaint
router.delete("/:id", optionalAuth, deleteComplaint);

export default router;
