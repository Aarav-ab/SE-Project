import { randomBytes } from "node:crypto";
import express from "express";
import multer from "multer";
import { z } from "zod";
import { pool } from "./db.js";
import { requireAdmin, requireAuth } from "./require-auth.js";

export const complaintsRouter = express.Router();
const maxFileSize = 25 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSize, files: 5, fields: 12, fieldSize: 64 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!["image/jpeg", "image/png", "video/mp4"].includes(file.mimetype)) {
      const error = new Error("Evidence files must be JPG, PNG, or MP4.");
      error.status = 400;
      callback(error);
      return;
    }
    callback(null, true);
  },
});

const createComplaintSchema = z.object({
  complaintType: z.string().trim().min(2).max(100),
  description: z.string().trim().min(1).max(10000),
  priority: z.enum(["Low", "Medium", "Urgent"]),
  address: z.string().trim().max(500),
  pinCode: z.string().trim().max(20),
  landmark: z.string().trim().max(500).default(""),
  ward: z.string().trim().max(120).default(""),
  latitude: z.string().optional().transform((value) => value ? Number(value) : null)
    .refine((value) => value === null || (Number.isFinite(value) && value >= -90 && value <= 90)),
  longitude: z.string().optional().transform((value) => value ? Number(value) : null)
    .refine((value) => value === null || (Number.isFinite(value) && value >= -180 && value <= 180)),
});

const updateComplaintSchema = z.object({
  status: z.enum(["Pending Dispatch", "In Progress", "Resolved"]),
  feedback: z.string().trim().max(5000),
});

function mapComplaint(row) {
  return {
    id: row.id,
    complaintType: row.complaint_type,
    description: row.description,
    priority: row.priority,
    address: row.address,
    pinCode: row.pin_code,
    landmark: row.landmark,
    latitude: row.latitude,
    longitude: row.longitude,
    ward: row.ward,
    department: row.department,
    status: row.status,
    feedback: row.admin_feedback,
    submittedAt: row.created_at,
    attachments: row.attachments ?? [],
    assignmentId: row.assignment_id ?? null,
    assignedWorker: row.assigned_worker_id
      ? { id: row.assigned_worker_id, name: row.assigned_worker_name }
      : null,
    ...(row.reporter_name ? { reporterName: row.reporter_name, reporterEmail: row.reporter_email } : {}),
  };
}

function validate(schema, body) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const error = new Error(parsed.error.issues[0]?.message ?? "Invalid complaint data.");
    error.status = 400;
    throw error;
  }
  return parsed.data;
}

function hasExpectedFileSignature(file) {
  if (file.mimetype === "image/jpeg") {
    return file.buffer.length >= 3 &&
      file.buffer[0] === 0xff &&
      file.buffer[1] === 0xd8 &&
      file.buffer[2] === 0xff;
  }
  if (file.mimetype === "image/png") {
    return file.buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }
  return file.mimetype === "video/mp4" &&
    file.buffer.length >= 12 &&
    file.buffer.subarray(4, 8).toString("ascii") === "ftyp";
}

const departmentByType = {
  "Pothole / Road": "Roads & Public Works (PWD)",
  "Garbage / Waste": "Sanitation (SWM)",
  Garbage: "Sanitation (SWM)",
  Streetlight: "Electrical",
  "Drainage / Water": "Water Supply & Drainage",
  Drainage: "Water Supply & Drainage",
  "Water Supply": "Water Supply & Drainage",
};

const complaintColumns = `c.id, c.complaint_type, c.description, c.priority, c.address,
  c.pin_code, c.landmark, c.latitude, c.longitude, c.ward, c.department, c.status,
  c.admin_feedback, c.created_at`;

complaintsRouter.use(requireAuth);

complaintsRouter.get("/", async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "admin";
    const assignmentSelect = isAdmin
      ? `, active_assignment.id AS assignment_id,
         active_assignment.worker_id AS assigned_worker_id,
         active_assignment.worker_name AS assigned_worker_name`
      : "";
    const { rows } = await pool.query(
      `SELECT ${complaintColumns},
        (SELECT COALESCE(json_agg(json_build_object(
          'id', a.id, 'name', a.file_name, 'type', a.mime_type, 'size', a.file_size
        )), '[]'::json) FROM complaint_attachments a WHERE a.complaint_id = c.id) AS attachments
        ${assignmentSelect}
        ${isAdmin ? ", u.name AS reporter_name, u.email AS reporter_email" : ""}
       FROM complaints c
       ${isAdmin ? "JOIN users u ON u.id = c.user_id" : ""}
       ${isAdmin ? `LEFT JOIN LATERAL (
         SELECT a.id, a.worker_id, w.name AS worker_name
         FROM complaint_assignments a
         JOIN field_workers w ON w.id = a.worker_id
         WHERE a.complaint_id = c.id AND a.status = 'active'
         LIMIT 1
       ) active_assignment ON TRUE` : ""}
       ${isAdmin ? "" : "WHERE c.user_id = $1"}
       ORDER BY c.created_at DESC`,
      isAdmin ? [] : [req.user.id],
    );
    res.json({ complaints: rows.map(mapComplaint) });
  } catch (error) {
    next(error);
  }
});

