import express from "express";
import { z } from "zod";
import { pool } from "./db.js";
import { requireAdmin, requireAuth } from "./require-auth.js";

export const analyticsRouter = express.Router();

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const querySchema = z.object({
  period: z.enum(["today", "7d", "30d", "custom"]).default("7d"),
  from: z.string().regex(datePattern).optional(),
  to: z.string().regex(datePattern).optional(),
}).strict();
const analyticsTimeZone = "Asia/Kolkata";

function parseDate(value, label) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    const error = new Error(`${label} must be a valid calendar date in YYYY-MM-DD format.`);
    error.status = 400;
    throw error;
  }
  return parsed;
}

function dateInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function shiftDate(value, days) {
  const date = parseDate(value, "Date");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getRange(query) {
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) {
    const error = new Error(parsed.error.issues[0]?.message ?? "Invalid analytics date range.");
    error.status = 400;
    throw error;
  }
  const { period } = parsed.data;
  const today = dateInTimeZone(new Date(), analyticsTimeZone);
  let fromDate;
  let toDateExclusive;
  if (period === "custom") {
    if (!parsed.data.from || !parsed.data.to) {
      const error = new Error("Custom date ranges require both from and to dates.");
      error.status = 400;
      throw error;
    }
    parseDate(parsed.data.from, "Start date");
    parseDate(parsed.data.to, "End date");
    if (parsed.data.from > parsed.data.to) {
      const error = new Error("Start date must be on or before the end date.");
      error.status = 400;
      throw error;
    }
    fromDate = parsed.data.from;
    toDateExclusive = shiftDate(parsed.data.to, 1);
  } else {
    const days = period === "today" ? 1 : period === "7d" ? 7 : 30;
    fromDate = shiftDate(today, -(days - 1));
    toDateExclusive = shiftDate(today, 1);
  }
  return { period, fromDate, toDateExclusive, timezone: analyticsTimeZone };
}

