import express from "express";
import { z } from "zod";
import { pool } from "./db.js";
import { requireAdmin, requireAuth } from "./require-auth.js";

export const workersRouter = express.Router();

const uuidSchema = z.string().uuid();
const createWorkerSchema = z.object({
  name: z.string().trim().min(1).max(160),
  designation: z.string().trim().min(1).max(160),
  department: z.string().trim().min(1).max(160),
  contactInfo: z.string().trim().max(120).optional().default(""),
});
const updateWorkerSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  designation: z.string().trim().min(1).max(160).optional(),
  department: z.string().trim().min(1).max(160).optional(),
  contactInfo: z.string().trim().max(120).optional(),
  dutyStatus: z.enum(["available", "off_duty", "on_leave"]).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");
const endAssignmentSchema = z.object({
  status: z.enum(["completed", "released"]),
  feedback: z.string().trim().max(5000).optional().default(""),
});

workersRouter.use(requireAuth, requireAdmin);

function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    const error = new Error(result.error.issues[0]?.message ?? "Invalid request data.");
    error.status = 400;
    throw error;
  }
  return result.data;
}

function validId(value) {
  if (!uuidSchema.safeParse(value).success) {
    const error = new Error("The requested identifier is invalid.");
    error.status = 400;
    throw error;
  }
}

const workerSelect = `
  SELECT w.id, w.name, w.designation, w.department, w.contact_info, w.duty_status,
    w.created_at, w.updated_at,
    CASE
      WHEN a.id IS NOT NULL THEN 'busy'
      WHEN w.duty_status = 'available' THEN 'available'
      ELSE w.duty_status
    END AS availability,
    a.id AS assignment_id, a.complaint_id, c.complaint_type, c.description AS complaint_title,
    a.assigned_at
  FROM field_workers w
  LEFT JOIN complaint_assignments a ON a.worker_id = w.id AND a.status = 'active'
  LEFT JOIN complaints c ON c.id = a.complaint_id`;

function mapWorker(row) {
  return {
    id: row.id,
    name: row.name,
    designation: row.designation,
    department: row.department,
    contactInfo: row.contact_info ?? "",
    dutyStatus: row.duty_status,
    availability: row.availability,
    activeAssignment: row.assignment_id
      ? {
          id: row.assignment_id,
          complaintId: row.complaint_id,
          title: row.complaint_title,
          assignedAt: row.assigned_at,
        }
      : null,
  };
}

workersRouter.get("/workers", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`${workerSelect} ORDER BY w.name`);
    res.json({ workers: rows.map(mapWorker) });
  } catch (error) {
    next(error);
  }
});

workersRouter.post("/workers", async (req, res, next) => {
  try {
    const data = parse(createWorkerSchema, req.body);
    const { rows } = await pool.query(
      `INSERT INTO field_workers (name, designation, department, contact_info)
       VALUES ($1, $2, $3, NULLIF($4, ''))
       RETURNING id, name, designation, department, contact_info, duty_status,
         created_at, updated_at, 'available'::text AS availability`,
      [data.name, data.designation, data.department, data.contactInfo],
    );
    res.status(201).json({ worker: mapWorker(rows[0]) });
  } catch (error) {
    next(error);
  }
});

workersRouter.patch("/workers/:id", async (req, res, next) => {
  let client;
  try {
    validId(req.params.id);
    const data = parse(updateWorkerSchema, req.body);
    client = await pool.connect();
    await client.query("BEGIN");
    const lockedWorker = await client.query(
      "SELECT id FROM field_workers WHERE id = $1 FOR UPDATE",
      [req.params.id],
    );
    if (!lockedWorker.rows.length) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Field worker not found." });
      return;
    }
    if (Object.hasOwn(data, "dutyStatus")) {
      const activeAssignment = await client.query(
        "SELECT 1 FROM complaint_assignments WHERE worker_id = $1 AND status = 'active' LIMIT 1",
        [req.params.id],
      );
      if (activeAssignment.rows.length) {
        const error = new Error("Duty status cannot be changed while this worker has an active assignment.");
        error.status = 409;
        throw error;
      }
    }
    const fields = {
      name: "name",
      designation: "designation",
      department: "department",
      contactInfo: "contact_info",
      dutyStatus: "duty_status",
    };
    const values = [];
    const updates = Object.entries(fields)
      .filter(([key]) => Object.hasOwn(data, key))
      .map(([key, column]) => {
        values.push(key === "contactInfo" ? data[key] || null : data[key]);
        return `${column} = $${values.length}`;
      });
    values.push(req.params.id);
    await client.query(
      `UPDATE field_workers SET ${updates.join(", ")}, updated_at = NOW()
       WHERE id = $${values.length} RETURNING id`,
      values,
    );
    await client.query("COMMIT");
    const workerResult = await pool.query(`${workerSelect} WHERE w.id = $1`, [req.params.id]);
    res.json({ worker: mapWorker(workerResult.rows[0]) });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    next(error);
  } finally {
    client?.release();
  }
});

