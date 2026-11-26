import { useState, useRef, useEffect } from "react";
import { useComplaint } from "../ComplaintContext";
import { getCurrentUser } from "../api";
import ChangePasswordModal from "./ChangePasswordModal";

function CitizenPortal({
  onFileComplaint,
  onGoHome,
  onTrackComplaints,
  onSignOut,
}: {
  onFileComplaint: () => void;
  onGoHome: () => void;
  onTrackComplaints: () => void;
  onSignOut: () => void;
}) {
  const { totalCount, inProgressCount, resolvedCount, updateComplaint } =
    useComplaint();

  const currentUser = getCurrentUser();
  const userName = currentUser?.name || "Rajesh Sharma";
  const firstName = userName.split(" ")[0] || "Rajesh";
  const initials =
    userName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "RS";

  const userCity = currentUser?.city || "Bengaluru";
  const userState = currentUser?.state || "Karnataka";
  const userLocationTag = currentUser?.city ? currentUser.city.toUpperCase() : "WARD 14";
  const userRoleDisplay = currentUser?.city ? `${currentUser.city} Citizen` : "Ward 14 Citizen";

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setSettingsOpen(false);
      }
    }
    if (settingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [settingsOpen]);

  function handleCategorySelect(complaintType: string) {
    updateComplaint({ complaintType });
    onFileComplaint();
  }
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
                  {userLocationTag}
                </span>
              </div>
            </div>
          </div>

          <nav className="nav">
            <a
              href="#"
              className="active"
              onClick={(event) => {
                event.preventDefault();
                onGoHome();
              }}
            >
              Citizen Hub
            </a>

            <a
              href="#"
              onClick={(event) => {
                event.preventDefault();
                onFileComplaint();
              }}
            >
              File Complaint
            </a>

            <a
              href="#"
              onClick={(event) => {
                event.preventDefault();
                onTrackComplaints();
              }}
            >
              Track Complaint
            </a>
          </nav>
          <div className="header-right">
            <div className="user-chip">
              <div className="user-avatar">{initials}</div>
              <div>
                <div className="user-name">{userName}</div>

                <div className="user-role">{userRoleDisplay}</div>
              </div>
            </div>

            {/* Settings Dialog Menu Button */}
            <div style={{ position: "relative" }} ref={settingsRef}>
              <button
                type="button"
                className="btn-settings"
                title="Account Settings"
                aria-label="Settings"
                onClick={() => setSettingsOpen((prev) => !prev)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: settingsOpen ? "var(--blue-100)" : "#ffffff",
                  color: "var(--navy)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  padding: 0,
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>

              {settingsOpen && (
                <div
                  className="settings-dialog-popup"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: "210px",
                    background: "#ffffff",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    boxShadow: "0 10px 25px rgba(0, 32, 69, 0.14)",
                    padding: "6px",
                    zIndex: 1000,
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      padding: "8px 10px 6px",
                      borderBottom: "1px solid var(--border-soft)",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Settings
                  </div>

                  {/* Option 1: Change Password */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false);
                      setShowChangePassword(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      width: "100%",
                      textAlign: "left",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--navy)",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--blue-50)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <span style={{ fontSize: "16px" }}>🔑</span>
                    <span>Change Password</span>
                  </button>

                  {/* Option 2: Sign Out */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false);
                      onSignOut();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      width: "100%",
                      textAlign: "left",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#ba1a1a",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#fff0f0")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <span style={{ fontSize: "16px" }}>🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

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
                  • {userCity}, {userState}
                </span>
              </div>
              <h1>Welcome back, {firstName}!</h1>
              <p className="text-body">
                {userCity}, {userState} • Citizen Civic Redressal Hub
              </p>
            </div>
            <div className="stat-strip">
              <div>
                <div className="num">{inProgressCount}</div>
                <div className="lbl">In Progress</div>
              </div>
              <div>
                <div className="num">{resolvedCount}</div>
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
          <div className="action-cards">
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
                  Report a New Grievance
                </h3>

                <p className="text-body small">
                  File potholes, garbage, streetlights, or water issues with
                  photo upload and geo-tag in 3 simple steps.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-navy btn-block mt-3"
                onClick={onFileComplaint}
              >
                File Grievance →
              </button>
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
                    {totalCount} Total Grievances
                  </span>
                </div>

                <h3
                  style={{
                    margin: "12px 0 4px",
                    color: "var(--navy)",
                  }}
                >
                  Track Filed Complaints
                </h3>

                <p className="text-body small">
                  Check live stage tracking, assigned field technicians,
                  contractor status, and verified resolution photos.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-block mt-3"
                onClick={onTrackComplaints}
              >
                View Grievance Logs →
              </button>
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
                  categoryType: "Pothole / Road",
                  description:
                    "Road craters, broken curb slabs, manhole leveling.",
                  sla: "24h",
                  icon: "road",
                },
                {
                  title: "Door-to-Door Waste Collection",
                  categoryType: "Garbage / Waste",
                  description:
                    "Missed garbage pickup, litter dumps, bulk disposal.",
                  sla: "2h",
                  icon: "waste",
                },
                {
                  title: "Streetlight Outage",
                  categoryType: "Streetlight",
                  description:
                    "Flickering light, dark street zones, exposed wiring.",
                  sla: "8h",
                  icon: "light",
                },
                {
                  title: "Water Supply & Leakage",
                  categoryType: "Drainage / Water",
                  description:
                    "Low pipeline pressure, dirty supply, tanker booking.",
                  sla: "4h",
                  icon: "water",
                },
              ].map((service) => (
                <div
                  role="button"
                  tabIndex={0}
                  className="card card-pad"
                  style={{
                    padding: "13px",
                    cursor: "pointer",
                    textDecoration: "none",
                  }}
                  key={service.title}
                  onClick={() => handleCategorySelect(service.categoryType)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCategorySelect(service.categoryType);
                    }
                  }}
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
                    <button
                      type="button"
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--navy)",
                        fontWeight: 700,
                        fontSize: 18,
                        cursor: "pointer",
                        padding: 0,
                        lineHeight: 1,
                      }}
                      title={`Report ${service.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCategorySelect(service.categoryType);
                      }}
                    >
                      →
                    </button>
                  </div>
                </div>
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
                  {userCity} Today's Schedule
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
                    {userCity} Helpdesk
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

      {/* Change Password Dialog Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
}

export default CitizenPortal;
