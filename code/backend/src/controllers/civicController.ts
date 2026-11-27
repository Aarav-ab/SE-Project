import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { recommendDepartment } from "../services/routingService";

export async function getWards(_req: Request, res: Response) {
  res.json({ wards: [] });
}

export async function getDepartments(req: Request, res: Response) {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
    });
    res.json({ departments });
  } catch (error) {
    console.error("getDepartments error:", error);
    res.status(500).json({ error: "Failed to fetch departments." });
  }
}

export async function getAnnouncements(req: Request, res: Response) {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ announcements });
  } catch (error) {
    console.error("getAnnouncements error:", error);
    res.status(500).json({ error: "Failed to fetch announcements." });
  }
}

export async function suggestRouting(req: Request, res: Response) {
  try {
    const { title, description, category } = req.body;

    if (!description && !title) {
      res.status(400).json({ error: "Title or description required for AI suggestion." });
      return;
    }

    const suggestion = recommendDepartment(title || "", description || "", category);
    res.json({ suggestion });
  } catch (error) {
    console.error("suggestRouting error:", error);
    res.status(500).json({ error: "Failed to generate recommendation." });
  }
}