analyticsRouter.get("/analytics", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const range = getRange(req.query);
    const values = [range.fromDate, range.toDateExclusive];
    const [
      summaryResult,
      departmentResult,
      turnaroundResult,
      localityResult,
      hourlyResult,
      workerResult,
    ] = await Promise.all([
      pool.query(
        `WITH selected AS (
           SELECT c.id, c.status, c.created_at,
             CASE WHEN c.status = 'Resolved' THEN COALESCE(
               (SELECT MAX(u.created_at) FROM complaint_updates u
                WHERE u.complaint_id = c.id AND u.status = 'Resolved'),
               (SELECT MAX(a.ended_at) FROM complaint_assignments a
                WHERE a.complaint_id = c.id AND a.status = 'completed'),
               c.updated_at
             ) END AS resolved_at
           FROM complaints c
           WHERE c.created_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Kolkata')
             AND c.created_at < ($2::date::timestamp AT TIME ZONE 'Asia/Kolkata')
         ), durations AS (
           SELECT EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600.0 AS hours
           FROM selected
           WHERE status = 'Resolved' AND resolved_at >= created_at
         )
         SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status = 'Resolved')::int AS resolved,
           COUNT(*) FILTER (WHERE status = 'In Progress')::int AS in_progress,
           COUNT(*) FILTER (WHERE status = 'Pending Dispatch')::int AS pending,
           (SELECT AVG(hours) FROM durations) AS average_resolution_hours
         FROM selected`,
        values,
      ),
      pool.query(
        `SELECT c.department,
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE c.status = 'Resolved')::int AS resolved,
           COUNT(*) FILTER (WHERE c.status = 'Pending Dispatch')::int AS pending,
           COUNT(*) FILTER (WHERE c.status = 'In Progress')::int AS in_progress,
           CASE WHEN (SELECT COUNT(*) FROM complaints
             WHERE created_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Kolkata')
               AND created_at < ($2::date::timestamp AT TIME ZONE 'Asia/Kolkata')) = 0
             THEN 0
             ELSE ROUND(
               COUNT(*) * 100.0 /
               (SELECT COUNT(*) FROM complaints
                WHERE created_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Kolkata')
                  AND created_at < ($2::date::timestamp AT TIME ZONE 'Asia/Kolkata')),
               1
             )
           END AS contribution_percent
         FROM complaints c
         WHERE c.created_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Kolkata')
           AND c.created_at < ($2::date::timestamp AT TIME ZONE 'Asia/Kolkata')
         GROUP BY c.department
         ORDER BY COUNT(*) DESC, c.department`,
        values,
      ),
      pool.query(
        `WITH resolved AS (
           SELECT c.id, EXTRACT(EPOCH FROM (resolution.resolved_at - c.created_at)) / 3600.0 AS hours
           FROM complaints c
           CROSS JOIN LATERAL (
             SELECT COALESCE(
               (SELECT MAX(u.created_at) FROM complaint_updates u
                WHERE u.complaint_id = c.id AND u.status = 'Resolved'),
               (SELECT MAX(a.ended_at) FROM complaint_assignments a
                WHERE a.complaint_id = c.id AND a.status = 'completed'),
               c.updated_at
             ) AS resolved_at
           ) resolution
           WHERE c.status = 'Resolved'
             AND c.created_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Kolkata')
             AND c.created_at < ($2::date::timestamp AT TIME ZONE 'Asia/Kolkata')
             AND resolution.resolved_at >= c.created_at
         )
         SELECT COUNT(*) FILTER (WHERE hours < 24)::int AS under_24,
           COUNT(*) FILTER (WHERE hours >= 24 AND hours <= 48)::int AS hours_24_48,
           COUNT(*) FILTER (WHERE hours > 48)::int AS over_48,
           COUNT(*)::int AS total
         FROM resolved`,
        values,
      ),
      pool.query(
        `SELECT MIN(BTRIM(c.address)) AS locality, COUNT(*)::int AS complaints
         FROM complaints c
         WHERE c.created_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Kolkata')
           AND c.created_at < ($2::date::timestamp AT TIME ZONE 'Asia/Kolkata')
           AND NULLIF(BTRIM(c.address), '') IS NOT NULL
         GROUP BY LOWER(REGEXP_REPLACE(BTRIM(c.address), '[[:space:]]+', ' ', 'g'))
         ORDER BY COUNT(*) DESC, LOWER(REGEXP_REPLACE(BTRIM(c.address), '[[:space:]]+', ' ', 'g'))
         LIMIT 1`,
        values,
      ),
      pool.query(
        `SELECT EXTRACT(HOUR FROM c.created_at AT TIME ZONE 'Asia/Kolkata')::int AS hour_ist,
           COUNT(*)::int AS complaints
         FROM complaints c
         WHERE c.created_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Kolkata')
           AND c.created_at < ($2::date::timestamp AT TIME ZONE 'Asia/Kolkata')
         GROUP BY hour_ist
         ORDER BY hour_ist`,
        values,
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE w.duty_status = 'available' OR a.id IS NOT NULL)::int AS active,
           COUNT(*) FILTER (WHERE w.duty_status = 'available' AND a.id IS NULL)::int AS available,
           COUNT(*) FILTER (WHERE a.id IS NOT NULL)::int AS assigned,
           COUNT(*) FILTER (WHERE w.duty_status IN ('off_duty', 'on_leave'))::int AS off_duty
         FROM field_workers w
         LEFT JOIN complaint_assignments a ON a.worker_id = w.id AND a.status = 'active'`,
      ),
    ]);

    const summary = summaryResult.rows[0];
    const turnaround = turnaroundResult.rows[0];
    const turnaroundTotal = turnaround.total;
    const buckets = [
      { key: "under24Hours", label: "Under 24 hours", count: turnaround.under_24 },
      { key: "hours24to48", label: "24–48 hours", count: turnaround.hours_24_48 },
      { key: "over48Hours", label: "Over 48 hours", count: turnaround.over_48 },
    ].map((bucket) => ({
      ...bucket,
      percent: turnaroundTotal ? Number(((bucket.count * 100) / turnaroundTotal).toFixed(1)) : null,
    }));
    const peakHour = hourlyResult.rows.reduce(
      (peak, row) => (!peak || row.complaints > peak.complaints ? row : peak),
      null,
    );

    res.json({
      range: { period: range.period, from: range.fromDate, toExclusive: range.toDateExclusive, timezone: range.timezone },
      kpis: {
        totalComplaints: summary.total,
        resolvedComplaints: summary.resolved,
        inProgressComplaints: summary.in_progress,
        pendingComplaints: summary.pending,
        averageResolutionHours: summary.average_resolution_hours === null
          ? null
          : Number(Number(summary.average_resolution_hours).toFixed(1)),
        slaCompliancePercent: null,
        slaUnavailableReason: "No SLA target is configured.",
      },
      departments: departmentResult.rows.map((row) => ({
        department: row.department,
        total: row.total,
        resolved: row.resolved,
        pending: row.pending,
        inProgress: row.in_progress,
        contributionPercent: Number(row.contribution_percent),
      })),
      resolutionBuckets: buckets,
      operations: {
        mostReportedLocality: localityResult.rows[0]
          ? { name: localityResult.rows[0].locality, complaints: localityResult.rows[0].complaints }
          : null,
        peakReportingHour: peakHour ? { hourIst: peakHour.hour_ist, complaints: peakHour.complaints } : null,
        workers: {
          total: workerResult.rows[0].total,
          active: workerResult.rows[0].active,
          available: workerResult.rows[0].available,
          assigned: workerResult.rows[0].assigned,
          offDuty: workerResult.rows[0].off_duty,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});
