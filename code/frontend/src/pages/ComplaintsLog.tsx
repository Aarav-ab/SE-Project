import { useState, useRef, useEffect } from "react";
import ComplaintTimelineModal from "./ComplaintTimelineModal";
import ChangePasswordModal from "./ChangePasswordModal";
import { useComplaint } from "../ComplaintContext";
import { getCurrentUser } from "../api";

type Filter = "All" | "In Progress" | "Resolved";

function ComplaintsLog({
  onBack,
  onFileComplaint,
  onViewComplaint: _onViewComplaint,
  onSignOut,
}: {
  onBack: () => void;
  onFileComplaint: () => void;
  onViewComplaint?: (complaintId: string) => void;
  onSignOut: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("All");
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(
    null,
  );
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
  const {
    allComplaints: contextComplaints,
    totalCount,
    inProgressCount,
    resolvedCount,
    removeComplaint,
  } = useComplaint();

  const currentUser = getCurrentUser();
  const userName = currentUser?.name || "Rajesh Sharma";
  const initials =
    userName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "RS";
  const userLocationTag = currentUser?.city ? currentUser.city.toUpperCase() : "WARD 14";
  const userRoleDisplay = currentUser?.city ? `${currentUser.city} Citizen` : "Ward 14 Citizen";

  async function handleDeleteComplaint(id: string) {
    const confirmed = window.confirm(
      `Are you sure you want to delete complaint #${id}? This action cannot be undone.`
    );
    if (!confirmed) return;
    await removeComplaint(id);
  }

  const allComplaints = contextComplaints.map((item) => {
    const categoryMap: Record<string, string> = {
      "Pothole / Road": "Roads & Infrastructure",
      Streetlight: "Electrical & Streetlighting",
      Garbage: "Solid Waste Management",
      "Garbage / Waste": "Solid Waste Management",
      "Water Supply": "Water Supply & Drainage",
      Drainage: "Stormwater & Drainage",
    };

    const isResolved =
      item.status === "Resolved" ||
      item.status === "Closed" ||
      item.status?.toLowerCase().includes("resolve") ||
      Boolean(item.resolved);

    const isInProgress =
      !isResolved &&
      (item.status === "In Progress" ||
        item.status?.toLowerCase().includes("progress") ||
        item.step === 3 ||
        item.progress?.toLowerCase().includes("dispatch") ||
        item.progress?.toLowerCase().includes("on-site") ||
        item.progress?.toLowerCase().includes("repair"));

    const isAssigned =
      !isResolved &&
      !isInProgress &&
      (Boolean(item.assignedWorker) ||
        item.status === "Assigned" ||
        item.status?.toLowerCase().includes("assign") ||
        item.step === 2);

    const step = isResolved
      ? 4
      : isInProgress
      ? 3
      : isAssigned
      ? 2
      : item.step && item.step >= 1 && item.step <= 4
      ? item.step
      : 1;

    const displayStatus = isResolved
      ? "Resolved & Closed"
      : step === 3
      ? "In Progress"
      : step === 2
      ? "Assigned to Field Crew"
      : item.status || "Pending Dispatch";

    const icon = isResolved ? "✓" : step === 3 ? "🛠" : step === 2 ? "🚛" : "📋";

    let progress = item.progress;
    if (!progress) {
      if (isResolved) {
        progress =
          "Work completed and verified on site. Verified via municipal site inspection.";
      } else if (step === 3) {
        progress = item.assignedWorker
          ? `On-site crew deployed • ${item.assignedWorker} on site.`
          : "On-site remediation currently in progress.";
      } else if (step === 2) {
        progress = `Assigned to ${
          item.assignedWorker || "Field Crew"
        } • Site inspection scheduled.`;
      } else {
        progress = `Complaint received by ${item.department}. Awaiting crew assignment.`;
      }
    }

    const target = isResolved
      ? "Resolved & Closed"
      : step === 3
      ? "Target completion: Today"
      : item.priority === "Urgent"
      ? "SLA Target: 24 hrs"
      : "SLA Target: 48 hrs";

    return {
      id: item.id,
      date: item.submittedAt
        ? `Filed ${new Date(item.submittedAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}`
        : "Recently Filed",
      category: categoryMap[item.complaintType] ?? item.complaintType,
      title: item.description,
      location: item.address || item.ward,
      status: displayStatus,
      step,
      icon,
      progress,
      target,
      highlight: step === 3,
      resolved: isResolved,
      assignedWorker: item.assignedWorker,
    };
  });

  const filteredComplaints = allComplaints.filter((complaint) => {
    return (
      filter === "All" ||
      (filter === "In Progress" && !complaint.resolved) ||
      (filter === "Resolved" && complaint.resolved)
    );
  });

  return (
    <div className="page-wrap">
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
                aria-hidden="true"
              >
                <path d="M3 21h18M4 21V8l8-5 8 5v13M9 21v-6h6v6" />
              </svg>
            </div>
            <div className="brand-name-row">
              <span className="brand-name">NagrikConnect</span>
              <span className="brand-tag complaint-ward-tag">{userLocationTag}</span>
            </div>
          </div>

          <nav className="nav">
            <button onClick={onBack}>Citizen Hub</button>
            <button onClick={onFileComplaint}>File Complaint</button>
            <button className="active" aria-current="page">
              Track Complaint
            </button>
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

      <main
        className="main-content"
        style={{ background: "var(--blue-50)", padding: "32px 24px" }}
      >
        <div className="page-head">
          <h1>My Complaints Log</h1>
          <p className="text-body">
            Track, review, and follow up on all your active and past resolved
            civic complaints
          </p>
        </div>

        <div style={{ maxWidth: 896, margin: "0 auto" }}>
          <div className="card" style={{ padding: 33 }}>
            <div className="filter-tabs">
              {(
                [
                  ["All", "✓", "All Complaints", totalCount],
                  [
                    "In Progress",
                    "🟠",
                    "Active / In Progress",
                    inProgressCount,
                  ],
                  [
                    "Resolved",
                    "🟢",
                    "Resolved",
                    resolvedCount,
                  ],
                ] as const
              ).map(([value, icon, label, count]) => (
                <button
                  key={value}
                  className={`filter-tab ${filter === value ? "active" : ""}`}
                  onClick={() => setFilter(value)}
                  aria-pressed={filter === value}
                >
                  {icon} {label} ({count})
                </button>
              ))}
            </div>

            {filteredComplaints.map((complaint) => (
              <article
                className={`complaint-card ${
                  complaint.highlight ? "highlight" : ""
                }`}
                key={complaint.id}
              >
                <div className="cc-top">
                  <div>
                    <div className="cc-meta">
                      <span className="cc-id">#{complaint.id}</span>
                      <span className="text-body">🗓 {complaint.date}</span>
                    </div>

                    <span className="cc-cat">{complaint.category}</span>
                    <h3
                      style={{
                        margin: "6px 0 4px",
                        color: "var(--navy)",
                      }}
                    >
                      {complaint.title}
                    </h3>
                    <p className="small text-body" style={{ margin: 0 }}>
                      📍 {complaint.location}
                    </p>
                  </div>

                  <span
                    className={`pill ${
                      complaint.resolved
                        ? "status-resolved"
                        : complaint.highlight
                          ? "status-progress"
                          : "status-info"
                    }`}
                    style={{ boxShadow: "var(--shadow-sm)" }}
                  >
                    {complaint.resolved ? "✓ " : "● "}
                    {complaint.status}
                  </span>
                </div>

                <div className="progress-box">
                  <div className="flex gap-2 items-center">
                    <div
                      className="progress-badge"
                      style={{
                        background: complaint.resolved
                          ? "#61b15f"
                          : complaint.highlight
                            ? "#fe8439"
                            : "var(--navy-light)",
                      }}
                    >
                      {complaint.icon}
                    </div>
                    <div>
                      <div
                        className="small"
                        style={{
                          fontWeight: 700,
                          color: complaint.resolved
                            ? "#61b15f"
                            : complaint.highlight
                              ? "var(--amber)"
                              : "var(--navy)",
                          textTransform: "uppercase",
                        }}
                      >
                        {complaint.resolved
                          ? "REDRESSAL SUMMARY"
                          : `RESOLUTION PROGRESS: STEP ${complaint.step} OF 4`}
                      </div>
                      <div className="small" style={{ fontWeight: 600 }}>
                        {complaint.progress}
                      </div>
                    </div>
                  </div>

                  <span className="small text-body" style={{ fontWeight: 600 }}>
                    {complaint.target}
                  </span>
                </div>

                <div className="cc-actions">
                  {complaint.resolved ? (
                    <span className="small text-body">
                      {complaint.id.endsWith("7812")
                        ? "★★★★★ (Rated 5/5 Stars by Citizen)"
                        : "🛡 Quality Audit Signed off by Zonal QC Inspector"}
                    </span>
                  ) : (
                    <span />
                  )}

                  <div className="cc-actions-right">
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setSelectedComplaintId(complaint.id)}
                    >
                      🕒 View Timeline
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        color: "#ba1a1a",
                        border: "1px solid rgba(186, 26, 26, 0.35)",
                        background: "rgba(186, 26, 26, 0.05)",
                        padding: "6px 12px",
                        borderRadius: 6,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                      title="Delete this complaint"
                      onClick={() => handleDeleteComplaint(complaint.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {filteredComplaints.length === 0 && (
              <p className="text-muted">
                No complaints match the selected filters.
              </p>
            )}

            <div className="cta-bar">
              <div className="flex gap-3 items-center">
                <div
                  className="progress-badge"
                  style={{
                    background: "var(--navy-light)",
                    width: 40,
                    height: 40,
                  }}
                >
                  📢
                </div>
                <div>
                  <strong style={{ color: "var(--navy)" }}>
                    Have a new civic grievance to report?
                  </strong>
                  <p className="small text-body" style={{ margin: "2px 0 0" }}>
                    Submit photos, geo-location, and get automated SMS updates
                    with SLA tracking.
                  </p>
                </div>
              </div>
              <button className="btn btn-navy" onClick={onFileComplaint}>
                + File New Grievance
              </button>
            </div>
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
                  aria-hidden="true"
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
      {selectedComplaintId && (() => {
        const selected = allComplaints.find((c) => c.id === selectedComplaintId);
        return (
          <ComplaintTimelineModal
            complaintId={selectedComplaintId}
            currentStep={selected?.step}
            complaintData={selected}
            onClose={() => setSelectedComplaintId(null)}
          />
        );
      })()}

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
}

export default ComplaintsLog;
