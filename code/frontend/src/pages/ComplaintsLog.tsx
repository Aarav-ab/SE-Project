import { useState } from "react";
import ComplaintTimelineModal from "./ComplaintTimelineModal";

const complaints = [
  {
    id: "GRV-2025-W14-8902",
    date: "Filed 24 Oct, 2025 (2 days ago)",
    category: "Roads & Infrastructure",
    title: "Pothole repair on 12th Main Road, Ward 14",
    location: "Near 80ft Road Junction, Hoysala Nagar, Indiranagar",
    status: "In Progress",
    statusHindi: "काम जारी है",
    step: 3,
    icon: "📋",
    progress:
      "On-site asphalt patching team deployed • Junior Engineer Er. Manoj Kumar on site",
    target: "Target completion: Today, 4:00 PM",
    highlight: true,
    resolved: false,
  },
  {
    id: "GRV-2025-W14-9140",
    date: "Filed Yesterday, 04:15 PM",
    category: "Solid Waste Management",
    title: "Overflowing Garbage Bin Near Community Park",
    location: "5th Cross, Indiranagar East, Ward 14",
    status: "Assigned to Sanitation Crew",
    step: 2,
    icon: "🚛",
    progress:
      "Assigned to Sanitary Inspector K. Ramesh • Compactor vehicle route #C-14 scheduled",
    target: "SLA Target: 24 hrs",
    highlight: false,
    resolved: false,
  },
  {
    id: "GRV-2025-W14-7812",
    date: "Filed 18 Oct, 2025 • Resolved 19 Oct, 2025",
    category: "Electrical & Streetlighting",
    title: "Flickering Streetlight Pole #SL-104",
    location: "80ft Road, Opposite SBI ATM, Ward 14",
    status: "Resolved & Closed / समाधान",
    step: 4,
    icon: "✓",
    progress:
      "LED luminaire fixture replaced with energy-saving 70W bulb. Verified via citizen OTP authentication.",
    target: "Resolved in 21 hrs",
    highlight: false,
    resolved: true,
  },
  {
    id: "GRV-2025-W14-6504",
    date: "Filed 10 Oct, 2025 • Resolved 12 Oct, 2025",
    category: "Stormwater & Drainage",
    title: "Blocked Stormwater Drain",
    location: "2nd Main Road, Near Post Office, Ward 14",
    status: "Resolved / समाधान",
    step: 4,
    icon: "✓",
    progress:
      "Complete de-silting and debris clearing of 45-meter drainage culvert executed prior to monsoon showers.",
    target: "Resolved in 38 hrs",
    highlight: false,
    resolved: true,
  },
];

type Filter = "All" | "In Progress" | "Resolved";

function ComplaintsLog({
  onBack,
  onFileComplaint,
  onViewComplaint,
  onSignOut,
}: {
  onBack: () => void;
  onFileComplaint: () => void;
  onViewComplaint: (complaintId: string) => void;
  onSignOut: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("All");
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(
    null,
  );
  const [category, setCategory] = useState("All Categories");

  const categories = [
    "All Categories",
    "Roads & Footpaths",
    "Solid Waste Management",
    "Streetlighting",
    "Stormwater & Drainage",
  ];

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesStatus =
      filter === "All" ||
      (filter === "In Progress" && !complaint.resolved) ||
      (filter === "Resolved" && complaint.resolved);

    const matchesCategory =
      category === "All Categories" ||
      (category === "Roads & Footpaths" &&
        complaint.category === "Roads & Infrastructure") ||
      complaint.category === category;

    return matchesStatus && matchesCategory;
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
              <span className="brand-tag complaint-ward-tag">WARD 14</span>
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
              <div className="user-avatar">RS</div>
              <div>
                <div className="user-name">Rajesh Sharma</div>
                <div className="user-role">Ward 14 Citizen</div>
              </div>
            </div>
            <button className="btn-signout" onClick={onSignOut}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main
        className="main-content"
        style={{ background: "var(--blue-50)", padding: "32px 24px" }}
      >
        <div className="page-head">
          <h1>My Complaints Log / मेरे दर्ज शिकायतें</h1>
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
                  ["All", "✓", "All Complaints", complaints.length],
                  [
                    "In Progress",
                    "🟠",
                    "Active / In Progress",
                    complaints.filter((c) => !c.resolved).length,
                  ],
                  [
                    "Resolved",
                    "🟢",
                    "Resolved",
                    complaints.filter((c) => c.resolved).length,
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

            <div className="chip-row">
              <span
                className="small text-muted"
                style={{
                  fontWeight: 700,
                  textTransform: "uppercase",
                  padding: "4px 0",
                }}
              >
                FILTER BY:
              </span>
              {categories.map((item) => (
                <button
                  key={item}
                  className={`chip ${category === item ? "active" : ""}`}
                  onClick={() => setCategory(item)}
                  aria-pressed={category === item}
                >
                  {item}
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
                    {complaint.statusHindi ? ` / ${complaint.statusHindi}` : ""}
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

                <div
                  className="cc-actions"
                  style={
                    complaint.resolved
                      ? { justifyContent: "space-between" }
                      : undefined
                  }
                >
                  {complaint.resolved && (
                    <span className="small text-body">
                      {complaint.id.endsWith("7812")
                        ? "★★★★★ (Rated 5/5 Stars by Citizen)"
                        : "🛡 Quality Audit Signed off by Zonal QC Inspector"}
                    </span>
                  )}

                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setSelectedComplaintId(complaint.id)}
                  >
                    🕒 View Timeline
                  </button>

                  {complaint.resolved && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() =>
                        window.alert(
                          "Receipt download will be available later.",
                        )
                      }
                    >
                      ⬇ Download Receipt
                    </button>
                  )}
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
      {selectedComplaintId && (
        <ComplaintTimelineModal
          complaintId={selectedComplaintId}
          onClose={() => setSelectedComplaintId(null)}
        />
      )}
    </div>
  );
}

export default ComplaintsLog;
