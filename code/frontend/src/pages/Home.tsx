function CitizenPortal() {
  return (
    <div className="page-wrap">
      {/* Header */}
      <header className="site-header">
        <div className="container">
          <div className="brand">
            <div className="brand-mark">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 21h18M4 21V8l8-5 8 5v13M9 21v-6h6v6" />
              </svg>
            </div>

            <div className="brand-text">
              <div className="brand-name-row">
                <span className="brand-name">NagrikConnect</span>

                <span
                  className="brand-tag"
                  style={{
                    background: "var(--amber-bg)",
                    borderColor: "transparent",
                    color: "#331100",
                  }}
                >
                  WARD 14
                </span>
              </div>
            </div>
          </div>

          <nav className="nav">
            <a href="#" className="active">
              Citizen Hub
            </a>

            <a href="#">File Complaint</a>

            <a href="#">Track Complaint</a>
          </nav>

          <div className="header-right">
            <div className="user-chip">
              <div className="user-avatar">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                </svg>
              </div>

              <div>
                <div className="user-name">Rajesh Sharma</div>

                <div className="user-role">Ward 14 Citizen</div>
              </div>
            </div>

            <a href="#" className="btn-signout">
              Sign Out
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="main-content citizen-main">
        <div className="container citizen-container">
          {/* Hero */}
          <div className="hero">
            <div>
              <div className="flex items-center gap-2">
                <span className="hero-badge">CITIZEN PORTAL ACTIVE</span>

                <span
                  className="small"
                  style={{
                    color: "var(--text-body)",
                    fontWeight: 700,
                  }}
                >
                  • Indiranagar, Bengaluru
                </span>
              </div>

              <h1>Welcome back, Rajesh! / स्वागत है</h1>

              <p className="text-body">
                Ward 14, Indiranagar • Citizen Civic Redressal Hub
              </p>
            </div>

            <div className="stat-strip">
              <div>
                <div className="num">1</div>
                <div className="lbl">In Progress</div>
              </div>

              <div>
                <div className="num">2</div>
                <div className="lbl">Resolved</div>
              </div>

              <div>
                <div className="num" style={{ color: "var(--amber)" }}>
                  100%
                </div>

                <div className="lbl">SLA Met</div>
              </div>
            </div>
          </div>

          {/* Main Actions */}
          <div className="action-cards">
            {/* File complaint */}
            <div className="card card-pad action-card">
              <div>
                <div className="flex justify-between items-center">
                  <div
                    className="action-icon"
                    style={{
                      background: "var(--navy)",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </div>

                  <span
                    className="badge"
                    style={{
                      background: "rgba(254,132,57,.2)",
                      color: "var(--amber)",
                    }}
                  >
                    Quick 3-Step
                  </span>
                </div>

                <h3
                  style={{
                    margin: "12px 0 4px",
                    color: "var(--navy)",
                  }}
                >
                  Report a New Grievance / नई शिकायत दर्ज करें
                </h3>

                <p className="text-body small">
                  File potholes, garbage, streetlights, or water issues with
                  photo upload and geo-tag in 3 simple steps.
                </p>
              </div>

              <a href="#" className="btn btn-navy btn-block mt-3">
                File Grievance →
              </a>
            </div>

            {/* Track complaints */}
            <div className="card card-pad action-card">
              <div>
                <div className="flex justify-between items-center">
                  <div
                    className="action-icon"
                    style={{
                      background: "var(--blue-200)",
                      color: "var(--navy)",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                    </svg>
                  </div>

                  <span
                    className="badge"
                    style={{
                      background: "var(--blue-100)",
                      color: "var(--text-body)",
                    }}
                  >
                    3 Total Grievances
                  </span>
                </div>

                <h3
                  style={{
                    margin: "12px 0 4px",
                    color: "var(--navy)",
                  }}
                >
                  Track Filed Complaints / मेरी शिकायतें
                </h3>

                <p className="text-body small">
                  Check live stage tracking, assigned field technicians,
                  contractor status, and verified resolution photos.
                </p>
              </div>

              <a href="#" className="btn btn-secondary btn-block mt-3">
                View Grievance Logs →
              </a>
            </div>
          </div>

          {/* Active Complaint */}
          <div className="card card-pad active-complaint">
            <div
              className="flex justify-between items-center"
              style={{
                borderBottom: "1px solid var(--border)",
                paddingBottom: "9px",
              }}
            >
              <div className="flex items-center gap-1">
                <span
                  className="small"
                  style={{
                    fontWeight: 700,
                    color: "var(--amber)",
                    letterSpacing: ".5px",
                    textTransform: "uppercase",
                  }}
                >
                  ACTIVE IN-PROGRESS COMPLAINT
                </span>

                <span
                  className="dot"
                  style={{
                    background: "#fe8439",
                  }}
                />
              </div>

              <span
                className="small"
                style={{
                  fontWeight: 700,
                  color: "var(--text-body)",
                }}
              >
                Registered on Oct 24, 2025 • Target SLA: 24h
              </span>
            </div>

            <div
              className="flex justify-between items-center mt-3"
              style={{
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <div className="flex gap-1" style={{ marginBottom: "2px" }}>
                  <span
                    className="badge"
                    style={{
                      background: "var(--blue-100)",
                      color: "var(--navy)",
                    }}
                  >
                    #GRV-2025-W14-8902
                  </span>

                  <span
                    className="badge"
                    style={{
                      background: "rgba(254,132,57,.2)",
                      color: "var(--amber)",
                    }}
                  >
                    Roads &amp; Infrastructure
                  </span>
                </div>

                <h3
                  style={{
                    margin: "0 0 2px",
                    color: "var(--navy)",
                  }}
                >
                  Pothole repair on 12th Main Road, Ward 14
                </h3>

                <p className="small text-body" style={{ margin: 0 }}>
                  Stage 3 of 4:{" "}
                  <strong>On-Site Asphalt Patching &amp; Levelling</strong> •
                  Assigned to Er. Manoj Kumar (Junior Engineer)
                </p>
              </div>

              <a href="#" className="btn btn-navy btn-sm">
                View Live Timeline →
              </a>
            </div>

            <div
              className="flex justify-between items-center mt-3"
              style={{
                background: "var(--blue-50)",
                borderRadius: "4px",
                padding: "8px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span className="small text-body">
                🚧 Field crew active at site with cold-mix asphalt equipment
              </span>

              <span
                className="small"
                style={{
                  fontWeight: 600,
                  color: "var(--navy)",
                }}
              >
                Expected completion: Today 4:00 PM
              </span>
            </div>
          </div>

          {/* Services */}
          <div style={{ marginBottom: "24px" }}>
            <div
              className="flex justify-between items-center mt-3"
              style={{ marginBottom: "12px" }}
            >
              <h2 className="section-title">Core Civic Services</h2>

              <span
                className="small"
                style={{
                  fontWeight: 700,
                  color: "var(--text-muted)",
                }}
              >
                Tap any category for immediate complaint dispatch
              </span>
            </div>

            <div className="services-grid">
              {[
                {
                  title: "Potholes & Road Repair",
                  description:
                    "Road craters, broken curb slabs, manhole leveling.",
                  sla: "24h",
                  icon: "road",
                },
                {
                  title: "Door-to-Door Waste Collection",
                  description:
                    "Missed garbage pickup, litter dumps, bulk disposal.",
                  sla: "2h",
                  icon: "waste",
                },
                {
                  title: "Streetlight Outage",
                  description:
                    "Flickering light, dark street zones, exposed wiring.",
                  sla: "8h",
                  icon: "light",
                },
                {
                  title: "Water Supply & Leakage",
                  description:
                    "Low pipeline pressure, dirty supply, tanker booking.",
                  sla: "4h",
                  icon: "water",
                },
              ].map((service) => (
                <a
                  href="#"
                  className="card card-pad"
                  style={{ padding: "13px" }}
                  key={service.title}
                >
                  <div className="service-icon">
                    {service.icon === "road" && (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 21l4-18" />
                        <path d="M19 21l-4-18" />
                        <path d="M12 4v3" />
                        <path d="M12 11v3" />
                        <path d="M12 18v2" />
                      </svg>
                    )}

                    {service.icon === "waste" && (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6l-1 15H6L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                      </svg>
                    )}

                    {service.icon === "light" && (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 18h6" />
                        <path d="M10 22h4" />
                        <path d="M12 2a7 7 0 0 0-4 12.7c.6.4 1 1.1 1 1.8V18h6v-1.5c0-.7.4-1.4 1-1.8A7 7 0 0 0 12 2z" />
                      </svg>
                    )}

                    {service.icon === "water" && (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 2s7 7.2 7 13a7 7 0 0 1-14 0c0-5.8 7-13 7-13z" />
                        <path d="M9 16c.5 1.2 1.5 2 3 2" />
                      </svg>
                    )}
                  </div>

                  <h4
                    style={{
                      margin: "0 0 2px",
                      color: "var(--navy)",
                      fontSize: "16px",
                    }}
                  >
                    {service.title}
                  </h4>

                  <p className="small text-body" style={{ margin: 0 }}>
                    {service.description}
                  </p>

                  <div
                    className="flex justify-between items-center mt-2"
                    style={{
                      borderTop: "1px solid var(--border)",
                      paddingTop: "5px",
                    }}
                  >
                    <span
                      className="small"
                      style={{
                        fontWeight: 700,
                        color: "var(--navy)",
                      }}
                    >
                      SLA: {service.sla}
                    </span>
                    →
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Bottom two columns */}
          <div className="two-col">
            {/* Schedule */}
            <div className="card card-pad">
              <div className="flex justify-between items-center">
                <h3
                  style={{
                    margin: 0,
                    color: "var(--navy)",
                  }}
                >
                  Ward 14 Today's Schedule
                </h3>

                <span className="small text-muted" style={{ fontWeight: 600 }}>
                  Thursday Schedule
                </span>
              </div>

              <div className="mt-3">
                <div className="schedule-item">
                  <span>🚛</span>

                  <div>
                    <strong
                      style={{
                        fontSize: "12px",
                        color: "var(--navy)",
                      }}
                    >
                      Morning Waste Collection (Van #12)
                    </strong>

                    <p
                      className="small text-body"
                      style={{ margin: "2px 0 0" }}
                    >
                      Wet &amp; dry segregation collection completed at 8:15 AM
                      across Sector 2 &amp; 3.
                    </p>
                  </div>
                </div>

                <div className="schedule-item">
                  <span>⚠️</span>

                  <div>
                    <strong
                      style={{
                        fontSize: "12px",
                        color: "var(--navy)",
                      }}
                    >
                      Scheduled Pipeline Maintenance
                    </strong>

                    <p
                      className="small text-body"
                      style={{ margin: "2px 0 0" }}
                    >
                      Pipeline interconnection scheduled 10:00 AM – 02:00 PM
                      today in Sector 4 (Blocks C &amp; D).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Helplines */}
            <div className="card card-pad">
              <div className="flex justify-between items-center">
                <h3
                  style={{
                    margin: 0,
                    color: "var(--navy)",
                  }}
                >
                  Quick Help &amp; Ward Helplines
                </h3>

                <span className="small text-muted" style={{ fontWeight: 600 }}>
                  Dedicated Contacts
                </span>
              </div>

              <div className="helpline-grid mt-3">
                <div className="helpline-item">
                  <div className="small text-body" style={{ fontWeight: 700 }}>
                    Ward 14 Helpdesk
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      color: "var(--navy)",
                    }}
                  >
                    1800-425-0014
                  </div>

                  <div className="small text-muted">Mon–Sat (9 AM – 6 PM)</div>
                </div>

                <div className="helpline-item">
                  <div className="small text-body" style={{ fontWeight: 700 }}>
                    Central Emergency
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      color: "var(--red)",
                    }}
                  >
                    112
                  </div>

                  <div className="small text-muted">
                    24/7 Police / Fire / Medical
                  </div>
                </div>

                <div className="helpline-item">
                  <div className="small text-body" style={{ fontWeight: 700 }}>
                    Water Board (BWSSB)
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      color: "var(--navy)",
                    }}
                  >
                    1916
                  </div>

                  <div className="small text-muted">
                    24/7 Contamination &amp; Tankers
                  </div>
                </div>

                <div className="helpline-item">
                  <div className="small text-body" style={{ fontWeight: 700 }}>
                    Women Safety Cell
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      color: "var(--amber)",
                    }}
                  >
                    1090
                  </div>

                  <div className="small text-muted">
                    Rapid Action Transit Safety
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
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
              112 – National Emergency • 101 – Fire • 1916 – Water Supply (24/7)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default CitizenPortal;
