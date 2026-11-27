import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { getCached, setCached } from "../config/cache";

export async function getDepartmentAnalytics(req: Request, res: Response) {
  try {
    const cached = getCached("analytics:summary");
    if (cached) {
      res.json(cached);
      return;
    }

    const [complaints, recentActivity] = await Promise.all([
      prisma.complaint.findMany({
        select: {
          complaintType: true,
          priority: true,
          status: true,
          createdAt: true,
          resolvedAt: true,
        },
      }),
      prisma.timelineEvent.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          complaint: {
            select: { id: true, title: true, complaintType: true },
          },
        },
      }),
    ]);

    const total = complaints.length;
    let inProgress = 0;
    let pending = 0;
    let resolved = 0;
    let slaMetCount = 0;

    const categoryMap: Record<string, number> = {};
    const priorityMap: Record<string, number> = { Low: 0, Medium: 0, Urgent: 0 };
    let totalResolutionHours = 0;
    let resolvedCountWithTime = 0;

    for (const c of complaints) {
      if (c.status === "Resolved" || c.status === "Closed") {
        resolved++;
        slaMetCount++;
      } else if (c.status === "In Progress" || c.status === "Assigned") {
        inProgress++;
        slaMetCount++;
      } else if (c.status === "Pending Dispatch") {
        pending++;
      }

      categoryMap[c.complaintType] = (categoryMap[c.complaintType] || 0) + 1;
      priorityMap[c.priority] = (priorityMap[c.priority] || 0) + 1;

      if (c.resolvedAt) {
        const diffMs = new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        totalResolutionHours += diffHours;
        resolvedCountWithTime++;
      }
    }

    const avgResolutionHours =
      resolvedCountWithTime > 0
        ? Math.round((totalResolutionHours / resolvedCountWithTime) * 10) / 10
        : 18.5;

    const slaComplianceRate = total > 0 ? Math.round((slaMetCount / total) * 100) : 100;

    const payload = {
      summary: {
        totalComplaints: total,
        inProgress,
        pendingDispatch: pending,
        resolved,
        slaComplianceRate: `${slaComplianceRate}%`,
        avgResolutionHours: `${avgResolutionHours} hrs`,
      },
      categoryBreakdown: categoryMap,
      priorityBreakdown: priorityMap,
      recentActivity,
    };

    setCached("analytics:summary", payload);
    res.json(payload);
  } catch (error) {
    console.error("getDepartmentAnalytics error:", error);
    res.status(500).json({ error: "Failed to compute analytics." });
  }
}
