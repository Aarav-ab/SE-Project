type DepartmentAnalyticsProps = {
  onBack: () => void;
  onOpenFieldWorkers: () => void;
  onSignOut: () => void;
};

function DepartmentAnalytics({
  onBack,
  onOpenFieldWorkers,
  onSignOut,
}: DepartmentAnalyticsProps) {
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
              Ward 14 • Indiranagar
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
          </nav>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <strong style={{ color: "var(--navy)", fontSize: 18 }}>
            NagrikConnect Administration Core
          </strong>

          <div className="flex gap-3 items-center">
            <span className="pill" style={{ background: "var(--blue-200)" }}>
              <span className="dot" style={{ background: "#61b15f" }} />
              Ward 14 • Indiranagar
            </span>
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
        </header>

        <section className="admin-body">
          <div className="analytics-heading">
            <div>
              <span className="analytics-eyebrow">
                WARD 14 • INDIRANAGAR OPERATIONS
              </span>
              <h1>Department Analytics &amp; Performance</h1>
              <p>विभाग एवं वार्ड सांख्यिकी</p>
              <p className="text-muted">
                Overview of civic operations, resolution rates, department
                workload, and ward-level municipal performance.
              </p>
            </div>

            <div className="analytics-date-filters">
              <button type="button">Today</button>
              <button type="button" className="active">
                Last 7 Days
              </button>
              <button type="button">Last 30 Days</button>
              <button type="button">Custom</button>
            </div>
          </div>
          <div className="kpi-row">
            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">Total Handled</span>
                <span>📋</span>
              </div>
              <div className="kpi-val">138</div>
              <p className="text-muted">Complaints</p>
              <p className="analytics-note">127 Resolved • 11 In Progress</p>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">Avg. Resolution Time</span>
                <span>⏱️</span>
              </div>
              <div className="kpi-val">28.4</div>
              <p className="text-muted">Hours</p>
              <p className="analytics-note">Target ≤ 48 Hours</p>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">SLA Compliance Rate</span>
                <span>✓</span>
              </div>
              <div className="kpi-val">92.0%</div>
              <p className="text-muted">On-Time Redressal Charter</p>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">Citizen Satisfaction</span>
                <span>★</span>
              </div>
              <div className="kpi-val">
                4.6 <small>/ 5.0</small>
              </div>
              <p className="text-muted">115 post-resolution ratings</p>
            </div>
          </div>
          <div className="mid-grid">
            <section className="analytics-panel">
              <div className="analytics-panel-heading">
                <div>
                  <h2>Department Workload &amp; Distribution</h2>
                  <p className="text-muted">
                    Distribution of civic grievances, progress, and resolution
                    status across ward municipal units.
                  </p>
                </div>
                <span className="analytics-badge">Total: 138</span>
              </div>

              <div className="bar-row">
                <div className="bar-top">
                  <span>Roads &amp; Public Works (PWD)</span>
                  <span>58 Resolved • 45% (62)</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill bar-roads"
                    style={{ width: "45%" }}
                  />
                </div>
              </div>

              <div className="bar-row">
                <div className="bar-top">
                  <span>Solid Waste &amp; Sanitation (SWM)</span>
                  <span>39 Resolved • 30% (41)</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill bar-sanitation"
                    style={{ width: "30%" }}
                  />
                </div>
              </div>

              <div className="bar-row">
                <div className="bar-top">
                  <span>Streetlighting &amp; Electrical</span>
                  <span>19 Resolved • 15% (21)</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill bar-electrical"
                    style={{ width: "15%" }}
                  />
                </div>
              </div>

              <div className="bar-row">
                <div className="bar-top">
                  <span>Water Supply &amp; Drainage</span>
                  <span>11 Resolved • 10% (14)</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill bar-water"
                    style={{ width: "10%" }}
                  />
                </div>
              </div>
            </section>

            <section className="analytics-panel">
              <div className="analytics-panel-heading">
                <div>
                  <h2>SLA &amp; Resolution Turnaround</h2>
                  <p className="text-muted">
                    92% of civic issues closed within statutory time limit.
                  </p>
                </div>
                <span className="analytics-badge">Compliance: 92%</span>
              </div>

              <div className="sla-row">
                <div>
                  <strong>Resolved &lt;24 Hours</strong>
                  <p className="text-muted">Fast Track Redressal</p>
                </div>
                <strong>
                  68% <span className="sla-status">Ahead</span>
                </strong>
              </div>

              <div className="sla-row">
                <div>
                  <strong>Resolved 24–48 Hours</strong>
                  <p className="text-muted">Within Standard SLA</p>
                </div>
                <strong>
                  24% <span className="sla-status">On Target</span>
                </strong>
              </div>

              <div className="sla-row danger">
                <div>
                  <strong>Breached / Escalated (&gt;48 Hours)</strong>
                  <p className="text-muted">Requires zonal review</p>
                </div>
                <strong>
                  8% <span className="sla-status">Overdue</span>
                </strong>
              </div>
            </section>
          </div>
          <section className="analytics-panel analytics-operations">
            <div className="analytics-panel-heading">
              <div>
                <h2>Ward Operations &amp; Resource Utilization</h2>
                <p className="text-muted">
                  Live ward status and municipal resource allocation.
                </p>
              </div>
              <span className="analytics-badge">Live Ward Status</span>
            </div>

            <div className="bottom-grid">
              <div className="stat-tile">
                <span className="kpi-label">Active Field Squads</span>
                <h3>5 Units Deployed</h3>
                <p className="text-muted">Out of 8 total ward squads</p>
                <strong>3 On Standby</strong>
              </div>

              <div className="stat-tile">
                <span className="kpi-label">Equipment Utilization</span>
                <h3>82% In Field</h3>
                <p className="text-muted">Compactor, Jetting van, Roller</p>
                <strong>Optimal Allocation</strong>
              </div>

              <div className="stat-tile">
                <span className="kpi-label">Most Reported Locality</span>
                <h3>12th Main &amp; HAL 2nd Stg</h3>
                <p className="text-muted">38% of road complaints</p>
                <strong>Priority Inspection Zone</strong>
              </div>

              <div className="stat-tile">
                <span className="kpi-label">Peak Reporting Hours</span>
                <h3>08:30–11:00 AM</h3>
                <p className="text-muted">Morning commute surge</p>
                <strong>Dispatched Auto-Routing</strong>
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
