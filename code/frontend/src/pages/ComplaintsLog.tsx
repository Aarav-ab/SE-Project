import { useMemo, useState } from "react";
import { useComplaint, type SubmittedComplaint } from "../ComplaintContext";
import ComplaintTimelineModal from "./ComplaintTimelineModal";

type Filter = "All" | "In Progress" | "Resolved";

function ComplaintsLog({
  onBack,
  onFileComplaint,
  onSignOut,
}: {
  onBack: () => void;
  onFileComplaint: () => void;
  onSignOut: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("All");
  const [selectedComplaint, setSelectedComplaint] = useState<SubmittedComplaint | null>(null);
  const [category, setCategory] = useState("All Categories");
  const { submittedComplaints, user, openMyAccount } = useComplaint();

  const categories = useMemo(
    () => ["All Categories", ...new Set(submittedComplaints.map((item) => item.complaintType))],
    [submittedComplaints],
  );
  const filteredComplaints = submittedComplaints.filter((item) => {
    const matchesStatus = filter === "All" ||
      (filter === "In Progress" && item.status !== "Resolved") ||
      (filter === "Resolved" && item.status === "Resolved");
    return matchesStatus && (category === "All Categories" || item.complaintType === category);
  });
  const counts = {
    all: submittedComplaints.length,
    active: submittedComplaints.filter((item) => item.status !== "Resolved").length,
    resolved: submittedComplaints.filter((item) => item.status === "Resolved").length,
  };

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
              <span className="brand-tag complaint-ward-tag">WARD 14</span>
            </div>
          </div>
          <nav className="nav">
            <button onClick={onBack}>Citizen Hub</button>
            <button onClick={onFileComplaint}>File Complaint</button>
            <button className="active" aria-current="page">Track Complaint</button>
          </nav>
          <div className="header-right">
            <button type="button" className="user-chip profile-trigger" onClick={openMyAccount} aria-label="Open My Account">
              <div className="user-avatar">{user?.name.slice(0, 1).toUpperCase()}</div>
              <div><div className="user-name">{user?.name}</div><div className="user-role">Citizen</div></div>
            </button>
            <button className="btn-signout" onClick={onSignOut}>Sign Out</button>
          </div>
        </div>
      </header>

      <main className="main-content" style={{ background: "var(--blue-50)", padding: "32px 24px" }}>
        <div className="page-head">
          <h1>My Complaints / मेरे दर्ज शिकायतें</h1>
          <p className="text-body">Track complaint status and read department feedback.</p>
        </div>

        <div style={{ maxWidth: 896, margin: "0 auto" }}>
          <div className="card" style={{ padding: 33 }}>
            <div className="filter-tabs">
              {([
                ["All", "✓", "All Complaints", counts.all],
                ["In Progress", "🟠", "Active / In Progress", counts.active],
                ["Resolved", "🟢", "Resolved", counts.resolved],
              ] as const).map(([value, icon, label, count]) => (
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
            <div className="chip-row">
              <span className="small text-muted" style={{ fontWeight: 700 }}>FILTER BY:</span>
              {categories.map((item) => (
                <button key={item} className={`chip ${category === item ? "active" : ""}`} onClick={() => setCategory(item)} aria-pressed={category === item}>
                  {item}
                </button>
              ))}
            </div>

            {filteredComplaints.map((item) => (
              <article className="complaint-card" key={item.id}>
                <div className="cc-top">
                  <div>
                    <div className="cc-meta">
                      <span className="cc-id">#{item.id}</span>
                      <span className="text-body">🗓 {new Date(item.submittedAt).toLocaleString()}</span>
                    </div>
                    <span className="cc-cat">{item.complaintType}</span>
                    <h3 style={{ margin: "6px 0 4px", color: "var(--navy)" }}>{item.description}</h3>
                    <p className="small text-body" style={{ margin: 0 }}>📍 {item.address || item.ward}</p>
                  </div>
                  <span className={`pill ${item.status === "Resolved" ? "status-resolved" : "status-info"}`}>{item.status}</span>
                </div>
                <div className="progress-box">
                  <div>
                    <strong>{item.feedback ? "Department feedback" : "Department"}</strong>
                    <p className="small text-body" style={{ margin: "4px 0 0" }}>
                      {item.feedback || `${item.department} has received your complaint.`}
                    </p>
                  </div>
                  <span className="small text-body">Priority: {item.priority}</span>
                </div>
                <div className="cc-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => setSelectedComplaint(item)}>View Details</button>
                </div>
              </article>
            ))}

            {filteredComplaints.length === 0 && (
              <p className="text-muted">
                {submittedComplaints.length
                  ? "No complaints match the selected filters."
                  : "You have not submitted any complaints yet."}
              </p>
            )}

            <div className="cta-bar">
              <div>
                <strong style={{ color: "var(--navy)" }}>Have a new civic grievance to report?</strong>
                <p className="small text-body" style={{ margin: "2px 0 0" }}>Submit a complaint and follow its status here.</p>
              </div>
              <button className="btn btn-navy" onClick={onFileComplaint}>+ File New Grievance</button>
            </div>
          </div>
        </div>
      </main>
      <footer className="site-footer">
        <div className="container">
          <div className="footer-col">
            <div className="footer-brand"><div className="footer-mark">⌂</div><span className="footer-name">NagrikConnect</span></div>
            <p className="footer-desc">Smart City Civic Redressal Infrastructure</p>
          </div>
          <div className="footer-help"><h4>Emergency Helplines</h4><p>112 – National Emergency • 101 – Fire • 1916 – Water Supply (24/7)</p></div>
        </div>
      </footer>
      {selectedComplaint && (
        <ComplaintTimelineModal complaint={selectedComplaint} onClose={() => setSelectedComplaint(null)} />
      )}
    </div>
  );
}

export default ComplaintsLog;
