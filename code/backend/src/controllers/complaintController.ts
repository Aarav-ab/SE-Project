import { Response } from "express";
import { prisma } from "../config/prisma";
import { AuthRequest } from "../middlewares/auth";
import {
  getCached,
  setCached,
  invalidateAllOperationalCaches,
} from "../config/cache";
import {
  recommendDepartment,
  calculateSlaTargetDate,
  generateComplaintId,
} from "../services/routingService";

export async function createComplaint(req: AuthRequest, res: Response) {
  try {
    const {
      title,
      description,
      complaintType,
      priority,
      address,
      pinCode,
      landmark,
      latitude,
      longitude,
      wardId,
      departmentId,
    } = req.body;

    if (!description || !description.trim()) {
      res.status(400).json({ error: "Complaint description is required." });
      return;
    }

    const effectiveTitle =
      title ||
      `${complaintType || "Civic Grievance"} near ${landmark || address || "Ward 14"}`;

    // Smart routing recommendation if department not explicitly passed
    const recommendation = recommendDepartment(
      effectiveTitle,
      description,
      complaintType
    );

    const resolvedDeptId = departmentId || recommendation.departmentId;
    const resolvedPriority = priority || recommendation.priority;
    const resolvedType = complaintType || recommendation.category;

    // Get ward code for ID generation
    const resolvedWardId = wardId || "ward-14";
    const ward = await prisma.ward.findUnique({ where: { id: resolvedWardId } });
    const complaintId = generateComplaintId(ward?.code || "W14");

    const targetDate = calculateSlaTargetDate(resolvedPriority);

    const userId = req.user?.id || (await prisma.user.findFirst({ where: { role: "citizen" } }))?.id;

    // Create complaint record
    const newComplaint = await prisma.complaint.create({
      data: {
        id: complaintId,
        title: effectiveTitle,
        description: description.trim(),
        complaintType: resolvedType,
        priority: resolvedPriority,
        status: "Pending Dispatch",
        address: address || "Indiranagar, Bengaluru",
        pinCode: pinCode || "560038",
        landmark: landmark || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        wardId: resolvedWardId,
        departmentId: resolvedDeptId,
        userId: userId || null,
        targetCompletion: targetDate,
      },
    });

    // Handle uploaded file attachments if any
    const files = req.files as Express.Multer.File[] | undefined;
    if (files && files.length > 0) {
      await prisma.attachment.createMany({
        data: files.map((file) => ({
          complaintId: newComplaint.id,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: `/uploads/${file.filename}`,
        })),
      });
    }

    // Create initial timeline event
    await prisma.timelineEvent.create({
      data: {
        complaintId: newComplaint.id,
        title: "Complaint Registered",
        description: `Grievance registered under ${resolvedType}. Categorized and routed to ${recommendation.departmentName}.`,
        status: "Registered",
        author: req.user?.name || "Citizen Portal",
        step: 1,
      },
    });

    // Fetch full created complaint with relations
    const complaint = await prisma.complaint.findUnique({
      where: { id: newComplaint.id },
      include: {
        department: true,
        ward: true,
        attachments: true,
        timeline: true,
        assignedWorker: true,
      },
    });

    invalidateAllOperationalCaches();

    res.status(201).json({
      message: "Complaint registered successfully",
      complaint,
    });
  } catch (error) {
    console.error("createComplaint error:", error);
    res.status(500).json({ error: "Failed to submit grievance." });
  }
}

export async function getAllComplaints(req: AuthRequest, res: Response) {
  try {
    const { status, category, departmentId, wardId, search, citizenOnly } = req.query;
    const cacheKey = `complaints:list:${JSON.stringify({
      status: status || "",
      category: category || "",
      departmentId: departmentId || "",
      wardId: wardId || "",
      search: search || "",
      citizenOnly: citizenOnly || "",
      userId: citizenOnly === "true" && req.user ? req.user.id : "",
    })}`;

    const cached = getCached(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const where: any = {};

    if (status && status !== "All" && status !== "All Status") {
      where.status = String(status);
    }

    if (category && category !== "All") {
      where.complaintType = {
        contains: String(category),
      };
    }

    if (departmentId && departmentId !== "All") {
      where.departmentId = String(departmentId);
    }

    if (wardId) {
      where.wardId = String(wardId);
    }

    if (citizenOnly === "true" && req.user) {
      where.userId = req.user.id;
    }

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { id: { contains: q } },
        { title: { contains: q } },
        { description: { contains: q } },
        { address: { contains: q } },
        { landmark: { contains: q } },
      ];
    }

    const complaints = await prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        department: true,
        ward: true,
        assignedWorker: true,
        attachments: true,
        timeline: {
          orderBy: { createdAt: "asc" },
        },
        feedback: true,
      },
    });

    const payload = { complaints, total: complaints.length };
    setCached(cacheKey, payload);
    res.json(payload);
  } catch (error) {
    console.error("getAllComplaints error:", error);
    res.status(500).json({ error: "Failed to retrieve complaints." });
  }
}

