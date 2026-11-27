import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { recommendDepartment } from "../services/routingService";

export async function getWards(_req: Request, res: Response) {
  res.json({ wards: [] });
}

export async function getDepartments(_req: Request, res: Response) {
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
    const includeInactive = req.query.includeInactive === "true";
    const announcements = await prisma.announcement.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: { createdAt: "asc" },
    });
    res.json({ announcements });
  } catch (error) {
    console.error("getAnnouncements error:", error);
    res.status(500).json({ error: "Failed to fetch announcements." });
  }
}

export async function createAnnouncement(req: Request, res: Response) {
  try {
    const { title, content, category, icon, active } = req.body;
    if (!title || !String(title).trim() || !content || !String(content).trim()) {
      res.status(400).json({ error: "Schedule title and description are required." });
      return;
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: String(title).trim(),
        content: String(content).trim(),
        category: category ? String(category).trim() : "Advisory",
        icon: icon ? String(icon).trim() : "📢",
        active: active !== undefined ? Boolean(active) : true,
      },
    });

    res.status(201).json({ announcement });
  } catch (error) {
    console.error("createAnnouncement error:", error);
    res.status(500).json({ error: "Failed to create schedule item." });
  }
}

export async function updateAnnouncement(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { title, content, category, icon, active } = req.body;

    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Schedule item not found." });
      return;
    }

    if (title !== undefined && !String(title).trim()) {
      res.status(400).json({ error: "Schedule title cannot be empty." });
      return;
    }
    if (content !== undefined && !String(content).trim()) {
      res.status(400).json({ error: "Schedule description cannot be empty." });
      return;
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: String(title).trim() } : {}),
        ...(content !== undefined ? { content: String(content).trim() } : {}),
        ...(category !== undefined ? { category: String(category).trim() || "Advisory" } : {}),
        ...(icon !== undefined ? { icon: String(icon).trim() || "📢" } : {}),
        ...(active !== undefined ? { active: Boolean(active) } : {}),
      },
    });

    res.json({ announcement });
  } catch (error) {
    console.error("updateAnnouncement error:", error);
    res.status(500).json({ error: "Failed to update schedule item." });
  }
}

export async function deleteAnnouncement(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Schedule item not found." });
      return;
    }

    await prisma.announcement.delete({ where: { id } });
    res.json({ message: "Schedule item deleted.", id });
  } catch (error) {
    console.error("deleteAnnouncement error:", error);
    res.status(500).json({ error: "Failed to delete schedule item." });
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
