import { useState } from "react";

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
  onDispatch,
  complaintToAssign,
  onAssignCrew,
}: FieldWorkersProps) {
  const [search, setSearch] = useState("");

  const filteredWorkers = initialWorkers.filter((worker) =>
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
            <button type="button" onClick={() => {}}>
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
                Field Workers &amp; Crews{" "}
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
                  फील्ड दल प्रबंधन
                </span>
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
              onClick={() =>
                alert("Adding crew members will be implemented next.")
              }
            >
              + Add New Crew Member
            </button>
          </div>

          <div className="kpi-row">
            <div className="kpi-card">
              <div>
                <span className="kpi-label">Total Field Staff</span>
                <div className="kpi-val" style={{ color: "var(--navy)" }}>
                  24
                </div>
                <p className="small mt-1" style={{ fontWeight: 600 }}>
                  Across 6 municipal units
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
                  9
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
                  11
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
                  4
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
              <article className="crew-card" key={worker.initials}>
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

                <button
                  type="button"
                  className={`btn ${worker.type === "dispatch" ? "btn-navy" : "btn-secondary"} btn-block btn-sm mt-3`}
                  disabled={worker.type === "off-duty"}
                  style={
                    worker.type === "off-duty"
                      ? { opacity: 0.6, cursor: "not-allowed" }
                      : undefined
                  }
                  onClick={() => {
                    if (worker.type === "ticket" && worker.complaintId) {
                      onViewComplaint(worker.complaintId);
                    } else if (worker.type === "dispatch") {
                      if (complaintToAssign) {
                        onAssignCrew(complaintToAssign.id, worker.name);
                        onBack();
                      } else {
                        onDispatch();
                      }
                    }
                  }}
                >
                  {worker.action}
                </button>
              </article>
            ))}
          </div>
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
