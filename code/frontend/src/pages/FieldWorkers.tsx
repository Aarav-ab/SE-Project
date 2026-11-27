import { useState, useEffect } from "react";
import {
  fetchFieldWorkers,
  createFieldWorker,
  freeFieldWorker,
  updateFieldWorkerStatus,
  assignComplaintWorker,
} from "../api";
import { useComplaint } from "../ComplaintContext";

type ComplaintToAssign = {
  id: string;
  title: string;
  location: string;
};

type FieldWorkersProps = {
  onBack: () => void;
  onSignOut: () => void;
  onViewComplaint: (id: string) => void;
  onDispatch: () => void;
  complaintToAssign: ComplaintToAssign | null;
  onAssignCrew: (complaintId: string, crewName: string) => void;
  onOpenAnalytics: () => void;
};

const initialWorkers = [
  {
    initials: "MK",
    name: "Er. Manoj Kumar",
    role: "Junior Engineer • Roads & PWD",
    status: "On-Site: Asphalt Patching",
    color: "var(--navy)",
    dot: "var(--amber)",
    assignment: "#GRV-8902",
    metricLabel: "Tickets Closed (30d)",
    metric: "14",
    resolution: "22 hrs",
    action: "View Active Ticket →",
    complaintId: "GRV-2025-W14-8902",
    type: "ticket",
  },
  {
    initials: "SR",
    name: "Suresh Rao",
    role: "Electrician • Streetlighting",
    status: "On-Site: Lamp Replacement",
    color: "var(--amber)",
    dot: "var(--amber)",
    assignment: "#GRV-8712",
    metricLabel: "Tickets Closed (30d)",
    metric: "19",
    resolution: "9 hrs",
    action: "View Active Ticket →",
    complaintId: "GRV-2025-W14-8712",
    type: "ticket",
  },
  {
    initials: "KR",
    name: "K. Ramesh",
    role: "Sanitary Inspector • SWM Unit 3",
    status: "Available Now",
    color: "#61b15f",
    dot: "#61b15f",
    assignment: "—",
    metricLabel: "Tickets Closed (30d)",
    metric: "27",
    resolution: "5 hrs",
    action: "Dispatch to Ticket →",
    complaintId: "",
    type: "dispatch",
  },
  {
    initials: "AV",
    name: "Anita Verma",
    role: "Zonal QC Inspector",
    status: "On-Site: Drain Audit",
    color: "var(--red)",
    dot: "var(--amber)",
    assignment: "#GRV-9140",
    metricLabel: "Audits Completed (30d)",
    metric: "31",
    resolution: "2 hrs",
    action: "View Active Ticket →",
    complaintId: "GRV-2025-W14-9140",
    type: "ticket",
  },
  {
    initials: "DP",
    name: "Deepak Prasad",
    role: "Compactor Driver • SWM Unit 1",
    status: "Off-Duty (Rotation)",
    color: "var(--text-muted)",
    dot: "#c4c6cf",
    assignment: "—",
    metricLabel: "Tickets Closed (30d)",
    metric: "22",
    resolution: "4 hrs",
    action: "Back on duty tomorrow",
    complaintId: "",
    type: "off-duty",
  },
  {
    initials: "NP",
    name: "Nisha Pillai",
    role: "Junior Engineer • Roads & PWD",
    status: "Available Now",
    color: "#61b15f",
    dot: "#61b15f",
    assignment: "—",
    metricLabel: "Tickets Closed (30d)",
    metric: "16",
    resolution: "26 hrs",
    action: "Dispatch to Ticket →",
    complaintId: "",
    type: "dispatch",
  },
];

