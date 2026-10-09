import { useComplaint } from "../ComplaintContext";
import { useState } from "react";

const complaintTypes = [
  { name: "Pothole / Road", hindi: "सड़क के गड्ढे", icon: "🕳️" },
  { name: "Garbage / Waste", hindi: "कचरा निपटान", icon: "🗑️" },
  { name: "Streetlight", hindi: "स्ट्रीट लाइट", icon: "💡" },
  { name: "Drainage / Water", hindi: "जल निकासी", icon: "💧" },
];

const priorities = [
  { name: "Low", description: "Resolution within 72 hrs" },
  { name: "Medium", description: "Resolution within 48 hrs" },
  { name: "Urgent", description: "Resolution within 24 hrs" },
];

function ComplaintStep3({ onBack }: { onBack: () => void }) {
  const { complaint, updateComplaint } = useComplaint();

  const complaintType = complaint.complaintType;
  const description = complaint.description;
  const priority = complaint.priority;

  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [demoComplaintId, setDemoComplaintId] = useState("");

  function handleSubmit() {
    if (!description.trim()) {
      setError("Please enter a description of the complaint.");
      return;
    }

    setError("");

    const temporaryId = `NC-DEMO-${Date.now().toString().slice(-6)}`;
    setDemoComplaintId(temporaryId);
    setSubmitted(true);
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

            <h2 id="confirmation-title">Complaint Submitted!</h2>

            <p className="text-body">
              Your complaint has been recorded in this demo. Backend submission
              will be connected when the API is ready.
            </p>

            <div className="confirmation-details">
              <div className="confirmation-id">
                <span>Temporary Complaint Reference</span>
                <strong>{demoComplaintId}</strong>
                <small>Demo ID — not yet registered with the backend</small>
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
              }}
            >
              Return to Complaint
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
              <span className="brand-tag">WARD 14</span>
            </div>
          </div>

          <nav className="nav">
            <a href="/citizen-portal">Citizen Hub</a>
            <a href="/complaint-step1" className="active">
              File Complaint
            </a>
            <a href="/complaints-log">Track Complaint</a>
          </nav>

          <div className="header-right">
            <div className="user-chip">
              <div className="user-avatar">RS</div>
              <div>
                <div className="user-name">Rajesh Sharma</div>
                <div className="user-role">Ward 14 Citizen</div>
              </div>
            </div>
            <button
              type="button"
              className="btn-signout"
              onClick={() => alert("Sign out will be connected later.")}
            >
              Sign Out
            </button>
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
              File a Complaint{" "}
              <span
                style={{
                  fontWeight: 400,
                  fontSize: 20,
                  color: "var(--text-body)",
                }}
              >
                / शिकायत दर्ज करें
              </span>
            </h1>
            <p className="text-body mt-1" style={{ marginBottom: 16 }}>
              Step 3 of 3: Confirm Complaint Type, Description &amp; Final
              Submission
            </p>

            <section className="mt-4">
              <h3 style={{ margin: "0 0 12px", color: "var(--navy)" }}>
                Choose Type of Complaint{" "}
                <span className="small text-body" style={{ fontWeight: 400 }}>
                  / समस्या का प्रकार
                </span>
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
                    <span className="t-hindi">{type.hindi}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-4">
              <div className="flex justify-between items-center">
                <h3 style={{ margin: 0, color: "var(--navy)" }}>
                  Grievance Description{" "}
                  <span className="small text-body" style={{ fontWeight: 400 }}>
                    / शिकायत का विवरण
                  </span>
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
              <label>Priority &amp; Urgency Level / प्राथमिकता</label>
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
              >
                Submit Complaint / शिकायत दर्ज करें
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
    </div>
  );
}

export default ComplaintStep3;
