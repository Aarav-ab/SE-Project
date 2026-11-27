import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { getCached, setCached } from "../config/cache";

function getRangeStartDate(range: string): Date | null {
  const now = new Date();
  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (range === "7d") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (range === "30d") {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  return null;
}

export async function getDepartmentAnalytics(req: Request, res: Response) {
  try {
    const range = String(req.query.range || "all").toLowerCase();
    const cacheKey = `analytics:summary:${range}`;
    const cached = getCached(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const startDate = getRangeStartDate(range);
    const whereClause = startDate ? { createdAt: { gte: startDate } } : {};

    const [complaints, departments, workers, feedbacks, recentActivity] =
      await Promise.all([
        prisma.complaint.findMany({
          where: whereClause,
          select: {
            id: true,
            complaintType: true,
            priority: true,
            status: true,
            departmentId: true,
            address: true,
            targetCompletion: true,
            createdAt: true,
            resolvedAt: true,
            assignedWorkerId: true,
          },
        }),
        prisma.department.findMany({
          select: { id: true, name: true, code: true, defaultSlaHours: true },
          orderBy: { name: "asc" },
        }),
        prisma.fieldWorker.findMany({
          select: {
            id: true,
            status: true,
            complaints: {
              where: { status: { in: ["Assigned", "In Progress"] } },
              select: { id: true },
            },
          },
        }),
        prisma.feedback.findMany({
          where: startDate ? { complaint: { createdAt: { gte: startDate } } } : {},
          select: { rating: true },
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
    let slaCompliantCount = 0;

    const categoryMap: Record<string, number> = {};
    const priorityMap: Record<string, number> = { Low: 0, Medium: 0, Urgent: 0 };

    const deptStats: Record<
      string,
      { id: string; name: string; code: string; total: number; resolved: number; inProgress: number; pending: number }
    > = {};
    for (const d of departments) {
      deptStats[d.id] = {
        id: d.id,
        name: d.name,
        code: d.code,
        total: 0,
        resolved: 0,
        inProgress: 0,
        pending: 0,
      };
    }

    let totalResolutionHours = 0;
    let resolvedCountWithTime = 0;
    let under24hCount = 0;
    let between24And48hCount = 0;
    let breachedCount = 0;

    const localityCounts: Record<string, { count: number; label: string }> = {};
    const hourBuckets: Record<number, number> = {};
    const nowMs = Date.now();

    for (const c of complaints) {
      const isResolved = c.status === "Resolved" || c.status === "Closed";
      const isActive = c.status === "In Progress" || c.status === "Assigned";
      const createdMs = new Date(c.createdAt).getTime();

      if (isResolved) {
        resolved++;
      } else if (isActive) {
        inProgress++;
      } else {
        pending++;
      }

      if (c.departmentId && deptStats[c.departmentId]) {
        deptStats[c.departmentId].total++;
        if (isResolved) deptStats[c.departmentId].resolved++;
        else if (isActive) deptStats[c.departmentId].inProgress++;
        else deptStats[c.departmentId].pending++;
      }

      categoryMap[c.complaintType] = (categoryMap[c.complaintType] || 0) + 1;
      priorityMap[c.priority] = (priorityMap[c.priority] || 0) + 1;

      // SLA & turnaround analysis
      if (isResolved) {
        const resolvedMs = c.resolvedAt ? new Date(c.resolvedAt).getTime() : createdMs;
        const diffHours = Math.max(0, (resolvedMs - createdMs) / (1000 * 60 * 60));
        totalResolutionHours += diffHours;
        resolvedCountWithTime++;

        if (diffHours <= 24) {
          under24hCount++;
          slaCompliantCount++;
        } else if (diffHours <= 48) {
          between24And48hCount++;
          slaCompliantCount++;
        } else {
          breachedCount++;
        }
      } else {
        const targetMs = c.targetCompletion
          ? new Date(c.targetCompletion).getTime()
          : createdMs + 48 * 3600 * 1000;
        if (nowMs > targetMs) {
          breachedCount++;
        } else if (isActive) {
          slaCompliantCount++;
        }
      }

      // Locality grouping (use first segment before comma or full address)
      if (c.address && c.address.trim()) {
        const cleanAddr = c.address.trim();
        const key = cleanAddr.toLowerCase();
        if (!localityCounts[key]) {
          localityCounts[key] = { count: 0, label: cleanAddr };
        }
        localityCounts[key].count++;
      }

      const hour = new Date(c.createdAt).getHours();
      hourBuckets[hour] = (hourBuckets[hour] || 0) + 1;
    }

    const avgResolutionHours =
      resolvedCountWithTime > 0
        ? Math.round((totalResolutionHours / resolvedCountWithTime) * 10) / 10
        : 0;

    const slaComplianceRate =
      total > 0 ? Math.round((slaCompliantCount / total) * 100) : 100;

    const turnaroundDenominator = Math.max(1, resolved + breachedCount);
    const under24hPct =
      resolved + breachedCount > 0
        ? Math.round((under24hCount / turnaroundDenominator) * 100)
        : 0;
    const between24And48hPct =
      resolved + breachedCount > 0
        ? Math.round((between24And48hCount / turnaroundDenominator) * 100)
        : 0;
    const breachedPct =
      resolved + breachedCount > 0
        ? Math.max(0, 100 - under24hPct - between24And48hPct)
        : 0;

    const departmentBreakdown = Object.values(deptStats)
      .sort((a, b) => b.total - a.total)
      .map((d) => ({
        ...d,
        percentage: total > 0 ? Math.round((d.total / total) * 100) : 0,
      }));

    // Worker & operations metrics
    const totalWorkers = workers.length;
    const offDutyWorkers = workers.filter(
      (w) => w.status.includes("Off-Duty") || w.status.includes("Leave")
    ).length;
    const deployedWorkers = workers.filter(
      (w) => w.complaints.length > 0 || w.status.includes("On-Site")
    ).length;
    const availableWorkers = Math.max(
      0,
      totalWorkers - offDutyWorkers - deployedWorkers
    );
    const activePool = Math.max(1, totalWorkers - offDutyWorkers);
    const utilizationPct =
      totalWorkers > 0 ? Math.round((deployedWorkers / activePool) * 100) : 0;

    const topLocalityEntry = Object.values(localityCounts).sort(
      (a, b) => b.count - a.count
    )[0];
    const topLocality = topLocalityEntry ? topLocalityEntry.label : "No complaints yet";
    const topLocalityCount = topLocalityEntry ? topLocalityEntry.count : 0;
    const topLocalityPct =
      total > 0 ? Math.round((topLocalityCount / total) * 100) : 0;

    // Peak reporting window (2-hour window)
    let peakStartHour = -1;
    let peakCount = 0;
    for (let h = 0; h < 24; h++) {
      const windowCount = (hourBuckets[h] || 0) + (hourBuckets[(h + 1) % 24] || 0);
      if (windowCount > peakCount) {
        peakCount = windowCount;
        peakStartHour = h;
      }
    }
    const formatHour = (h: number) => {
      const period = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return `${String(h12).padStart(2, "0")}:00 ${period}`;
    };
    const peakReportingWindow =
      peakStartHour >= 0
        ? `${formatHour(peakStartHour)} – ${formatHour((peakStartHour + 2) % 24)}`
        : "No data";

    const ratingCount = feedbacks.length;
    const avgRating =
      ratingCount > 0
        ? (
            Math.round(
              (feedbacks.reduce((sum, f) => sum + f.rating, 0) / ratingCount) * 10
            ) / 10
          ).toFixed(1)
        : null;

    const payload = {
      range,
      summary: {
        totalComplaints: total,
        inProgress,
        pendingDispatch: pending,
        resolved,
        slaComplianceRate: `${slaComplianceRate}%`,
        avgResolutionHours: resolvedCountWithTime > 0 ? `${avgResolutionHours} hrs` : "0 hrs",
        avgRating,
        ratingCount,
      },
      categoryBreakdown: categoryMap,
      priorityBreakdown: priorityMap,
      departmentBreakdown,
      slaTurnaround: {
        under24hCount,
        under24hPct,
        between24And48hCount,
        between24And48hPct,
        breachedCount,
        breachedPct,
      },
      operations: {
        totalWorkers,
        deployedWorkers,
        availableWorkers,
        offDutyWorkers,
        utilizationPct,
        topLocality,
        topLocalityCount,
        topLocalityPct,
        peakReportingWindow,
        peakCount,
      },
      recentActivity,
    };

    setCached(cacheKey, payload);
    res.json(payload);
  } catch (error) {
    console.error("getDepartmentAnalytics error:", error);
    res.status(500).json({ error: "Failed to compute analytics." });
  }
}