export async function getComplaintById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const cacheKey = `complaints:detail:${id}`;
    const cached = getCached(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        department: true,
        ward: true,
        assignedWorker: true,
        attachments: true,
        timeline: {
          orderBy: { createdAt: "asc" },
        },
        feedback: true,
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!complaint) {
      res.status(404).json({ error: "Complaint not found." });
      return;
    }

    const payload = { complaint };
    setCached(cacheKey, payload);
    res.json(payload);
  } catch (error) {
    console.error("getComplaintById error:", error);
    res.status(500).json({ error: "Failed to retrieve complaint details." });
  }
}

export async function updateComplaintStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, comment, author } = req.body;

    if (!status) {
      res.status(400).json({ error: "Status field is required." });
      return;
    }

    const existing = await prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Complaint not found." });
      return;
    }

    const isResolved = status === "Resolved";
    const resolvedAt = isResolved ? new Date() : existing.resolvedAt;

    let step = 1;
    if (status === "Assigned") step = 2;
    else if (status === "In Progress") step = 3;
    else if (status === "Resolved" || status === "Closed") step = 4;

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status,
        resolvedAt,
      },
    });

    // Add timeline event
    await prisma.timelineEvent.create({
      data: {
        complaintId: id,
        title: isResolved ? "Resolution & Verification" : `Status updated to ${status}`,
        description: comment || `Status transitioned to ${status}.`,
        status,
        comment: comment || null,
        author: author || req.user?.name || "Municipal Officer",
        step,
      },
    });

    const fullUpdated = await prisma.complaint.findUnique({
      where: { id },
      include: {
        department: true,
        assignedWorker: true,
        timeline: { orderBy: { createdAt: "asc" } },
      },
    });

    invalidateAllOperationalCaches();

    res.json({
      message: `Complaint status updated to ${status}`,
      complaint: fullUpdated,
    });
  } catch (error) {
    console.error("updateComplaintStatus error:", error);
    res.status(500).json({ error: "Failed to update complaint status." });
  }
}

export async function assignComplaintWorker(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { workerId, workerName, comment } = req.body;

    const existing = await prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Complaint not found." });
      return;
    }

    let worker = null;
    if (workerId) {
      worker = await prisma.fieldWorker.findUnique({ where: { id: workerId } });
    } else if (workerName) {
      worker = await prisma.fieldWorker.findFirst({
        where: { name: { contains: workerName } },
      });
    }

    const assignedWorkerName = worker?.name || workerName || "Field Crew";

    if (worker) {
      await prisma.fieldWorker.update({
        where: { id: worker.id },
        data: {
          status: `On-Site: Ticket #${id.split("-").pop()}`,
          dotColor: "var(--amber)",
        },
      });
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        assignedWorkerId: worker?.id || null,
        status: existing.status === "Pending Dispatch" ? "Assigned" : existing.status,
      },
      include: {
        assignedWorker: true,
        department: true,
      },
    });

    // Record timeline assignment event
    await prisma.timelineEvent.create({
      data: {
        complaintId: id,
        title: "Field Crew Assigned",
        description: `Assigned to ${assignedWorkerName}.`,
        status: "Assigned",
        comment: comment || `Dispatch initiated for site inspection and resolution.`,
        author: req.user?.name || "Municipal Administrator",
        step: 2,
      },
    });

    invalidateAllOperationalCaches();

    res.json({
      message: `Assigned complaint ${id} to ${assignedWorkerName}`,
      complaint: updated,
    });
  } catch (error) {
    console.error("assignComplaintWorker error:", error);
    res.status(500).json({ error: "Failed to assign field crew." });
  }
}

export async function addComplaintFeedback(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { rating, comment, isResolvedSatisfied } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: "Rating between 1 and 5 is required." });
      return;
    }

    const existing = await prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Complaint not found." });
      return;
    }

    const feedback = await prisma.feedback.upsert({
      where: { complaintId: id },
      update: {
        rating,
        comment: comment || null,
        isResolvedSatisfied: isResolvedSatisfied ?? true,
      },
      create: {
        complaintId: id,
        rating,
        comment: comment || null,
        isResolvedSatisfied: isResolvedSatisfied ?? true,
      },
    });

    // Add timeline event
    await prisma.timelineEvent.create({
      data: {
        complaintId: id,
        title: "Citizen Feedback Received",
        description: `Citizen rated resolution ${rating}/5 stars.`,
        comment: comment || null,
        author: req.user?.name || "Citizen",
        step: 4,
      },
    });

    invalidateAllOperationalCaches();

    res.json({ message: "Feedback submitted successfully.", feedback });
  } catch (error) {
    console.error("addComplaintFeedback error:", error);
    res.status(500).json({ error: "Failed to submit feedback." });
  }
}

export async function deleteComplaint(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Complaint not found." });
      return;
    }

    // Delete cascading relations explicitly
    await prisma.feedback.deleteMany({ where: { complaintId: id } });
    await prisma.timelineEvent.deleteMany({ where: { complaintId: id } });
    await prisma.attachment.deleteMany({ where: { complaintId: id } });

    // Delete the complaint
    await prisma.complaint.delete({ where: { id } });

    invalidateAllOperationalCaches();

    res.json({ message: "Complaint successfully deleted.", id });
  } catch (error) {
    console.error("deleteComplaint error:", error);
    res.status(500).json({ error: "Failed to delete complaint." });
  }
}
