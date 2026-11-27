import { useState, useEffect } from "react";
import { fetchAnalytics, getCurrentUser, type ApiAnalytics } from "../api";

type DepartmentAnalyticsProps = {
  onBack: () => void;
  onOpenFieldWorkers: () => void;
  onOpenSchedule: () => void;
  onSignOut: () => void;
};

const RANGE_OPTIONS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "all", label: "All Time" },
] as const;

function getDeptBarClass(deptId: string): string {
  if (deptId === "pwd") return "bar-roads";
  if (deptId === "swm") return "bar-sanitation";
  if (deptId === "electrical") return "bar-electrical";
  return "bar-water";
}

function DepartmentAnalytics({
  onBack,
  onOpenFieldWorkers,
  onOpenSchedule,
  onSignOut,
}: DepartmentAnalyticsProps) {
  const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);
  const [range, setRange] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const currentUser = getCurrentUser();
  const adminName = currentUser?.name || "Anita Rao (Admin)";
  const adminInitials =
    adminName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AR";
  const adminWardLabel = currentUser?.city
    ? `${currentUser.city} • Municipal Core`
    : "All Wards • Municipal Core";

  useEffect(() => {
    let mounted = true;
    fetchAnalytics(range).then((data) => {
      if (mounted) {
        if (data) setAnalytics(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [range]);

  const summary = analytics?.summary;
  const departments = analytics?.departmentBreakdown || [];
  const slaTurnaround = analytics?.slaTurnaround;
  const ops = analytics?.operations;

  return (
    <div className="admin-wrap analytics-page">
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
            <button type="button" onClick={onBack}>
              All Complaints
            </button>
            <button type="button" onClick={onOpenFieldWorkers}>
              Field Workers &amp; Crews
            </button>
            <button type="button" className="active">
              Department Analytics
            </button>
            <button type="button" onClick={onOpenSchedule}>
              Citizen Hub Schedule
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
              {adminWardLabel}
            </span>
          </div>

          <div className="flex gap-3 items-center">
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
        </header>

        <section className="admin-body">
          <div className="analytics-heading">
            <div>
              <span className="analytics-eyebrow">
                MUNICIPAL OPERATIONS • LIVE ANALYTICS
              </span>
              <h1>Department Analytics &amp; Performance</h1>
              <p>Department &amp; Ward Statistics</p>
              <p className="text-muted">
                Real-time overview of civic operations, resolution rates,
                department workload, and field squad utilization.
              </p>
            </div>

            <div className="analytics-date-filters">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={range === opt.key ? "active" : ""}
                  onClick={() => {
                    setLoading(true);
                    setRange(opt.key);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="kpi-row">
            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">Total Handled</span>
                <span>📋</span>
              </div>
              <div className="kpi-val">
                {loading && !summary ? "…" : (summary?.totalComplaints ?? 0)}
              </div>
              <p className="text-muted">Complaints</p>
              <p className="analytics-note">
                {summary
                  ? `${summary.resolved} Resolved • ${summary.inProgress} In Progress • ${summary.pendingDispatch} Pending`
                  : "Loading live totals..."}
              </p>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">Avg. Resolution Time</span>
                <span>⏱️</span>
              </div>
              <div className="kpi-val">
                {summary
                  ? summary.avgResolutionHours.replace(/\s*hrs$/i, "")
                  : "—"}
              </div>
              <p className="text-muted">Hours</p>
              <p className="analytics-note">Target ≤ 48 Hours</p>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">SLA Compliance Rate</span>
                <span>✓</span>
              </div>
              <div className="kpi-val">
                {summary ? summary.slaComplianceRate : "—"}
              </div>
              <p className="text-muted">On-Time Redressal Charter</p>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">Citizen Satisfaction</span>
                <span>★</span>
              </div>
              <div className="kpi-val">
                {summary?.avgRating ? (
                  <>
                    {summary.avgRating} <small>/ 5.0</small>
                  </>
                ) : (
                  <span style={{ fontSize: 22 }}>No ratings</span>
                )}
              </div>
              <p className="text-muted">
                {summary?.ratingCount
                  ? `${summary.ratingCount} post-resolution rating(s)`
                  : "Awaiting post-resolution feedback"}
              </p>
            </div>
          </div>

          <div className="mid-grid">
            <section className="analytics-panel">
              <div className="analytics-panel-heading">
                <div>
                  <h2>Department Workload &amp; Distribution</h2>
                  <p className="text-muted">
                    Live distribution of civic grievances and resolution counts
                    across municipal departments.
                  </p>
                </div>
                <span className="analytics-badge">
                  Total: {summary?.totalComplaints ?? 0}
                </span>
              </div>

              {departments.length > 0 ? (
                departments.map((dept) => (
                  <div className="bar-row" key={dept.id}>
                    <div className="bar-top">
                      <span>{dept.name}</span>
                      <span>
                        {dept.resolved} Resolved • {dept.percentage}% (
                        {dept.total})
                      </span>
                    </div>
                    <div className="bar-track">
                      <div
                        className={`bar-fill ${getDeptBarClass(dept.id)}`}
                        style={{ width: `${dept.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted">No department complaints in range.</p>
              )}
            </section>

            <section className="analytics-panel">
              <div className="analytics-panel-heading">
                <div>
                  <h2>SLA &amp; Resolution Turnaround</h2>
                  <p className="text-muted">
                    {summary
                      ? `${summary.slaComplianceRate} of tracked grievances are within SLA targets.`
                      : "Calculating live SLA turnaround..."}
                  </p>
                </div>
                <span className="analytics-badge">
                  Compliance: {summary?.slaComplianceRate ?? "—"}
                </span>
              </div>

              <div className="sla-row">
                <div>
                  <strong>Resolved &lt;24 Hours</strong>
                  <p className="text-muted">
                    {slaTurnaround?.under24hCount ?? 0} complaint(s) fast-tracked
                  </p>
                </div>
                <strong>
                  {slaTurnaround?.under24hPct ?? 0}%{" "}
                  <span className="sla-status">Ahead</span>
                </strong>
              </div>

              <div className="sla-row">
                <div>
                  <strong>Resolved 24–48 Hours</strong>
                  <p className="text-muted">
                    {slaTurnaround?.between24And48hCount ?? 0} complaint(s)
                    within SLA
                  </p>
                </div>
                <strong>
                  {slaTurnaround?.between24And48hPct ?? 0}%{" "}
                  <span className="sla-status">On Target</span>
                </strong>
              </div>

              <div className="sla-row danger">
                <div>
                  <strong>Breached / Overdue (&gt;48 Hours)</strong>
                  <p className="text-muted">
                    {slaTurnaround?.breachedCount ?? 0} complaint(s) requiring
                    review
                  </p>
                </div>
                <strong>
                  {slaTurnaround?.breachedPct ?? 0}%{" "}
                  <span className="sla-status">Overdue</span>
                </strong>
              </div>
            </section>
          </div>

          <section className="analytics-panel analytics-operations">
            <div className="analytics-panel-heading">
              <div>
                <h2>Ward Operations &amp; Resource Utilization</h2>
                <p className="text-muted">
                  Live squad deployment, active hotspots, and peak intake window.
                </p>
              </div>
              <span className="analytics-badge">Live Status</span>
            </div>

            <div className="bottom-grid">
              <div className="stat-tile">
                <span className="kpi-label">Active Field Squads</span>
                <h3>{ops?.deployedWorkers ?? 0} Deployed</h3>
                <p className="text-muted">
                  Out of {ops?.totalWorkers ?? 0} total staff (
                  {ops?.offDutyWorkers ?? 0} off-duty)
                </p>
                <strong>{ops?.availableWorkers ?? 0} Available Now</strong>
              </div>

              <div className="stat-tile">
                <span className="kpi-label">Active Crew Utilization</span>
                <h3>{ops?.utilizationPct ?? 0}% In Field</h3>
                <p className="text-muted">
                  {ops?.deployedWorkers ?? 0} on-site /{" "}
                  {Math.max(
                    0,
                    (ops?.totalWorkers ?? 0) - (ops?.offDutyWorkers ?? 0)
                  )}{" "}
                  on-duty
                </p>
                <strong>
                  {(ops?.utilizationPct ?? 0) >= 80
                    ? "High Load"
                    : "Balanced Capacity"}
                </strong>
              </div>

              <div className="stat-tile">
                <span className="kpi-label">Most Reported Locality</span>
                <h3
                  style={{
                    fontSize: 16,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={ops?.topLocality}
                >
                  {ops?.topLocality ?? "No complaints"}
                </h3>
                <p className="text-muted">
                  {ops?.topLocalityCount ?? 0} complaint(s) •{" "}
                  {ops?.topLocalityPct ?? 0}% of total
                </p>
                <strong>Priority Inspection Zone</strong>
              </div>

              <div className="stat-tile">
                <span className="kpi-label">Peak Reporting Hours</span>
                <h3>{ops?.peakReportingWindow ?? "No data"}</h3>
                <p className="text-muted">
                  {ops?.peakCount ?? 0} complaint(s) logged in peak window
                </p>
                <strong>Auto-Routing Active</strong>
              </div>
            </div>
          </section>
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

export default DepartmentAnalytics;