function FieldWorkers({
  onBack,
  onSignOut,
  onViewComplaint,
  complaintToAssign,
  onAssignCrew,
  onOpenAnalytics,
}: FieldWorkersProps) {
  const [search, setSearch] = useState("");
  const [workers, setWorkers] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("nc_workers_cache");
      return saved ? JSON.parse(saved) : initialWorkers;
    } catch {
      return initialWorkers;
    }
  });

  const { submittedComplaints, refreshComplaints } = useComplaint();
  const [isAddWorkerModalOpen, setIsAddWorkerModalOpen] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState("");
  const [newWorkerRole, setNewWorkerRole] = useState("");
  const [newWorkerDept, setNewWorkerDept] = useState("Roads & Public Works (PWD)");
  const [newWorkerPhone, setNewWorkerPhone] = useState("");
  const [newWorkerStatus, setNewWorkerStatus] = useState("Available Now");

  const [workerToAssign, setWorkerToAssign] = useState<any | null>(null);
  const [selectedGrievanceId, setSelectedGrievanceId] = useState("");
  const [customTicketInput, setCustomTicketInput] = useState("");

  useEffect(() => {
    fetchFieldWorkers().then((apiWorkers) => {
      if (apiWorkers && apiWorkers.length > 0) {
        setWorkers(apiWorkers);
        localStorage.setItem("nc_workers_cache", JSON.stringify(apiWorkers));
      }
    });
  }, []);

  const availableComplaints = submittedComplaints.filter(
    (c) => c.status !== "Resolved" && c.status !== "Closed" && !c.resolved
  );

  async function handleFreeWorker(worker: any) {
    if (worker.id) {
      await freeFieldWorker(worker.id);
    }
    const targetComplaintId = worker.activeComplaintId || worker.complaintId;
    if (targetComplaintId) {
      try {
        const raw = localStorage.getItem("nc_crew_assignments");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed[targetComplaintId]) {
            delete parsed[targetComplaintId];
            localStorage.setItem("nc_crew_assignments", JSON.stringify(parsed));
          }
        }
      } catch {
        // Ignore localStorage parse errors
      }
    }
    const updated = workers.map((w) => {
      if (w.name === worker.name || (w.id && w.id === worker.id)) {
        return {
          ...w,
          status: "Available Now",
          dot: "#61b15f",
          dotColor: "#61b15f",
          assignment: "—",
          activeTicket: "—",
          action: "Dispatch to Ticket →",
          type: "dispatch",
          complaintId: "",
          activeComplaintId: null,
          metric: String(Number(w.metric || 0) + 1),
        };
      }
      return w;
    });
    setWorkers(updated);
    localStorage.setItem("nc_workers_cache", JSON.stringify(updated));
    await refreshComplaints();
  }

  async function handleToggleDuty(worker: any, targetStatus: string) {
    const isOffDuty = targetStatus.includes("Off-Duty");
    const dotColor = isOffDuty ? "#c4c6cf" : "#61b15f";

    if (worker.id) {
      await updateFieldWorkerStatus(worker.id, targetStatus, dotColor);
    }

    const updated = workers.map((w) => {
      if (w.name === worker.name || (w.id && w.id === worker.id)) {
        return {
          ...w,
          status: targetStatus,
          dot: dotColor,
          dotColor,
          assignment: isOffDuty ? "—" : w.assignment,
          action: isOffDuty ? "Back on duty tomorrow" : "Dispatch to Ticket →",
          type: isOffDuty ? "off-duty" : "dispatch",
        };
      }
      return w;
    });
    setWorkers(updated);
    localStorage.setItem("nc_workers_cache", JSON.stringify(updated));
  }

  function handleStartAssign(worker: any) {
    if (complaintToAssign) {
      const assignedTicket = `#${complaintToAssign.id.split("-").pop()}`;
      const updatedWorkers = workers.map((w) =>
        w.name === worker.name || (w.id && w.id === worker.id)
          ? {
              ...w,
              status: `On-Site: Ticket ${assignedTicket}`,
              dot: "var(--amber)",
              dotColor: "var(--amber)",
              assignment: assignedTicket,
              activeTicket: assignedTicket,
              action: "View Active Ticket →",
              type: "ticket",
              complaintId: complaintToAssign.id,
              activeComplaintId: complaintToAssign.id,
            }
          : w
      );
      setWorkers(updatedWorkers);
      localStorage.setItem("nc_workers_cache", JSON.stringify(updatedWorkers));

      onAssignCrew(complaintToAssign.id, worker.name);
      onBack();
    } else {
      setWorkerToAssign(worker);
      setSelectedGrievanceId(availableComplaints[0]?.id || "");
      setCustomTicketInput("");
    }
  }

  async function handleConfirmAssignWorkload() {
    if (!workerToAssign) return;

    let ticketDisplay = "";
    let complaintId = "";

    if (selectedGrievanceId) {
      complaintId = selectedGrievanceId;
      ticketDisplay = `#${selectedGrievanceId.split("-").pop()}`;
      onAssignCrew(selectedGrievanceId, workerToAssign.name);
      await assignComplaintWorker(selectedGrievanceId, workerToAssign.name);
      await refreshComplaints();
    } else if (customTicketInput.trim()) {
      ticketDisplay = customTicketInput.trim().startsWith("#")
        ? customTicketInput.trim()
        : `#${customTicketInput.trim()}`;
    }

    if (!ticketDisplay) return;

    if (workerToAssign.id) {
      await updateFieldWorkerStatus(
        workerToAssign.id,
        `On-Site: Ticket ${ticketDisplay}`,
        "var(--amber)"
      );
    }

    const updated = workers.map((w) => {
      if (w.name === workerToAssign.name || (w.id && w.id === workerToAssign.id)) {
        return {
          ...w,
          status: `On-Site: Ticket ${ticketDisplay}`,
          dot: "var(--amber)",
          dotColor: "var(--amber)",
          assignment: ticketDisplay,
          activeTicket: ticketDisplay,
          action: "View Active Ticket →",
          type: "ticket",
          complaintId,
          activeComplaintId: complaintId,
        };
      }
      return w;
    });

    setWorkers(updated);
    localStorage.setItem("nc_workers_cache", JSON.stringify(updated));
    setWorkerToAssign(null);
  }

  async function handleCreateWorker(e: React.FormEvent) {
    e.preventDefault();
    if (!newWorkerName.trim()) return;

    const parts = newWorkerName.trim().split(/\s+/);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : newWorkerName.trim().slice(0, 2).toUpperCase();

    const roleLower = newWorkerRole.toLowerCase();
    const color = roleLower.includes("road")
      ? "var(--navy)"
      : roleLower.includes("electric") || roleLower.includes("street")
      ? "var(--amber)"
      : roleLower.includes("qc")
      ? "var(--red)"
      : "#61b15f";

    const isOffDuty = newWorkerStatus.includes("Off-Duty");
    const dot = isOffDuty ? "#c4c6cf" : "#61b15f";

    const workerPayload = {
      name: newWorkerName.trim(),
      role: newWorkerRole.trim() || "Field Technician",
      department: newWorkerDept,
      phone: newWorkerPhone.trim(),
      status: newWorkerStatus,
    };

    let createdId = "";
    try {
      const res = await createFieldWorker(workerPayload);
      if (res?.id) createdId = res.id;
    } catch (err) {
      console.warn("Backend worker creation fallback:", err);
    }

    const newWorker = {
      id: createdId || `worker-${Date.now()}`,
      initials,
      name: newWorkerName.trim(),
      role: newWorkerRole.trim() || "Field Technician",
      department: newWorkerDept,
      status: newWorkerStatus,
      color,
      dot,
      dotColor: dot,
      phone: newWorkerPhone.trim(),
      assignment: "—",
      activeTicket: "—",
      metricLabel: "Tickets Closed (30d)",
      metric: "0",
      resolution: "12 hrs",
      action: isOffDuty ? "Back on duty tomorrow" : "Dispatch to Ticket →",
      type: isOffDuty ? "off-duty" : "dispatch",
    };

    const updated = [newWorker, ...workers];
    setWorkers(updated);
    localStorage.setItem("nc_workers_cache", JSON.stringify(updated));
    setIsAddWorkerModalOpen(false);
    setNewWorkerName("");
    setNewWorkerRole("");
    setNewWorkerPhone("");
    setNewWorkerStatus("Available Now");
  }

  const totalStaff = workers.length;
  const onSiteStaff = workers.filter(
    (w) => w.status.includes("On-Site") || (w.assignment && w.assignment !== "—")
  ).length;
  const availableStaff = workers.filter((w) =>
    w.status.includes("Available")
  ).length;
  const offDutyStaff = workers.filter(
    (w) => w.status.includes("Off-Duty") || w.status.includes("Leave")
  ).length;

  const filteredWorkers = workers.filter((worker) =>
    `${worker.name} ${worker.role} ${worker.status} ${worker.assignment}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="admin-wrap">
      <aside className="admin-sidebar">
        <div>
          <div className="brand">
            <div className="brand-mark" style={{ width: 32, height: 32 }}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 21h18M4 21V8l8-5 8 5v13" />
              </svg>
            </div>
            <div>
              <div className="brand-name" style={{ fontSize: 18 }}>
                NagrikConnect
              </div>
              <div
                className="small text-muted"
                style={{ fontWeight: 700, letterSpacing: ".5px" }}
              >
                ADMINISTRATION CORE
              </div>
            </div>
          </div>

          <div className="admin-ward-pill">
            <span className="flex gap-1 items-center">
              <span className="dot" style={{ background: "#61b15f" }} />
              Ward 14 • Indiranagar
            </span>
            <span className="text-muted">Active</span>
          </div>

          <nav className="admin-nav">
            <button type="button" onClick={onBack}>
              All Complaints
            </button>
            <button type="button" className="active">
              Field Workers &amp; Crews
            </button>
            <button type="button" onClick={onOpenAnalytics}>
              Department Analytics
            </button>
          </nav>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="flex gap-3 items-center">
            <strong style={{ color: "var(--navy)", fontSize: 18 }}>
              NagrikConnect Administration Core
            </strong>
            <span className="pill" style={{ background: "var(--blue-200)" }}>
              <span className="dot" style={{ background: "#61b15f" }} />
              Ward 14 • Indiranagar
            </span>
          </div>

          <div className="flex gap-3 items-center">
            <div className="admin-search">
              🔍
              <input
                type="search"
                placeholder="Search crew, worker..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="user-chip">
              <div className="user-avatar">RS</div>
              <div>
                <div className="user-name">Rajesh Sharma</div>
                <div className="user-role">Officer Gr. I</div>
              </div>
            </div>

            <button className="btn-signout" onClick={onSignOut}>
              Sign Out
            </button>
          </div>
        </header>

        <section className="admin-body">
          <div
            className="flex justify-between items-center"
            style={{ flexWrap: "wrap", gap: 16, marginBottom: 24 }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: 24, color: "var(--navy)" }}>
                Field Workers &amp; Crews
              </h1>

              <p className="small text-body mt-1">
                Monitor crew availability, current dispatch, and workload across
                Ward 14
              </p>
            </div>

            {/* Selected complaint to assign */}
            {complaintToAssign && (
              <div
                className="card card-pad"
                style={{
                  marginBottom: 24,
                  borderLeft: "4px solid var(--amber)",
                }}
              >
                <h3 style={{ marginTop: 0 }}>Assign Crew to Complaint</h3>
                <strong>{complaintToAssign.title}</strong>
                <p className="small text-muted">
                  #{complaintToAssign.id} · {complaintToAssign.location}
                </p>
                <p className="small text-body">
                  Choose an available crew below and click “Dispatch to Ticket”.
                </p>
              </div>
            )}

            <button
              type="button"
              className="btn btn-navy"
              onClick={() => setIsAddWorkerModalOpen(true)}
            >
              + Add New Crew Member
            </button>
          </div>

          <div className="kpi-row">
            <div className="kpi-card">
              <div>
                <span className="kpi-label">Total Field Staff</span>
                <div className="kpi-val" style={{ color: "var(--navy)" }}>
                  {totalStaff}
                </div>
                <p className="small mt-1" style={{ fontWeight: 600 }}>
                  Across municipal units
                </p>
              </div>
              <div
                className="kpi-icon"
                style={{ background: "var(--blue-200)" }}
              >
                👷
              </div>
            </div>

            <div className="kpi-card">
              <div>
                <span className="kpi-label">On-Site Now</span>
                <div className="kpi-val" style={{ color: "var(--amber)" }}>
                  {onSiteStaff}
                </div>
                <p className="small mt-1" style={{ fontWeight: 600 }}>
                  Actively deployed
                </p>
              </div>
              <div
                className="kpi-icon"
                style={{ background: "var(--amber-bg)" }}
              >
                🚧
              </div>
            </div>

            <div className="kpi-card">
              <div>
                <span className="kpi-label">Available / On Standby</span>
                <div className="kpi-val" style={{ color: "#61b15f" }}>
                  {availableStaff}
                </div>
                <p className="small mt-1" style={{ fontWeight: 600 }}>
                  Ready for dispatch
                </p>
              </div>
              <div
                className="kpi-icon"
                style={{ background: "var(--green-bg)" }}
              >
                ✅
              </div>
            </div>

            <div className="kpi-card">
              <div>
                <span className="kpi-label">On Leave / Off-Duty</span>
                <div className="kpi-val" style={{ color: "var(--text-muted)" }}>
                  {offDutyStaff}
                </div>
                <p className="small mt-1" style={{ fontWeight: 600 }}>
                  Scheduled rotation
                </p>
              </div>
              <div
                className="kpi-icon"
                style={{ background: "var(--blue-50)" }}
              >
                🛌
              </div>
            </div>
          </div>

          <div className="crew-grid">
            {filteredWorkers.map((worker) => (
              <article className="crew-card" key={worker.id || worker.name}>
                <div className="crew-top">
                  <div
                    className="crew-avatar"
                    style={{ background: worker.color }}
                  >
                    {worker.initials}
                  </div>
                  <div>
                    <strong>{worker.name}</strong>
                    <div className="small text-body">{worker.role}</div>
                    <span
                      className="small mt-1"
                      style={{ display: "inline-block" }}
                    >
                      <span
                        className="avail-dot"
                        style={{ background: worker.dot }}
                      />
                      {worker.status}
                    </span>
                  </div>
                </div>

                <div className="crew-stat-row">
                  <span className="text-body">Active Assignment</span>
                  <strong>{worker.assignment}</strong>
                </div>
                <div className="crew-stat-row">
                  <span className="text-body">{worker.metricLabel}</span>
                  <strong>{worker.metric}</strong>
                </div>
                <div className="crew-stat-row">
                  <span className="text-body">Avg. Resolution</span>
                  <strong>{worker.resolution}</strong>
                </div>

                {worker.status.includes("On-Site") ||
                (worker.assignment && worker.assignment !== "—") ? (
                  <div className="flex gap-2 mt-3" style={{ width: "100%" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, padding: "8px 10px", fontSize: 12 }}
                      onClick={() => {
                        if (worker.complaintId) {
                          onViewComplaint(worker.complaintId);
                        } else {
                          alert(`Active ticket: ${worker.assignment}`);
                        }
                      }}
                    >
                      View Ticket →
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        flex: 1,
                        padding: "8px 10px",
                        fontSize: 12,
                        background: "rgba(97, 177, 95, 0.15)",
                        color: "#2e7d32",
                        border: "1px solid #61b15f",
                        fontWeight: 700,
                      }}
                      title="Free this crew member and mark Available"
                      onClick={() => handleFreeWorker(worker)}
                    >
                      ✓ Free Member
                    </button>
                  </div>
                ) : worker.status.includes("Off-Duty") ||
                  worker.status.includes("Leave") ? (
                  <div className="mt-3" style={{ width: "100%" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm btn-block"
                      style={{ padding: "8px 10px", fontSize: 12 }}
                      onClick={() => handleToggleDuty(worker, "Available Now")}
                    >
                      Put On-Duty (Available)
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-3" style={{ width: "100%" }}>
                    <button
                      type="button"
                      className="btn btn-navy btn-sm"
                      style={{ flex: 2, padding: "8px 10px", fontSize: 12 }}
                      onClick={() => handleStartAssign(worker)}
                    >
                      + Assign Workload
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, padding: "8px 8px", fontSize: 12 }}
                      title="Mark Off-Duty"
                      onClick={() =>
                        handleToggleDuty(worker, "Off-Duty (Rotation)")
                      }
                    >
                      Off-Duty
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>

          {/* Add New Crew Member Modal */}
          {isAddWorkerModalOpen && (
            <div
              className="confirmation-overlay"
              role="presentation"
              onClick={() => setIsAddWorkerModalOpen(false)}
            >
              <div
                className="confirmation-modal"
                role="dialog"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: 500, padding: 28 }}
              >
                <div
                  className="flex justify-between items-center"
                  style={{ marginBottom: 16 }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: 22,
                        margin: 0,
                        color: "var(--navy)",
                      }}
                    >
                      + Add New Crew Member
                    </h2>
                    <p className="small text-body" style={{ margin: "4px 0 0" }}>
                      Register new department field personnel
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsAddWorkerModalOpen(false)}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateWorker}>
                  <div style={{ marginBottom: 14 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar, Sunita Rao"
                      value={newWorkerName}
                      onChange={(e) => setNewWorkerName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      Role &amp; Designation *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Junior Engineer • Roads & PWD, Lineman"
                      value={newWorkerRole}
                      onChange={(e) => setNewWorkerRole(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      Department *
                    </label>
                    <select
                      value={newWorkerDept}
                      onChange={(e) => setNewWorkerDept(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "#fff",
                      }}
                    >
                      <option value="Roads & Public Works (PWD)">
                        Roads &amp; Public Works (PWD)
                      </option>
                      <option value="Electrical & Streetlighting">
                        Electrical &amp; Streetlighting
                      </option>
                      <option value="Sanitation (SWM)">
                        Sanitation (SWM)
                      </option>
                      <option value="Water Supply & Drainage">
                        Water Supply &amp; Drainage
                      </option>
                    </select>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 00000"
                      value={newWorkerPhone}
                      onChange={(e) => setNewWorkerPhone(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      Initial Availability
                    </label>
                    <select
                      value={newWorkerStatus}
                      onChange={(e) => setNewWorkerStatus(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "#fff",
                      }}
                    >
                      <option value="Available Now">
                        Available Now (Ready for Dispatch)
                      </option>
                      <option value="Off-Duty (Rotation)">
                        Off-Duty (Rotation)
                      </option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setIsAddWorkerModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-navy">
                      Add Crew Member →
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Assign Workload Modal */}
          {workerToAssign && (
            <div
              className="confirmation-overlay"
              role="presentation"
              onClick={() => setWorkerToAssign(null)}
            >
              <div
                className="confirmation-modal"
                role="dialog"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: 560, padding: 28 }}
              >
                <div
                  className="flex justify-between items-center"
                  style={{ marginBottom: 16 }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: 22,
                        margin: 0,
                        color: "var(--navy)",
                      }}
                    >
                      Assign Workload
                    </h2>
                    <p className="small text-body" style={{ margin: "4px 0 0" }}>
                      Assign task to{" "}
                      <strong>{workerToAssign.name}</strong> ({workerToAssign.role})
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setWorkerToAssign(null)}
                  >
                    ✕
                  </button>
                </div>

                <div
                  style={{
                    maxHeight: 280,
                    overflowY: "auto",
                    margin: "16px 0",
                  }}
                >
                  <label
                    style={{
                      fontWeight: 700,
                      fontSize: 12,
                      display: "block",
                      marginBottom: 8,
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                    }}
                  >
                    SELECT ACTIVE COMPLAINT TO DISPATCH:
                  </label>
                  {availableComplaints.length === 0 ? (
                    <p className="small text-muted">
                      No open complaints awaiting assignment. You can enter a custom task below.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {availableComplaints.map((c) => {
                        const isSelected = selectedGrievanceId === c.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedGrievanceId(c.id);
                              setCustomTicketInput("");
                            }}
                            style={{
                              padding: "10px 14px",
                              borderRadius: 8,
                              border: isSelected
                                ? "2px solid var(--navy)"
                                : "1px solid var(--border)",
                              background: isSelected
                                ? "var(--blue-50)"
                                : "#fff",
                              cursor: "pointer",
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <strong
                                style={{ fontSize: 13, color: "var(--navy)" }}
                              >
                                #{c.id}
                              </strong>
                              <span
                                className="small text-body"
                                style={{ fontWeight: 600 }}
                              >
                                {c.priority}
                              </span>
                            </div>
                            <p
                              className="small text-body"
                              style={{ margin: "4px 0 2px" }}
                            >
                              {c.description || (c as any).title}
                            </p>
                            <span className="small text-muted">
                              📍 {c.address || c.ward}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 12 }}>
                  <label
                    style={{
                      fontWeight: 700,
                      fontSize: 12,
                      display: "block",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                    }}
                  >
                    OR ENTER CUSTOM TICKET / TASK REFERENCE:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. #GRV-W14-8890 or Site Inspection"
                    value={customTicketInput}
                    onChange={(e) => {
                      setCustomTicketInput(e.target.value);
                      if (e.target.value) setSelectedGrievanceId("");
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                    }}
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setWorkerToAssign(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-navy"
                    disabled={
                      !selectedGrievanceId && !customTicketInput.trim()
                    }
                    onClick={handleConfirmAssignWorkload}
                  >
                    Confirm Dispatch →
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <footer className="site-footer">
          <div className="container">
            <div className="footer-col">
              <div className="footer-brand">
                <div className="footer-mark">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 21h18M4 21V8l8-5 8 5v13" />
                  </svg>
                </div>
                <span className="footer-name">NagrikConnect</span>
              </div>
              <p className="footer-desc">
                Smart City Civic Redressal Infrastructure
              </p>
            </div>
            <div className="footer-help">
              <h4>Emergency Helplines</h4>
              <p>
                112 – National Emergency • 101 – Fire • 1916 – Water Supply
                (24/7)
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default FieldWorkers;
