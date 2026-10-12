import DepartmentComplaintModal from "./DepartmentComplaintModal";
import { useState } from "react";

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

const complaints = [
  {
    id: "GRV-2025-W14-8902",
    category: "Roads (PWD)",
    age: "Reported 3 hrs ago",
    title: "Pothole Repair on 12th Main Road",
    location: "12th Main, near HAL 2nd Stage Junction",
    assigned: "Er. Manoj Kumar",
    status: "In Progress",
    icon: "🛠",
    iconBg: "var(--blue-200)",
    tagStyle: { background: "rgba(102,41,0,.1)", color: "#fe8439" },
  },
  {
    id: "GRV-2025-W14-9140",
    category: "Stormwater • High Priority",
    age: "Reported 1 hr ago",
    title: "Broken Sump Grating & Drain Overflow",
    location: "4th Cross Road, BDA Complex Perimeter",
    assigned: "Unassigned (Action Needed)",
    status: "Pending Dispatch",
    icon: "🚨",
    iconBg: "var(--red-bg)",
    tagStyle: { background: "rgba(255,218,214,.4)", color: "var(--red)" },
  },
  {
    id: "GRV-2025-W14-8841",
    category: "Roads (PWD)",
    age: "Reported Yesterday • Resolved in 19 hrs",
    title: "Dislodged Pedestrian Paver Blocks",
    location: "100 Feet Road, Near Metro Pillar 42",
    assigned: "Er. Manoj Kumar",
    status: "Resolved",
    icon: "🧱",
    iconBg: "var(--blue-200)",
    tagStyle: { background: "rgba(102,41,0,.1)", color: "#fe8439" },
  },
  {
    id: "GRV-2025-W14-8712",
    category: "Electrical",
    age: "Reported Yesterday",
    title: "Streetlight Blackout near Sector 4 Park",
    location: "Sector 4 Central Park, Lane 2 (Poles 14-16)",
    assigned: "Suresh Rao (Electrician)",
    status: "In Progress",
    icon: "💡",
    iconBg: "var(--blue-200)",
    tagStyle: { background: "var(--blue-300)", color: "var(--navy)" },
  },
  {
    id: "GRV-2025-W14-8650",
    category: "Sanitation (SWM)",
    age: "Reported 2 days ago • Resolved in 6 hrs",
    title: "Overflowing Community Garbage Bin",
    location: "Market Square Corner, Opposite Post Office",
    assigned: "Sanitation Unit 3",
    status: "Resolved",
    icon: "🗑",
    iconBg: "var(--blue-200)",
    tagStyle: { background: "var(--green-bg)", color: "var(--green-text)" },
  },
];

function DepartmentPortal({
  onSignOut,
  onOpenFieldWorkers,
  onOpenAnalytics,
  onAssignComplaint,
  crewAssignments,
  onUpdateCrewAssignment,
}: DepartmentPortalProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedComplaint, setSelectedComplaint] = useState<
    (typeof complaints)[number] | null
  >(null);

  const filteredComplaints = complaints.filter((complaint) => {
    const query = search.toLowerCase();
    const matchesSearch =
      complaint.id.toLowerCase().includes(query) ||
      complaint.title.toLowerCase().includes(query) ||
      complaint.location.toLowerCase().includes(query) ||
      complaint.assigned.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "All Status" ||
      (statusFilter === "Pending" && complaint.status === "Pending Dispatch") ||
      complaint.status === statusFilter;

    const matchesCategory =
      categoryFilter === "All" ||
      (categoryFilter === "Roads & PWD" &&
        complaint.category.includes("Roads")) ||
      (categoryFilter === "Sanitation & SWM" &&
        complaint.category.includes("Sanitation")) ||
      (categoryFilter === "Streetlighting" &&
        complaint.category === "Electrical");

    return matchesSearch && matchesStatus && matchesCategory;
  });

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
              Ward 14 • Indiranagar
            </span>
          </div>

          <div className="flex gap-3 items-center">
            <div className="admin-search">
              🔍
              <input
                type="search"
                placeholder="Search complaints, tokens..."
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

            <button type="button" className="btn-signout" onClick={onSignOut}>
              Sign Out
            </button>
          </div>
        </div>

        <main className="admin-body" id="complaints">
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontSize: 24, color: "var(--navy)" }}>
              Department Complaints{" "}
              <span style={{ fontWeight: 600, color: "var(--text-muted)" }}>
                /
              </span>{" "}
              <span
                style={{
                  fontWeight: 600,
                  color: "var(--text-body)",
                  fontSize: 18,
                }}
              >
                सभी शिकायतें
              </span>
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
                  18{" "}
                  <span className="small text-body" style={{ fontWeight: 400 }}>
                    tickets
                  </span>
                </div>
                <p
                  className="small mt-1"
                  style={{ color: "var(--amber)", fontWeight: 600 }}
                >
                  ▲ 4 pending assignment
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
                  7{" "}
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
                  5{" "}
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
                  28{" "}
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
                  onChange={(event) => setSearch(event.target.value)}
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
                      onClick={() => setStatusFilter(status)}
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
              {["All", "Roads & PWD", "Sanitation & SWM", "Streetlighting"].map(
                (category) => (
                  <button
                    type="button"
                    key={category}
                    className={`cat-chip ${categoryFilter === category ? "active" : ""}`}
                    onClick={() => setCategoryFilter(category)}
                  >
                    {category}
                    {category === "All" && (
                      <span className="cat-count">18</span>
                    )}
                  </button>
                ),
              )}
            </div>
          </div>

          {filteredComplaints.map((complaint) => {
            const assignedCrew = crewAssignments[complaint.id];
            const displayStatus = assignedCrew
              ? "In Progress"
              : complaint.status;

            return (
              <div className="complaint-row" key={complaint.id}>
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
                        {complaint.status === "Resolved"
                          ? "Executed by: "
                          : "👤 Assigned: "}
                        <strong>
                          {crewAssignments[complaint.id] ?? complaint.assigned}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-center">
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
                      ...(complaint.status === "In Progress"
                        ? {
                            background: "var(--amber-bg)",
                            color: "var(--amber)",
                          }
                        : complaint.status === "Resolved"
                          ? {
                              background: "var(--blue-100)",
                              color: "var(--green-text)",
                            }
                          : {
                              background: "var(--red-bg)",
                              color: "var(--red)",
                            }),
                    }}
                  >
                    {displayStatus}
                  </span>

                  {crewAssignments[complaint.id] ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedComplaint(complaint)}
                    >
                      View Details →
                    </button>
                  ) : complaint.status === "Pending Dispatch" ? (
                    <button
                      type="button"
                      className="btn btn-amber btn-sm"
                      onClick={() => onAssignComplaint(complaint)}
                    >
                      🚚 Assign Crew
                    </button>
                  ) : complaint.status === "Resolved" ? (
                    <button type="button" className="btn btn-secondary btn-sm">
                      📷 View Proof
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedComplaint(complaint)}
                    >
                      View Details →
                    </button>
                  )}
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
              Showing <strong>{filteredComplaints.length}</strong> of{" "}
              <strong>18</strong> complaints
            </span>
            <div className="flex gap-1 items-center">
              <button type="button" className="page-btn" disabled>
                ← Previous
              </button>
              <button type="button" className="page-btn active">
                1
              </button>
              <button type="button" className="page-btn">
                2
              </button>
              <button type="button" className="page-btn">
                3
              </button>
              <button type="button" className="page-btn">
                4
              </button>
              <button type="button" className="page-btn">
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
        />
      )}
    </div>
  );
}

export default DepartmentPortal;