complaintsRouter.post("/", upload.array("files", 5), async (req, res, next) => {
  let client;
  try {
    client = await pool.connect();
    const data = validate(createComplaintSchema, req.body);
    if ((req.files ?? []).some((file) => !hasExpectedFileSignature(file))) {
      const error = new Error("An evidence file does not match its declared JPG, PNG, or MP4 type.");
      error.status = 400;
      throw error;
    }
    const id = `NC-${new Date().getFullYear()}-${randomBytes(12).toString("hex").toUpperCase()}`;
    const department = departmentByType[data.complaintType] ?? "General Municipal Services";
    await client.query("BEGIN");
    const { rows: profileRows } = await client.query(
      `SELECT name, mobile_number, house_flat_number, street_locality,
        area_ward, city, state, profile_pin_code
       FROM users WHERE id = $1 FOR SHARE`,
      [req.user.id],
    );
    const profile = profileRows[0];
    const profileComplete = Boolean(
      profile?.name?.trim() &&
      /^(?:\+?91[\s-]?)?[6-9]\d{9}$/.test(profile.mobile_number?.trim() ?? "") &&
      profile.house_flat_number?.trim() &&
      profile.street_locality?.trim() &&
      profile.area_ward?.trim() &&
      profile.city?.trim() &&
      profile.state?.trim() &&
      /^\d{6}$/.test(profile.profile_pin_code?.trim() ?? ""),
    );
    if (!profileComplete) {
      const error = new Error("Complete your required profile details before submitting a complaint.");
      error.status = 403;
      throw error;
    }
    const { rows } = await client.query(
      `INSERT INTO complaints (
        id, user_id, complaint_type, description, priority, address, pin_code,
        landmark, latitude, longitude, ward, department
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING ${complaintColumns.replaceAll("c.", "")}`,
      [
        id, req.user.id, data.complaintType, data.description, data.priority,
        data.address, data.pinCode, data.landmark, data.latitude, data.longitude,
        data.ward, department,
      ],
    );
    const attachments = [];
    for (const file of req.files ?? []) {
      const attachmentResult = await client.query(
        `INSERT INTO complaint_attachments
          (complaint_id, file_name, mime_type, file_size, file_data)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING id`,
        [id, file.originalname, file.mimetype, file.size, file.buffer],
      );
      attachments.push({
        id: attachmentResult.rows[0].id,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
      });
    }
    await client.query("COMMIT");
    res.status(201).json({
      complaint: mapComplaint({
        ...rows[0],
        attachments,
      }),
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    next(error);
  } finally {
    client?.release();
  }
});

complaintsRouter.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const data = validate(updateComplaintSchema, req.body);
    const client = await pool.connect();
    let row;
    try {
      await client.query("BEGIN");
      const current = await client.query(
        "SELECT id, status FROM complaints WHERE id = $1 FOR UPDATE",
        [req.params.id],
      );
      if (!current.rows.length) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Complaint not found." });
        return;
      }
      const activeAssignment = await client.query(
        `SELECT id FROM complaint_assignments
         WHERE complaint_id = $1 AND status = 'active' FOR UPDATE`,
        [req.params.id],
      );
      if (data.status === "Pending Dispatch" && activeAssignment.rows.length) {
        const error = new Error("Release the active assignment before returning this complaint to dispatch.");
        error.status = 409;
        throw error;
      }
      const updated = await client.query(
        `UPDATE complaints
         SET status = $1, admin_feedback = $2, updated_at = NOW()
         WHERE id = $3
         RETURNING ${complaintColumns.replaceAll("c.", "")}`,
        [data.status, data.feedback, req.params.id],
      );
      if (data.status === "Resolved" && activeAssignment.rows.length) {
        await client.query(
          `UPDATE complaint_assignments
           SET status = 'completed', ended_by = $1, ended_at = NOW(), end_feedback = $2
           WHERE id = $3`,
          [req.user.id, data.feedback, activeAssignment.rows[0].id],
        );
      }
      row = updated.rows[0];
      await client.query(
        `INSERT INTO complaint_updates (complaint_id, admin_id, status, feedback)
         VALUES ($1, $2, $3, $4)`,
        [req.params.id, req.user.id, data.status, data.feedback],
      );
      const assigned = await client.query(
        `SELECT a.id AS assignment_id, w.id AS assigned_worker_id, w.name AS assigned_worker_name
         FROM complaint_assignments a
         JOIN field_workers w ON w.id = a.worker_id
         WHERE a.complaint_id = $1 AND a.status = 'active'`,
        [req.params.id],
      );
      if (assigned.rows[0]) Object.assign(row, assigned.rows[0]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    res.json({ complaint: mapComplaint(row) });
  } catch (error) {
    next(error);
  }
});

complaintsRouter.get("/:id/attachments/:attachmentId", async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "admin";
    const { rows } = await pool.query(
      `SELECT a.file_name, a.mime_type, a.file_data
       FROM complaint_attachments a
       JOIN complaints c ON c.id = a.complaint_id
       WHERE a.id = $1 AND c.id = $2 ${isAdmin ? "" : "AND c.user_id = $3"}`,
      isAdmin
        ? [req.params.attachmentId, req.params.id]
        : [req.params.attachmentId, req.params.id, req.user.id],
    );
    if (!rows.length) {
      res.status(404).json({ error: "Attachment not found." });
      return;
    }
    res.set("Content-Type", rows[0].mime_type);
    res.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(rows[0].file_name)}`);
    res.send(rows[0].file_data);
  } catch (error) {
    next(error);
  }
});
