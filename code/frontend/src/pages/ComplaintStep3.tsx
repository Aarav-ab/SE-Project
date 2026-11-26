import { useComplaint } from "../ComplaintContext";
import { useState, useRef, useEffect } from "react";
import { getCurrentUser } from "../api";
import ChangePasswordModal from "./ChangePasswordModal";

const complaintTypes = [
  { name: "Pothole / Road", icon: "🕳️" },
  { name: "Garbage / Waste", icon: "🗑️" },
  { name: "Streetlight", icon: "💡" },
  { name: "Drainage / Water", icon: "💧" },
];

const priorities = [
  { name: "Low", description: "Resolution within 72 hrs" },
  { name: "Medium", description: "Resolution within 48 hrs" },
  { name: "Urgent", description: "Resolution within 24 hrs" },
];

function ComplaintStep3({
  onBack,
  onCancel,
  onGoToStep1,
  onTrackComplaints,
  onSignOut,
}: {
  onBack: () => void;
  onCancel: () => void;
  onGoToStep1: () => void;
  onTrackComplaints: () => void;
  onSignOut: () => void;
}) {
  const {
    complaint,
    updateComplaint,
    addSubmittedComplaint,
    refreshComplaints,
  } = useComplaint();
  const complaintType = complaint.complaintType;
  const description = complaint.description;
  const priority = complaint.priority;

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

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [registeredId, setRegisteredId] = useState("");

  async function handleSubmit() {
    if (!description.trim()) {
      setError("Please enter a description of the complaint.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const newId = await addSubmittedComplaint({
        ...complaint,
        description: description.trim(),
        complaintType,
        priority,
      });

      setRegisteredId(newId);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Failed to submit complaint to server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-wrap">
      {submitted && (
        <div className="confirmation-overlay" role="presentation">
          <section
            className="confirmation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
          >
            <div className="confirmation-icon">✓</div>

            <h2 id="confirmation-title">Complaint Submitted Successfully!</h2>

            <p className="text-body">
              Your civic complaint has been registered with the NagrikConnect backend.
              A dispatch notification has been routed to the relevant municipal department.
            </p>

            <div className="confirmation-details">
              <div className="confirmation-id">
                <span>Official Complaint Reference Number</span>
                <strong>{registeredId}</strong>
                <small style={{ color: "var(--navy)", fontWeight: 600 }}>
                  ✓ Live Grievance ID registered in Municipal Database
                </small>
              </div>
              <div>
                <span>Complaint category</span>
                <strong>{complaintType}</strong>
              </div>

              <div>
                <span>Priority</span>
                <strong>{priority}</strong>
              </div>
              <div>
                <span>Reported location</span>
                <strong>{complaint.address || "Address not provided"}</strong>
                <p>PIN code: {complaint.pinCode || "Not provided"}</p>

                {complaint.landmark && <p>Landmark: {complaint.landmark}</p>}
              </div>

              <div>
                <span>Evidence attached</span>
                <strong>{complaint.files.length} file(s)</strong>
                <p>
                  {complaint.files.length > 0
                    ? complaint.files.map((file) => file.name).join(", ")
                    : "No evidence attached"}
                </p>
              </div>

              {complaint.latitude !== null && complaint.longitude !== null && (
                <div>
                  <span>Selected coordinates</span>
                  <strong>
                    {complaint.latitude.toFixed(5)},{" "}
                    {complaint.longitude.toFixed(5)}
                  </strong>
                </div>
              )}

              <div>
                <span>Description</span>
                <p>{description}</p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-navy"
              onClick={() => {
                setSubmitted(false);
                updateComplaint({
                  files: [],
                  address: "",
                  pinCode: "",
                  landmark: "",
                  latitude: null,
                  longitude: null,
                  description: "",
                  priority: "Medium",
                });
                refreshComplaints();
                onTrackComplaints();
              }}
            >
              Track Complaint →
            </button>
          </section>
        </div>
      )}

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
            <div className="brand-name-row">
              <span className="brand-name">NagrikConnect</span>
              <span className="brand-tag">{userLocationTag}</span>
            </div>
          </div>

          <nav className="nav">
            <button type="button" onClick={onCancel}>
              Citizen Hub
            </button>

            <button type="button" onClick={onGoToStep1}>
              File Complaint
            </button>

            <button type="button" onClick={onTrackComplaints}>
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
        <div style={{ maxWidth: 896, margin: "0 auto" }}>
          <div className="card" style={{ padding: 48 }}>
            <div className="stepper">
              <div className="step">
                <div className="step-circle">✓</div>
                <div className="step-label">Step 1</div>
                <div className="step-sub">Upload Media</div>
              </div>
              <div className="step">
                <div className="step-circle">✓</div>
                <div className="step-label">Step 2</div>
                <div className="step-sub">Location &amp; Ward</div>
              </div>
              <div className="step active">
                <div className="step-circle">3</div>
                <div className="step-label">Step 3</div>
                <div className="step-sub">Type &amp; Description</div>
              </div>
            </div>

            <h1 style={{ margin: 0, fontSize: 32, color: "var(--navy)" }}>
              File a Complaint
            </h1>
            <p className="text-body mt-1" style={{ marginBottom: 16 }}>
              Step 3 of 3: Confirm Complaint Type, Description &amp; Final
              Submission
            </p>

            <section className="mt-4">
              <h3 style={{ margin: "0 0 12px", color: "var(--navy)" }}>
                Choose Type of Complaint
              </h3>

              <div className="type-grid">
                {complaintTypes.map((type) => (
                  <button
                    type="button"
                    key={type.name}
                    className={`type-btn ${complaintType === type.name ? "selected" : ""}`}
                    onClick={() =>
                      updateComplaint({ complaintType: type.name })
                    }
                    aria-pressed={complaintType === type.name}
                  >
                    <span>{type.icon}</span>
                    {complaintType === type.name && <span> ✓</span>}
                    <span className="t-name">{type.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-4">
              <div className="flex justify-between items-center">
                <h3 style={{ margin: 0, color: "var(--navy)" }}>
                  Grievance Description
                </h3>
                <span className="small text-muted" style={{ fontWeight: 700 }}>
                  Complaint details
                </span>
              </div>

              <textarea
                className="mt-2"
                rows={4}
                value={description}
                onChange={(event) => {
                  updateComplaint({ description: event.target.value });
                  setError("");
                }}
                placeholder="Describe the problem, its exact circumstances, and its impact..."
                maxLength={1000}
                aria-label="Grievance description"
              />
              <p
                className="small text-muted"
                style={{ textAlign: "right", margin: "4px 0 0" }}
              >
                {description.length}/1000 characters
              </p>
            </section>

            <section className="mt-4">
              <label>Priority &amp; Urgency Level</label>
              <div className="priority-grid">
                {priorities.map((option) => (
                  <button
                    type="button"
                    key={option.name}
                    className={`priority-opt ${priority === option.name ? "selected" : ""}`}
                    onClick={() => updateComplaint({ priority: option.name })}
                    aria-pressed={priority === option.name}
                  >
                    <span className="radio-dot" />
                    <span>
                      <strong>
                        {option.name === "Urgent"
                          ? "Urgent"
                          : `${option.name} Priority`}
                      </strong>
                      <p className="small text-body" style={{ margin: 0 }}>
                        {option.description}
                      </p>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {error && (
              <p className="complaint-error" role="alert">
                {error}
              </p>
            )}

            <div
              className="flex justify-between items-center mt-4"
              style={{ gap: 12, flexWrap: "wrap" }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onBack}
              >
                ← Back to Step 2
              </button>

              <button
                type="button"
                className="btn btn-navy"
                style={{ padding: "12px 32px" }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting to Backend..." : "Submit Complaint"}
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div>
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

export default ComplaintStep3;
