import { Router } from "express";
import { getDepartmentAnalytics } from "../controllers/analyticsController";

const router = Router();

router.get("/", getDepartmentAnalytics);

export default router;
