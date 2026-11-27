import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { invalidateAllOperationalCaches } from "../config/cache";

function resolveDepartmentId(departmentId?: string, department?: string, role?: string): string {
  if (departmentId) return departmentId;
  const deptStr = `${department || ""} ${role || ""}`.toLowerCase();
  if (deptStr.includes("road") || deptStr.includes("pwd") || deptStr.includes("pothole")) {
    return "pwd";
  }
  if (deptStr.includes("electric") || deptStr.includes("street") || deptStr.includes("light")) {
    return "electrical";
  }
  if (deptStr.includes("waste") || deptStr.includes("sanit") || deptStr.includes("swm") || deptStr.includes("garbage")) {
    return "swm";
  }
  if (deptStr.includes("water") || deptStr.includes("drain") || deptStr.includes("storm")) {
    return "water";
  }
  return "pwd";
}

export async function getAllWorkers(_req: Request, res: Response) {
  try {
    const workers = await prisma.fieldWorker.findMany({
      include: {
        department: true,
        complaints: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            resolvedAt: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const formattedWorkers = workers.map((w) => {
      const activeComplaints = w.complaints.filter((c) =>
        ["Pending Dispatch", "Assigned", "In Progress"].includes(c.status)
      );
      const resolvedCount = w.complaints.filter(
        (c) => c.status === "Resolved" || c.status === "Closed"
      ).length;

      const activeComplaint = activeComplaints[0];
      const hasActive = Boolean(activeComplaint);
      const isOffDuty = w.status.includes("Off-Duty");
      const shortId = activeComplaint ? `#${activeComplaint.id.split("-").pop()}` : "—";

      return {
        id: w.id,
        initials: w.initials,
        name: w.name,
        role: w.role,
        departmentId: w.departmentId,
        department: w.department.name,
        departmentCode: w.department.code,
        status: hasActive ? `On-Site: Ticket ${shortId}` : w.status,
        color: w.role.includes("Roads")
          ? "var(--navy)"
          : w.role.includes("Electrical")
          ? "var(--amber)"
          : w.role.includes("QC")
          ? "var(--red)"
          : "#61b15f",
        dotColor: hasActive ? "var(--amber)" : w.dotColor,
        dot: hasActive ? "var(--amber)" : w.dotColor,
        phone: w.phone || null,
        assignment: shortId,
        activeTicket: shortId,
        activeComplaintId: activeComplaint?.id || null,
        complaintId: activeComplaint?.id || "",
        metricLabel: w.role.includes("QC")
          ? "Audits Completed"
          : "Tickets Closed / Resolved",
        metric: String(resolvedCount),
        ticketsClosedMonth: resolvedCount,
        action: hasActive
          ? "View Active Ticket →"
          : isOffDuty
          ? "Back on duty tomorrow"
          : "Dispatch to Ticket →",
        type: hasActive ? "ticket" : isOffDuty ? "off-duty" : "dispatch",
      };
    });

    res.json({ workers: formattedWorkers });
  } catch (error) {
    console.error("getAllWorkers error:", error);
    res.status(500).json({ error: "Failed to retrieve field workers." });
  }
}

export async function updateWorkerStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, dotColor } = req.body;

    const worker = await prisma.fieldWorker.update({
      where: { id },
      data: {
        status: status || undefined,
        dotColor: dotColor || undefined,
      },
    });

    invalidateAllOperationalCaches();
    res.json({ message: "Worker status updated", worker });
  } catch (error) {
    console.error("updateWorkerStatus error:", error);
    res.status(500).json({ error: "Failed to update worker status." });
  }
}

export async function updateWorker(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, role, departmentId, department, phone } = req.body;

    if (name !== undefined && !String(name).trim()) {
      res.status(400).json({ error: "Worker name cannot be empty." });
      return;
    }

    const cleanPhone = phone !== undefined ? String(phone).trim() : undefined;
    if (cleanPhone && cleanPhone.replace(/\D/g, "").length < 10) {
      res.status(400).json({ error: "Contact number must have at least 10 digits." });
      return;
    }

    const existing = await prisma.fieldWorker.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Field worker not found." });
      return;
    }

    const updatedName = name !== undefined ? String(name).trim() : existing.name;
    const parts = updatedName.split(/\s+/);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : updatedName.slice(0, 2).toUpperCase();

    const resolvedDeptId =
      departmentId || department
        ? resolveDepartmentId(departmentId, department, role || existing.role)
        : undefined;

    const worker = await prisma.fieldWorker.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: updatedName, initials } : {}),
        ...(role !== undefined ? { role: String(role).trim() || existing.role } : {}),
        ...(resolvedDeptId ? { departmentId: resolvedDeptId } : {}),
        ...(cleanPhone !== undefined ? { phone: cleanPhone || null } : {}),
      },
      include: { department: true },
    });

    invalidateAllOperationalCaches();
    res.json({ message: "Staff member details updated", worker });
  } catch (error) {
    console.error("updateWorker error:", error);
    res.status(500).json({ error: "Failed to update staff member details." });
  }
}

export async function createWorker(req: Request, res: Response) {
  try {
    const { name, role, departmentId, department, phone, status } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: "Worker name is required." });
      return;
    }

    const cleanPhone = phone ? String(phone).trim() : "";
    if (cleanPhone && cleanPhone.replace(/\D/g, "").length < 10) {
      res.status(400).json({ error: "Contact number must have at least 10 digits." });
      return;
    }

    const parts = name.trim().split(/\s+/);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : name.trim().slice(0, 2).toUpperCase();

    const resolvedDeptId = resolveDepartmentId(departmentId, department, role);

    const isOffDuty = status && status.includes("Off-Duty");
    const initialStatus = status || "Available Now";
    const dotColor = isOffDuty ? "#c4c6cf" : "#61b15f";

    const worker = await prisma.fieldWorker.create({
      data: {
        name: name.trim(),
        initials,
        role: role || "Field Technician",
        departmentId: resolvedDeptId,
        phone: cleanPhone || null,
        status: initialStatus,
        dotColor,
        ticketsClosedMonth: 0,
        avgResolutionHours: 12.0,
      },
      include: {
        department: true,
      },
    });

    invalidateAllOperationalCaches();
    res.status(201).json({ worker });
  } catch (error) {
    console.error("createWorker error:", error);
    res.status(500).json({ error: "Failed to create field worker." });
  }
}

export async function freeWorker(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Unassign any non-resolved complaints currently assigned to this worker
    const activeAssigned = await prisma.complaint.findMany({
      where: {
        assignedWorkerId: id,
        status: { notIn: ["Resolved", "Closed"] },
      },
      select: { id: true },
    });

    const affectedIds = activeAssigned.map((c) => c.id);
    if (affectedIds.length > 0) {
      await prisma.complaint.updateMany({
        where: { id: { in: affectedIds } },
        data: {
          status: "Pending Dispatch",
          assignedWorkerId: null,
        },
      });

      // Remove stale assignment/progress timeline entries so Pending Dispatch stays at step 1
      await prisma.timelineEvent.deleteMany({
        where: {
          complaintId: { in: affectedIds },
          step: { gte: 2 },
        },
      });
    }

    const worker = await prisma.fieldWorker.update({
      where: { id },
      data: {
        status: "Available Now",
        dotColor: "#61b15f",
      },
      include: { department: true },
    });

    invalidateAllOperationalCaches();
    res.json({
      message: "Worker freed and set to Available",
      worker,
      unassignedComplaintIds: affectedIds,
    });
  } catch (error) {
    console.error("freeWorker error:", error);
    res.status(500).json({ error: "Failed to free worker." });
  }
}
