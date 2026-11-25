import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export async function getAllWorkers(req: Request, res: Response) {
  try {
    const workers = await prisma.fieldWorker.findMany({
      include: {
        department: true,
        complaints: {
          where: {
            status: { in: ["Pending Dispatch", "In Progress"] },
          },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const formattedWorkers = workers.map((w) => {
      const activeComplaint = w.complaints[0];
      const hasActive = Boolean(activeComplaint);
      const isOffDuty = w.status.includes("Off-Duty");
      const shortId = activeComplaint ? `#${activeComplaint.id.split("-").pop()}` : "—";

      return {
        id: w.id,
        initials: w.initials,
        name: w.name,
        role: w.role,
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
        phone: w.phone,
        assignment: shortId,
        activeTicket: shortId,
        activeComplaintId: activeComplaint?.id || null,
        complaintId: activeComplaint?.id || "",
        metricLabel: w.role.includes("QC") ? "Audits Completed (30d)" : "Tickets Closed (30d)",
        metric: String(w.ticketsClosedMonth),
        resolution: `${w.avgResolutionHours} hrs`,
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

    res.json({ message: "Worker status updated", worker });
  } catch (error) {
    console.error("updateWorkerStatus error:", error);
    res.status(500).json({ error: "Failed to update worker status." });
  }
}

export async function createWorker(req: Request, res: Response) {
  try {
    const { name, role, departmentId, department, phone, status } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: "Worker name is required." });
      return;
    }

    const parts = name.trim().split(/\s+/);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : name.trim().slice(0, 2).toUpperCase();

    let resolvedDeptId = departmentId;
    if (!resolvedDeptId) {
      const deptStr = `${department || ""} ${role || ""}`.toLowerCase();
      if (deptStr.includes("road") || deptStr.includes("pwd") || deptStr.includes("pothole")) {
        resolvedDeptId = "pwd";
      } else if (deptStr.includes("electric") || deptStr.includes("street") || deptStr.includes("light")) {
        resolvedDeptId = "electrical";
      } else if (deptStr.includes("waste") || deptStr.includes("sanit") || deptStr.includes("swm") || deptStr.includes("garbage")) {
        resolvedDeptId = "swm";
      } else if (deptStr.includes("water") || deptStr.includes("drain") || deptStr.includes("storm")) {
        resolvedDeptId = "water";
      } else {
        resolvedDeptId = "pwd";
      }
    }

    const isOffDuty = status && status.includes("Off-Duty");
    const initialStatus = status || "Available Now";
    const dotColor = isOffDuty ? "#c4c6cf" : "#61b15f";

    const worker = await prisma.fieldWorker.create({
      data: {
        name: name.trim(),
        initials,
        role: role || "Field Technician",
        departmentId: resolvedDeptId,
        phone: phone || null,
        status: initialStatus,
        dotColor,
        ticketsClosedMonth: 0,
        avgResolutionHours: 12.0,
      },
      include: {
        department: true,
      },
    });

    res.status(201).json({ worker });
  } catch (error) {
    console.error("createWorker error:", error);
    res.status(500).json({ error: "Failed to create field worker." });
  }
}

export async function freeWorker(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Unassign complaints that were actively assigned to this worker
    await prisma.complaint.updateMany({
      where: {
        assignedWorkerId: id,
        status: "In Progress",
      },
      data: {
        status: "Pending Dispatch",
        assignedWorkerId: null,
      },
    });

    const worker = await prisma.fieldWorker.update({
      where: { id },
      data: {
        status: "Available Now",
        dotColor: "#61b15f",
      },
      include: { department: true },
    });

    res.json({ message: "Worker freed and set to Available", worker });
  } catch (error) {
    console.error("freeWorker error:", error);
    res.status(500).json({ error: "Failed to free worker." });
  }
}
