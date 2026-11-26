import { useEffect, useState } from "react";
import { useComplaint, type DepartmentAnalyticsData } from "../ComplaintContext";

type DepartmentAnalyticsProps = {
  onBack: () => void;
  onOpenFieldWorkers: () => void;
  onSignOut: () => void;
};

type Period = "today" | "7d" | "30d" | "custom";

function todayInKolkata() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00–${String((hour + 1) % 24).padStart(2, "0")}:00 IST`;
}

function DepartmentAnalytics({
  onBack,
  onOpenFieldWorkers,
  onSignOut,
}: DepartmentAnalyticsProps) {
  const { user, openMyAccount, loadDepartmentAnalytics } = useComplaint();
  const [period, setPeriod] = useState<Period>("7d");
  const [customFrom, setCustomFrom] = useState(todayInKolkata());
  const [customTo, setCustomTo] = useState(todayInKolkata());
  const [analytics, setAnalytics] = useState<DepartmentAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (period === "custom" && (!customFrom || !customTo)) return;
    let active = true;
    const range = period === "custom"
      ? { period, from: customFrom, to: customTo }
      : { period };
    loadDepartmentAnalytics(range)
      .then((result) => {
        if (active) setAnalytics(result);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setAnalytics(null);
          setError(loadError instanceof Error ? loadError.message : "Could not load department analytics.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [period, customFrom, customTo, loadDepartmentAnalytics]);

  function choosePeriod(nextPeriod: Period) {
    if (nextPeriod === period) return;
    setLoading(true);
    setError("");
    setPeriod(nextPeriod);
  }

  function chooseCustomFrom(value: string) {
    if (value === customFrom) return;
    setCustomFrom(value);
    if (!value || !customTo) {
      setLoading(false);
      setAnalytics(null);
      setError("Select both dates to load custom-range analytics.");
      return;
    }
    setLoading(true);
    setError("");
  }

  function chooseCustomTo(value: string) {
    if (value === customTo) return;
    setCustomTo(value);
    if (!value || !customFrom) {
      setLoading(false);
      setAnalytics(null);
      setError("Select both dates to load custom-range analytics.");
      return;
    }
    setLoading(true);
    setError("");
  }

  const maxDepartmentCount = Math.max(1, ...(analytics?.departments.map((item) => item.total) ?? []));

  return (
    <div className="admin-wrap analytics-page">
      <aside className="admin-sidebar">
        <div>
          <div className="brand">
            <div className="brand-mark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18M4 21V8l8-5 8 5v13M9 21v-6h6v6" />
              </svg>
            </div>
            <div>
              <div className="brand-name" style={{ fontSize: 18 }}>NagrikConnect</div>
              <div className="small text-muted" style={{ fontWeight: 700, letterSpacing: ".5px" }}>
                ADMINISTRATION CORE
              </div>
            </div>
          </div>

          <div className="admin-ward-pill">
            <span className="flex gap-1 items-center">
              <span className="dot" style={{ background: "#61b15f" }} />
              Municipal Operations
            </span>
            <span className="text-muted">Active</span>
          </div>

          <nav className="admin-nav">
            <button type="button" onClick={onBack}>All Complaints</button>
            <button type="button" onClick={onOpenFieldWorkers}>Field Workers &amp; Crews</button>
            <button type="button" className="active">Department Analytics</button>
          </nav>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <strong style={{ color: "var(--navy)", fontSize: 18 }}>
            NagrikConnect Administration Core
          </strong>
          <div className="flex items-center admin-header-actions">
            <button type="button" className="user-chip profile-trigger" onClick={openMyAccount} aria-label="Open My Account">
              <div className="user-avatar">{user?.name.slice(0, 1).toUpperCase()}</div>
              <div>
                <div className="user-name">{user?.name}</div>
                <div className="user-role">Administrator</div>
              </div>
            </button>
            <button type="button" className="btn-signout" onClick={onSignOut}>Sign Out</button>
          </div>
        </header>

        <section className="admin-body">
          <div className="analytics-heading">
            <div>
              <span className="analytics-eyebrow">DEPARTMENT OPERATIONS</span>
              <h1>Department Analytics &amp; Performance</h1>
              <p>विभाग एवं वार्ड सांख्यिकी</p>
              <p className="text-muted">
                Complaint volumes, resolution turnaround, and current worker availability.
              </p>
            </div>
            <div className="analytics-date-filters" aria-label="Analytics date range">
              {([
                ["today", "Today"],
                ["7d", "Last 7 Days"],
                ["30d", "Last 30 Days"],
                ["custom", "Custom"],
              ] as const).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={period === value ? "active" : ""}
                  aria-pressed={period === value}
                  onClick={() => choosePeriod(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {period === "custom" && (
            <div className="analytics-custom-range">
              <label>
                From
                <input type="date" value={customFrom} max={customTo} onChange={(event) => chooseCustomFrom(event.target.value)} />
              </label>
              <label>
                To
                <input type="date" value={customTo} min={customFrom} max={todayInKolkata()} onChange={(event) => chooseCustomTo(event.target.value)} />
              </label>
              <span className="small text-muted">Dates are interpreted in Asia/Kolkata time.</span>
            </div>
          )}

          {error && <div className="card card-pad analytics-message analytics-error" role="alert">{error}</div>}
          {loading && <div className="card card-pad analytics-message" role="status">Loading department analytics…</div>}

          {!loading && analytics && (
            <>
              <div className="kpi-row">
                <div className="kpi-card">
                  <div className="kpi-top"><span className="kpi-label">Total Complaints</span><span>📋</span></div>
                  <div className="kpi-val">{analytics.kpis.totalComplaints}</div>
                  <p className="text-muted">Submitted in selected period</p>
                </div>
                <div className="kpi-card">
                  <div className="kpi-top"><span className="kpi-label">Resolved Complaints</span><span>✅</span></div>
                  <div className="kpi-val">{analytics.kpis.resolvedComplaints}</div>
                  <p className="text-muted">Current status: resolved</p>
                </div>
                <div className="kpi-card">
                  <div className="kpi-top"><span className="kpi-label">In Progress</span><span>🚧</span></div>
                  <div className="kpi-val">{analytics.kpis.inProgressComplaints}</div>
                  <p className="text-muted">Current status: in progress</p>
                </div>
                <div className="kpi-card">
                  <div className="kpi-top"><span className="kpi-label">Pending Complaints</span><span>⏳</span></div>
                  <div className="kpi-val">{analytics.kpis.pendingComplaints}</div>
                  <p className="text-muted">Awaiting dispatch</p>
                </div>
                <div className="kpi-card">
                  <div className="kpi-top"><span className="kpi-label">Average Resolution Time</span><span>⏱️</span></div>
                  <div className="kpi-val">
                    {analytics.kpis.averageResolutionHours === null ? "N/A" : analytics.kpis.averageResolutionHours}
                    {analytics.kpis.averageResolutionHours !== null && <small> hrs</small>}
                  </div>
                  <p className="text-muted">
                    {analytics.kpis.averageResolutionHours === null ? "No resolved complaints with valid timestamps" : "Creation to resolution"}
                  </p>
                </div>
                <div className="kpi-card">
                  <div className="kpi-top"><span className="kpi-label">SLA Compliance Rate</span><span>—</span></div>
                  <div className="kpi-val">{analytics.kpis.slaCompliancePercent === null ? "N/A" : `${analytics.kpis.slaCompliancePercent}%`}</div>
                  <p className="text-muted">{analytics.kpis.slaUnavailableReason ?? "Based on configured SLA target"}</p>
                </div>
              </div>

              {analytics.kpis.totalComplaints === 0 && (
                <div className="card card-pad analytics-message text-body" role="status">
                  No complaints were reported during this period.
                </div>
              )}

              <div className="mid-grid">
                <section className="analytics-panel">
                  <div className="analytics-panel-heading">
                    <div>
                      <h2>Department Workload &amp; Distribution</h2>
                      <p className="text-muted">Complaint counts and status distribution by recorded department.</p>
                    </div>
                    <span className="analytics-badge">Total: {analytics.kpis.totalComplaints}</span>
                  </div>
                  {analytics.departments.length === 0 && (
                    <p className="text-muted analytics-empty">No department data for this period.</p>
                  )}
                  {analytics.departments.map((department, index) => (
                    <div className="bar-row" key={department.department}>
                      <div className="bar-top">
                        <span>{department.department}</span>
                        <span>
                          {department.total} total · {department.resolved} resolved · {department.inProgress} in progress · {department.pending} pending · {department.contributionPercent}%
                        </span>
                      </div>
                      <div className="bar-track" aria-label={`${department.department}: ${department.total} complaints`}>
                        <div
                          className={`bar-fill bar-department-${index % 4}`}
                          style={{ width: `${Math.min(100, (department.total / maxDepartmentCount) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </section>

                <section className="analytics-panel">
                  <div className="analytics-panel-heading">
                    <div>
                      <h2>Resolution Turnaround</h2>
                      <p className="text-muted">Resolved complaints only, measured from submission to resolution.</p>
                    </div>
                    <span className="analytics-badge">
                      {analytics.resolutionBuckets.reduce((total, bucket) => total + bucket.count, 0)} resolved
                    </span>
                  </div>
                  {analytics.resolutionBuckets.every((bucket) => bucket.count === 0) ? (
                    <p className="text-muted analytics-empty">No resolved complaints with valid timestamps in this period.</p>
                  ) : analytics.resolutionBuckets.map((bucket) => (
                    <div className={`sla-row ${bucket.key === "over48Hours" ? "danger" : ""}`} key={bucket.key}>
                      <div><strong>{bucket.label}</strong><p className="text-muted">Resolved complaints</p></div>
                      <strong>{bucket.percent === null ? "N/A" : `${bucket.percent}%`}<span className="sla-status">{bucket.count} complaints</span></strong>
                    </div>
                  ))}
                </section>
              </div>

              <section className="analytics-panel analytics-operations">
                <div className="analytics-panel-heading">
                  <div>
                    <h2>Operations &amp; Resource Utilization</h2>
                    <p className="text-muted">Complaint reporting patterns for the selected period and current worker status.</p>
                  </div>
                  <span className="analytics-badge">Database data</span>
                </div>
                <div className="bottom-grid">
                  <div className="stat-tile">
                    <span className="kpi-label">Most Reported Locality</span>
                    <h3>{analytics.operations.mostReportedLocality?.name ?? "Location not available"}</h3>
                    <p className="text-muted">
                      {analytics.operations.mostReportedLocality
                        ? `${analytics.operations.mostReportedLocality.complaints} complaints`
                        : "No locality recorded for this period"}
                    </p>
                  </div>
                  <div className="stat-tile">
                    <span className="kpi-label">Peak Reporting Hour (IST)</span>
                    <h3>{analytics.operations.peakReportingHour ? hourLabel(analytics.operations.peakReportingHour.hourIst) : "Data not available"}</h3>
                    <p className="text-muted">
                      {analytics.operations.peakReportingHour
                        ? `${analytics.operations.peakReportingHour.complaints} complaints submitted`
                        : "No complaint timestamps for this period"}
                    </p>
                  </div>
                  <div className="stat-tile">
                    <span className="kpi-label">Active Field Workers (on duty or assigned)</span>
                    <h3>{analytics.operations.workers.active}</h3>
                    <p className="text-muted">{analytics.operations.workers.total} registered workers total</p>
                  </div>
                  <div className="stat-tile">
                    <span className="kpi-label">Worker Availability</span>
                    <h3>{analytics.operations.workers.available} available · {analytics.operations.workers.assigned} assigned</h3>
                    <p className="text-muted">{analytics.operations.workers.offDuty} off-duty or on leave</p>
                  </div>
                </div>
              </section>
            </>
          )}
        </section>

        <footer className="site-footer">
          <div className="container">
            <div className="footer-col">
              <div className="footer-brand">
                <div className="footer-mark">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21h18M4 21V8l8-5 8 5v13" />
                  </svg>
                </div>
                <span className="footer-name">NagrikConnect</span>
              </div>
              <p className="footer-desc">Smart City Civic Redressal Infrastructure</p>
            </div>
            <div className="footer-help">
              <h4>Emergency Helplines</h4>
              <p>112 – National Emergency • 101 – Fire • 1916 – Water Supply (24/7)</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default DepartmentAnalytics;
