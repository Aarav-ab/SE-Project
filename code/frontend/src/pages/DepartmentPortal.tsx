import DepartmentComplaintModal from "./DepartmentComplaintModal";
import { useState, useEffect } from "react";
import { useComplaint } from "../ComplaintContext";
import { getCurrentUser, updateComplaintStatus, fetchAnalytics } from "../api";

const PAGE_SIZE = 7;

type DepartmentPortalProps = {
  onSignOut: () => void;
  onOpenFieldWorkers: () => void;
  onOpenAnalytics: () => void;
  onAssignComplaint: (complaint: {
    id: string;
    title: string;
    location: string;
  }) => void;
  crewAssignments: Record<string, string>;
  onUpdateCrewAssignment: (complaintId: string, crewName: string) => void;
};

type DepartmentComplaintItem = {
  id: string;
  category: string;
  age: string;
  title: string;
  location: string;
  assigned: string;
  status: string;
  icon: string;
  iconBg: string;
  tagStyle: { background: string; color: string };
};

function DepartmentPortal({
  onSignOut,
  onOpenFieldWorkers,
  onOpenAnalytics,
  onAssignComplaint,
  crewAssignments,
}: DepartmentPortalProps) {
  const currentUser = getCurrentUser();
  const adminName = currentUser?.name || "Anita Rao (Admin)";
  const adminInitials =
    adminName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AR";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [avgResolutionDisplay, setAvgResolutionDisplay] = useState("—");
  const [selectedComplaint, setSelectedComplaint] =
    useState<DepartmentComplaintItem | null>(null);
  const { areaComplaints, refreshComplaints } = useComplaint();

  const adminWardLabel = currentUser?.city
    ? `${currentUser.city} • Municipal Core`
    : "All Wards • Municipal Core";

  useEffect(() => {
    let mounted = true;
    fetchAnalytics("all").then((data) => {
      if (mounted && data?.summary?.avgResolutionHours) {
        setAvgResolutionDisplay(
          data.summary.avgResolutionHours.replace(/\s*hrs$/i, "")
        );
      }
    });
    return () => {
      mounted = false;
    };
  }, [areaComplaints.length]);

  async function handleResolveComplaint(complaintId: string, comment?: string) {
    const updated = await updateComplaintStatus(
      complaintId,
      "Resolved",
      comment
    );
    if (!updated) {
      throw new Error("Could not update complaint status on the server.");
    }
    try {
      const raw = localStorage.getItem("nc_crew_assignments");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed[complaintId]) {
          delete parsed[complaintId];
          localStorage.setItem("nc_crew_assignments", JSON.stringify(parsed));
        }
      }
    } catch {
      // ignore localStorage error
    }
    await refreshComplaints();
  }

  const allDepartmentComplaints = areaComplaints.map((item) => {
    const categoryMap: Record<string, string> = {
      "Pothole / Road": "Roads (PWD)",
      Streetlight: "Streetlighting",
      Garbage: "Sanitation (SWM)",
      "Garbage / Waste": "Sanitation (SWM)",
      "Water Supply": "Water Supply & Drainage",
      Drainage: "Stormwater & Drainage",
      "Drainage / Water": "Water Supply & Drainage",
    };

    const category = categoryMap[item.complaintType] ?? item.department;
    const isResolved =
      item.status === "Resolved" ||
      item.status === "Closed" ||
      Boolean(item.resolved);
    const isPendingDispatch =
      item.status === "Pending Dispatch" && !item.assignedWorker;
    const assignedCrew = isPendingDispatch
      ? undefined
      : item.assignedWorker || crewAssignments[item.id];
    const isAssigned = Boolean(
      assignedCrew && !assignedCrew.includes("Unassigned")
    );
    const assignedName = assignedCrew || "Unassigned (Action Needed)";
    const currentStatus = isResolved
      ? "Resolved"
      : item.status === "In Progress"
      ? "In Progress"
      : isAssigned || item.status === "Assigned"
      ? "In Progress"
      : item.status || "Pending Dispatch";

    const iconMap: Record<string, string> = {
      "Pothole / Road": "🛣️",
      Streetlight: "💡",
      Garbage: "🗑️",
      "Garbage / Waste": "🗑️",
      "Water Supply": "💧",
      Drainage: "💧",
      "Drainage / Water": "💧",
    };

    return {
      id: item.id,
      category:
        item.priority === "Urgent" ? `${category} • High Priority` : category,
      age: `Reported ${new Date(item.submittedAt).toLocaleString()}`,
      title: item.description,
      location: item.address || item.ward,
      assigned: assignedName,
      status: currentStatus,
      icon: iconMap[item.complaintType] || "📋",
      iconBg: isResolved
        ? "#dcfce7"
        : currentStatus === "In Progress"
        ? "#fef3c7"
        : "#fee2e2",
      tagStyle: isResolved
        ? { background: "#dcfce7", color: "#166534" }
        : currentStatus === "In Progress"
        ? { background: "#fef3c7", color: "#b45309" }
        : { background: "#ffdad6", color: "#ba1a1a" },
    };
  });

  const totalTickets = allDepartmentComplaints.length;
  const inProgressTickets = allDepartmentComplaints.filter((c) => {
    const isResolved = c.status === "Resolved" || c.status === "Closed";
    const hasAssigned = Boolean(
      crewAssignments[c.id] || (c.assigned && !c.assigned.includes("Unassigned"))
    );
    return !isResolved && (c.status === "In Progress" || hasAssigned);
  }).length;
  const pendingTickets = allDepartmentComplaints.filter((c) => {
    const isResolved = c.status === "Resolved" || c.status === "Closed";
    const hasAssigned = Boolean(
      crewAssignments[c.id] || (c.assigned && !c.assigned.includes("Unassigned"))
    );
    return !isResolved && !hasAssigned && c.status !== "In Progress";
  }).length;
  const resolvedTickets = allDepartmentComplaints.filter(
    (c) => c.status === "Resolved" || c.status === "Closed"
  ).length;

  const filteredComplaints = allDepartmentComplaints.filter((complaint) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      (complaint.id || "").toLowerCase().includes(query) ||
      (complaint.title || "").toLowerCase().includes(query) ||
      (complaint.location || "").toLowerCase().includes(query) ||
      (complaint.category || "").toLowerCase().includes(query) ||
      (complaint.assigned || "").toLowerCase().includes(query) ||
      (complaint.status || "").toLowerCase().includes(query);

    const hasAssigned = Boolean(
      crewAssignments[complaint.id] ||
      (complaint.assigned && !complaint.assigned.includes("Unassigned"))
    );
    const isResolved =
      complaint.status === "Resolved" ||
      complaint.status === "Closed" ||
      Boolean((complaint as any).resolved);
    const effectiveStatus = isResolved
      ? "Resolved"
      : hasAssigned || complaint.status === "In Progress"
      ? "In Progress"
      : "Pending";

    const matchesStatus =
      statusFilter === "All Status" ||
      (statusFilter === "Pending" && effectiveStatus === "Pending") ||
      (statusFilter === "In Progress" && effectiveStatus === "In Progress") ||
      (statusFilter === "Completed" && effectiveStatus === "Resolved");

    const compCat = (complaint.category || "").toLowerCase();
    const matchesCategory =
      categoryFilter === "All" ||
      (categoryFilter === "Roads & PWD" &&
        (compCat.includes("road") || compCat.includes("pothole") || compCat.includes("pwd"))) ||
      (categoryFilter === "Sanitation & SWM" &&
        (compCat.includes("sanit") || compCat.includes("waste") || compCat.includes("garbage") || compCat.includes("swm"))) ||
      (categoryFilter === "Streetlighting" &&
        (compCat.includes("street") || compCat.includes("electric") || compCat.includes("light"))) ||
      (categoryFilter === "Water & Drainage" &&
        (compCat.includes("water") || compCat.includes("drain") || compCat.includes("storm")));

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredComplaints.length / PAGE_SIZE)
  );
  const safePage = Math.min(currentPage, totalPages);
  const paginatedComplaints = filteredComplaints.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
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
              {adminWardLabel}
            </span>
            <span className="text-muted">Active</span>
          </div>

          <nav className="admin-nav">
            <a href="#complaints" className="active">
              All Complaints
            </a>
            <a
              href="#field-workers"
              onClick={(event) => {
                event.preventDefault();
                onOpenFieldWorkers();
              }}
            >
              Field Workers &amp; Crews
            </a>
            <a
              href="#analytics"
              onClick={(event) => {
                event.preventDefault();
                onOpenAnalytics();
              }}
            >
              Department Analytics
            </a>
          </nav>
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-topbar">
          <div className="flex gap-3 items-center">
            <strong style={{ color: "var(--navy)", fontSize: 18 }}>
              NagrikConnect Administration Core
            </strong>
            <span className="pill" style={{ background: "var(--blue-200)" }}>
              <span className="dot" style={{ background: "#61b15f" }} />
              {adminWardLabel}
            </span>
          </div>

          <div className="flex gap-3 items-center">
            <div className="admin-search">
              🔍
              <input
                type="search"
                placeholder="Search complaints, tokens..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="user-chip">
              <div className="user-avatar">{adminInitials}</div>
              <div>
                <div className="user-name">{adminName}</div>
                <div className="user-role">Officer Gr. I</div>
              </div>
            </div>

            <button type="button" className="btn-signout" onClick={onSignOut}>
              Sign Out
            </button>
          </div>
        </div>

        <main className="admin-body" id="complaints">
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontSize: 24, color: "var(--navy)" }}>
              Department Complaints
            </h1>
            <p className="small text-body mt-1">
              View and manage incoming ward grievances
            </p>
          </div>

          <div className="kpi-row">
            <div className="kpi-card">
              <div>
                <span className="kpi-label">Total Received</span>
                <div className="kpi-val" style={{ color: "var(--navy)" }}>
                  {totalTickets}{" "}
                  <span className="small text-body" style={{ fontWeight: 400 }}>
                    tickets
                  </span>
                </div>
                <p
                  className="small mt-1"
                  style={{ color: "var(--amber)", fontWeight: 600 }}
                >
                  ▲ {pendingTickets} pending assignment
                </p>
              </div>
              <div
                className="kpi-icon"
                style={{ background: "var(--blue-200)" }}
              >
                📥
              </div>
            </div>

            <div className="kpi-card">
              <div>
                <span className="kpi-label">In Progress</span>
                <div className="kpi-val" style={{ color: "var(--amber)" }}>
                  {inProgressTickets}{" "}
                  <span className="small text-body" style={{ fontWeight: 400 }}>
                    in field
                  </span>
                </div>
                <p className="small mt-1" style={{ fontWeight: 700 }}>
                  ● Active field work deployed
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
                <span className="kpi-label">Resolved Today</span>
                <div className="kpi-val" style={{ color: "var(--text-dark)" }}>
                  {resolvedTickets}{" "}
                  <span className="small text-body" style={{ fontWeight: 400 }}>
                    closed
                  </span>
                </div>
                <p className="small mt-1" style={{ fontWeight: 700 }}>
                  ✓ Awaiting citizen OTP
                </p>
              </div>
              <div
                className="kpi-icon"
                style={{ background: "var(--blue-200)" }}
              >
                ✅
              </div>
            </div>

            <div className="kpi-card">
              <div>
                <span className="kpi-label">Avg SLA Response</span>
                <div className="kpi-val" style={{ color: "var(--navy-light)" }}>
                  {avgResolutionDisplay}{" "}
                  <span className="small" style={{ fontWeight: 600 }}>
                    Hours
                  </span>
                </div>
                <p className="small mt-1" style={{ fontWeight: 700 }}>
                  Within statutory limit (48h)
                </p>
              </div>
              <div
                className="kpi-icon"
                style={{ background: "var(--blue-50)" }}
              >
                ⏱
              </div>
            </div>
          </div>

          <div className="toolbar">
            <div className="toolbar-top">
              <div className="search-box">
                🔍
                <input
                  type="search"
                  placeholder="Search by ID, keyword, or locality..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="status-pills">
                <span
                  className="small text-muted"
                  style={{ fontWeight: 700, padding: "4px 0" }}
                >
                  STATUS:
                </span>
                {["All Status", "Pending", "In Progress", "Completed"].map(
                  (status) => (
                    <button
                      type="button"
                      key={status}
                      className={`status-pill ${statusFilter === status ? "active" : ""}`}
                      onClick={() => {
                        setStatusFilter(status);
                        setCurrentPage(1);
                      }}
                    >
                      {status}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div
              className="flex gap-1 items-center"
              style={{ flexWrap: "wrap" }}
            >
              <span className="small text-muted" style={{ fontWeight: 700 }}>
                CATEGORY:
              </span>
              {[
                "All",
                "Roads & PWD",
                "Sanitation & SWM",
                "Streetlighting",
                "Water & Drainage",
              ].map((category) => (
                <button
                  type="button"
                  key={category}
                  className={`cat-chip ${categoryFilter === category ? "active" : ""}`}
                  onClick={() => {
                    setCategoryFilter(category);
                    setCurrentPage(1);
                  }}
                >
                  {category}
                  {category === "All" && (
                    <span className="cat-count">
                      {allDepartmentComplaints.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {paginatedComplaints.map((complaint) => {
            const isResolved =
              complaint.status === "Resolved" || complaint.status === "Closed";
            const hasAssigned =
              !isResolved &&
              Boolean(
                crewAssignments[complaint.id] ||
                (complaint.assigned && !complaint.assigned.includes("Unassigned"))
              );
            const assignedCrew =
              crewAssignments[complaint.id] ||
              (hasAssigned ? complaint.assigned : null);
            const displayStatus = isResolved
              ? "Resolved"
              : hasAssigned || complaint.status === "In Progress" || complaint.status === "Assigned"
              ? "In Progress"
              : "Pending Dispatch";

            const rowAccentStyle = isResolved
              ? { borderLeft: "4px solid #2e7d32", background: "#f4fbf4" }
              : displayStatus === "In Progress"
              ? { borderLeft: "4px solid #d97706", background: "#fffbeb" }
              : { borderLeft: "4px solid #ba1a1a", background: "#fff8f8" };

            return (
              <div
                className="complaint-row"
                key={complaint.id}
                style={rowAccentStyle}
              >
                <div className="flex gap-3" style={{ flex: 1, minWidth: 260 }}>
                  <div
                    className="row-icon"
                    style={{ background: complaint.iconBg }}
                  >
                    {complaint.icon}
                  </div>
                  <div>
                    <div className="row-meta">
                      <code>#{complaint.id}</code> •{" "}
                      <span className="row-tag" style={complaint.tagStyle}>
                        {complaint.category}
                      </span>{" "}
                      • <span className="text-body">🕒 {complaint.age}</span>
                    </div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 18,
                        color: "var(--text-dark)",
                      }}
                    >
                      {complaint.title}
                    </h3>
                    <div className="row-detail">
                      <span>📍 {complaint.location}</span>
                      <span>
                        {isResolved
                          ? "Executed by: "
                          : "👤 Assigned: "}
                        <strong>
                          {assignedCrew ?? complaint.assigned}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 items-center" style={{ flexWrap: "wrap" }}>
                  <span
                    className="pill"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "6px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      ...(displayStatus === "In Progress"
                        ? {
                            background: "#fef3c7",
                            color: "#b45309",
                          }
                        : isResolved
                          ? {
                              background: "#dcfce7",
                              color: "#166534",
                            }
                          : {
                              background: "#ffdad6",
                              color: "#ba1a1a",
                            }),
                    }}
                  >
                    {displayStatus}
                  </span>

                  {displayStatus === "Pending Dispatch" && (
                    <button
                      type="button"
                      className="btn btn-amber btn-sm"
                      onClick={() => onAssignComplaint(complaint)}
                    >
                      🚚 Assign Crew
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedComplaint(complaint)}
                  >
                    View Details →
                  </button>
                </div>
              </div>
            );
          })}

          {filteredComplaints.length === 0 && (
            <div className="card card-pad text-body">
              No complaints match your search and filters.
            </div>
          )}

          <div className="pager">
            <span className="small text-body">
              Showing{" "}
              <strong>
                {filteredComplaints.length === 0
                  ? 0
                  : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(
                      safePage * PAGE_SIZE,
                      filteredComplaints.length
                    )}`}
              </strong>{" "}
              of <strong>{filteredComplaints.length}</strong> complaints
            </span>
            <div className="flex gap-1 items-center">
              <button
                type="button"
                className="page-btn"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                ← Previous
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                (pageNum) => (
                  <button
                    type="button"
                    key={pageNum}
                    className={`page-btn ${safePage === pageNum ? "active" : ""}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                )
              )}
              <button
                type="button"
                className="page-btn"
                disabled={safePage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                Next →
              </button>
            </div>
          </div>
        </main>

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
      </div>
      {selectedComplaint && (
        <DepartmentComplaintModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onResolve={handleResolveComplaint}
        />
      )}
    </div>
  );
}

export default DepartmentPortal;