workersRouter.get("/assignments", async (req, res, next) => {
  try {
    let query = `
      SELECT a.id, a.complaint_id, c.description AS complaint_title,
        a.worker_id, w.name AS worker_name, a.assigned_by, admin.name AS assigned_by_name,
        a.assigned_at, a.status, a.ended_by, a.ended_at, a.end_feedback
      FROM complaint_assignments a
      JOIN complaints c ON c.id = a.complaint_id
      JOIN field_workers w ON w.id = a.worker_id
      JOIN users admin ON admin.id = a.assigned_by`;
    const values = [];
    if (req.query.complaintId) {
      query += " WHERE a.complaint_id = $1";
      values.push(parse(z.string().trim().min(1).max(100), req.query.complaintId));
    }
    query += " ORDER BY a.assigned_at DESC";
    const { rows } = await pool.query(query, values);
    res.json({
      assignments: rows.map((row) => ({
        id: row.id,
        complaintId: row.complaint_id,
        complaintTitle: row.complaint_title,
        workerId: row.worker_id,
        workerName: row.worker_name,
        assignedBy: row.assigned_by,
        assignedByName: row.assigned_by_name,
        assignedAt: row.assigned_at,
        status: row.status,
        endedBy: row.ended_by,
        endedAt: row.ended_at,
        feedback: row.end_feedback,
      })),
    });
  } catch (error) {
    next(error);
  }
});

workersRouter.post("/complaints/:complaintId/assign", async (req, res, next) => {
  let client;
  try {
    const complaintId = parse(z.string().trim().min(1).max(100), req.params.complaintId);
    const workerId = parse(z.object({ workerId: uuidSchema }).strict(), req.body).workerId;
    client = await pool.connect();
    await client.query("BEGIN");
    const complaintResult = await client.query(
      "SELECT id, status FROM complaints WHERE id = $1 FOR UPDATE",
      [complaintId],
    );
    if (!complaintResult.rows.length) {
      const error = new Error("Complaint not found.");
      error.status = 404;
      throw error;
    }
    const complaint = complaintResult.rows[0];
    if (complaint.status !== "Pending Dispatch") {
      const error = new Error("Only complaints pending dispatch can be assigned.");
      error.status = 409;
      throw error;
    }
    const workerResult = await client.query(
      "SELECT id, duty_status FROM field_workers WHERE id = $1 FOR UPDATE",
      [workerId],
    );
    if (!workerResult.rows.length) {
      const error = new Error("Field worker not found.");
      error.status = 404;
      throw error;
    }
    if (workerResult.rows[0].duty_status !== "available") {
      const error = new Error("Only workers with available duty status can be dispatched.");
      error.status = 409;
      throw error;
    }
    const existing = await client.query(
      "SELECT 1 FROM complaint_assignments WHERE worker_id = $1 AND status = 'active'",
      [workerId],
    );
    if (existing.rows.length) {
      const error = new Error("This field worker already has an active assignment.");
      error.status = 409;
      throw error;
    }
    await client.query(
      `INSERT INTO complaint_assignments (complaint_id, worker_id, assigned_by)
       VALUES ($1, $2, $3)`,
      [complaintId, workerId, req.user.id],
    );
    await client.query(
      "UPDATE complaints SET status = 'In Progress', updated_at = NOW() WHERE id = $1",
      [complaintId],
    );
    await client.query(
      `INSERT INTO complaint_updates (complaint_id, admin_id, status, feedback)
       VALUES ($1, $2, 'In Progress', $3)`,
      [complaintId, req.user.id, "Assigned to field worker."],
    );
    await client.query("COMMIT");
    res.status(201).json({ message: "Field worker assigned and complaint dispatched." });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
      if (error.code === "23505") {
        error.status = 409;
        error.message = "This worker or complaint already has an active assignment.";
      }
    }
    next(error);
  } finally {
    client?.release();
  }
});

workersRouter.patch("/assignments/:id", async (req, res, next) => {
  let client;
  try {
    validId(req.params.id);
    const data = parse(endAssignmentSchema, req.body);
    client = await pool.connect();
    await client.query("BEGIN");
    const assignmentLookup = await client.query(
      `SELECT complaint_id FROM complaint_assignments
       WHERE id = $1 AND status = 'active'`,
      [req.params.id],
    );
    if (!assignmentLookup.rows.length) {
      const error = new Error("Active assignment not found.");
      error.status = 404;
      throw error;
    }
    await client.query(
      "SELECT id FROM complaints WHERE id = $1 FOR UPDATE",
      [assignmentLookup.rows[0].complaint_id],
    );
    const assignmentResult = await client.query(
      `SELECT id, complaint_id, worker_id FROM complaint_assignments
       WHERE id = $1 AND status = 'active' FOR UPDATE`,
      [req.params.id],
    );
    if (!assignmentResult.rows.length) {
      const error = new Error("Active assignment not found.");
      error.status = 404;
      throw error;
    }
    const assignment = assignmentResult.rows[0];
    const status = data.status === "completed" ? "Resolved" : "Pending Dispatch";
    await client.query(
      `UPDATE complaint_assignments
       SET status = $1, ended_by = $2, ended_at = NOW(), end_feedback = $3
       WHERE id = $4`,
      [data.status, req.user.id, data.feedback, assignment.id],
    );
    await client.query(
      "UPDATE complaints SET status = $1, admin_feedback = $2, updated_at = NOW() WHERE id = $3",
      [status, data.feedback, assignment.complaint_id],
    );
    await client.query(
      `INSERT INTO complaint_updates (complaint_id, admin_id, status, feedback)
       VALUES ($1, $2, $3, $4)`,
      [assignment.complaint_id, req.user.id, status, data.feedback],
    );
    await client.query("COMMIT");
    res.json({ message: data.status === "completed" ? "Assignment completed." : "Assignment released." });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    next(error);
  } finally {
    client?.release();
  }
});
