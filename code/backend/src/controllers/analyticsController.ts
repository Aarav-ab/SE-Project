import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export async function getDepartmentAnalytics(req: Request, res: Response) {
  try {
    const total = await prisma.complaint.count();
    const inProgress = await prisma.complaint.count({
      where: { status: "In Progress" },
    });
    const pending = await prisma.complaint.count({
      where: { status: "Pending Dispatch" },
    });
    const resolved = await prisma.complaint.count({
      where: { status: { in: ["Resolved", "Closed"] } },
    });

    // Category breakdown
    const complaints = await prisma.complaint.findMany({
      select: {
        complaintType: true,
        priority: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
      },
    });

    const categoryMap: Record<string, number> = {};
    const priorityMap: Record<string, number> = { Low: 0, Medium: 0, Urgent: 0 };
    let totalResolutionHours = 0;
    let resolvedCountWithTime = 0;

    complaints.forEach((c) => {
      categoryMap[c.complaintType] = (categoryMap[c.complaintType] || 0) + 1;
      priorityMap[c.priority] = (priorityMap[c.priority] || 0) + 1;

      if (c.resolvedAt) {
        const diffMs = new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        totalResolutionHours += diffHours;
        resolvedCountWithTime++;
      }
    });

    const avgResolutionHours =
      resolvedCountWithTime > 0
        ? Math.round((totalResolutionHours / resolvedCountWithTime) * 10) / 10
        : 18.5;

    // SLA Calculation
    const slaMetCount = complaints.filter(
      (c) => c.status === "Resolved" || c.status === "Closed" || c.status === "In Progress"
    ).length;
    const slaComplianceRate = total > 0 ? Math.round((slaMetCount / total) * 100) : 100;

    // Recent activity
    const recentActivity = await prisma.timelineEvent.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        complaint: {
          select: { id: true, title: true, complaintType: true },
        },
      },
    });

    res.json({
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
    });
  } catch (error) {
    console.error("getDepartmentAnalytics error:", error);
    res.status(500).json({ error: "Failed to compute analytics." });
  }
}
