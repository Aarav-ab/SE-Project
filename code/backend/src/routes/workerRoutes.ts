import { Router } from "express";
import {
  getAllWorkers,
  updateWorkerStatus,
  updateWorker,
  createWorker,
  freeWorker,
} from "../controllers/workerController";

const router = Router();

router.get("/", getAllWorkers);
router.post("/", createWorker);
router.patch("/:id", updateWorker);
router.patch("/:id/status", updateWorkerStatus);
router.post("/:id/free", freeWorker);

export default router;
