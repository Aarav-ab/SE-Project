import { useState, useEffect } from "react";
import { fetchComplaintById, type ApiCitizenSummary } from "../api";

type Complaint = {
  id: string;
  category: string;
  age: string;
  title: string;
  location: string;
  assigned: string;
  status: string;
  icon: string;
  citizen?: ApiCitizenSummary | null;
};

type DepartmentComplaintModalProps = {
  complaint: Complaint;
  onClose: () => void;
  onResolve?: (complaintId: string, comment?: string) => Promise<void>;
};

function DepartmentComplaintModal({
  complaint,
  onClose,
  onResolve,
}: DepartmentComplaintModalProps) {
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");
  const [fetchedCitizen, setFetchedCitizen] = useState<{
    complaintId: string;
    user: ApiCitizenSummary;
  } | null>(null);

  useEffect(() => {
    if (!complaint.citizen && complaint.id) {
      let mounted = true;
      fetchComplaintById(complaint.id).then((data) => {
        if (mounted && data?.user) {
          setFetchedCitizen({ complaintId: complaint.id, user: data.user });
        }
      });
      return () => {
        mounted = false;
      };
    }
  }, [complaint.id, complaint.citizen]);

  const citizen =
    complaint.citizen ||
    (fetchedCitizen?.complaintId === complaint.id ? fetchedCitizen.user : null);

  const isResolved =
    complaint.status === "Resolved" || complaint.status === "Closed";
  const isInProgress =
    !isResolved &&
    (complaint.status === "In Progress" || complaint.status === "Assigned");

  const statusColors = isResolved
    ? { background: "#dcfce7", color: "#166534" }
    : isInProgress
    ? { background: "#fef3c7", color: "#b45309" }
    : { background: "#ffdad6", color: "#ba1a1a" };

  async function handleMarkResolved() {
    if (!onResolve) return;
    setError("");
    setResolving(true);
    try {
      await onResolve(
        complaint.id,
        resolutionNote.trim() ||
          "Work completed and verified by Municipal Administrator."
      );
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark complaint as resolved."
      );
    } finally {
      setResolving(false);
    }
  }

  return (
    <div
      className="confirmation-overlay department-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="confirmation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="department-complaint-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="timeline-header">
          <div>
            <span className="small text-muted">
              DEPARTMENT COMPLAINT DETAILS
            </span>
            <h2 id="department-complaint-title" style={{ margin: "8px 0" }}>
              {complaint.title}
            </h2>
            <code>#{complaint.id}</code>
          </div>

          <button
            type="button"
            className="timeline-close"
            onClick={onClose}
            aria-label="Close complaint details"
          >
            ×
          </button>
        </div>

        <div className="timeline-body">
          <div className="grid grid-2" style={{ gap: 12 }}>
            <div className="department-detail-item">
              <span className="small text-muted">CATEGORY</span>
              <p>
                <strong>{complaint.category}</strong>
              </p>
            </div>

            <div className="department-detail-item">
              <span className="small text-muted">CURRENT STATUS</span>
              <p>
                <span
                  className="pill"
                  style={{
                    ...statusColors,
                    display: "inline-block",
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {complaint.status}
                </span>
              </p>
            </div>

            <div className="department-detail-item">
              <span className="small text-muted">LOCATION</span>
              <p>📍 {complaint.location}</p>
            </div>

            <div className="department-detail-item">
              <span className="small text-muted">ASSIGNED OFFICER / CREW</span>
              <p>
                <strong>{complaint.assigned}</strong>
              </p>
            </div>
          </div>

          <div
            className="department-detail-item"
            style={{
              marginTop: 12,
              background: "var(--blue-50)",
              borderColor: "var(--border)",
            }}
          >
            <span className="small text-muted" style={{ fontWeight: 700 }}>
              CITIZEN / COMPLAINANT DETAILS
            </span>
            {citizen ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 10,
                  marginTop: 8,
                  fontSize: 13,
                }}
              >
                <div>
                  <span className="small text-muted">Full Name</span>
                  <div style={{ fontWeight: 700, color: "var(--navy)" }}>
                    {citizen.name}
                  </div>
                </div>
                <div>
                  <span className="small text-muted">Contact Number</span>
                  <div style={{ fontWeight: 700, color: "var(--navy)" }}>
                    {citizen.phone ? (
                      <a
                        href={`tel:${citizen.phone}`}
                        style={{ color: "var(--navy)", textDecoration: "underline" }}
                      >
                        📞 {citizen.phone}
                      </a>
                    ) : (
                      <span className="text-muted">Not provided</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="small text-muted">Email Address</span>
                  <div style={{ fontWeight: 600, overflowWrap: "anywhere" }}>
                    <a
                      href={`mailto:${citizen.email}`}
                      style={{ color: "var(--navy)", textDecoration: "underline" }}
                    >
                      {citizen.email}
                    </a>
                  </div>
                </div>
                {citizen.address && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span className="small text-muted">Registered Address</span>
                    <div style={{ color: "var(--text-body)" }}>
                      {citizen.address}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="small text-muted" style={{ marginTop: 6 }}>
                Citizen profile details unavailable for this grievance.
              </p>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Complaint Activity</h3>

            <div className="timeline-item">
              <strong>Complaint reported</strong>
              <p className="small text-muted">{complaint.age}</p>
            </div>

            <div className="timeline-item">
              <strong>
                {isResolved
                  ? "Complaint resolved"
                  : complaint.status === "Pending Dispatch"
                    ? "Awaiting crew assignment"
                    : "Work in progress"}
              </strong>
              <p className="text-body">
                {isResolved
                  ? "This grievance has been marked as resolved and closed."
                  : complaint.status === "Pending Dispatch"
                    ? "A department officer needs to assign a field crew or mark resolved."
                    : "The assigned team is actively working on this complaint."}
              </p>
            </div>
          </div>

          {!isResolved && onResolve && (
            <div style={{ marginTop: 16 }}>
              <label
                htmlFor="admin-resolution-note"
                className="small text-muted"
                style={{ display: "block", fontWeight: 700, marginBottom: 6 }}
              >
                RESOLUTION REMARKS (OPTIONAL)
              </label>
              <input
                id="admin-resolution-note"
                type="text"
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="e.g. Verified on site and repair completed"
                style={{ width: "100%", padding: "9px 12px" }}
              />
            </div>
          )}

          {error && (
            <p className="complaint-error" role="alert" style={{ marginTop: 12 }}>
              {error}
            </p>
          )}
        </div>

        <div className="timeline-footer">
          <span className="small text-muted">
            NagrikConnect Municipal Administration Core
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {!isResolved && onResolve && (
              <button
                type="button"
                className="btn"
                onClick={handleMarkResolved}
                disabled={resolving}
                style={{
                  background: "#2e7d32",
                  color: "#ffffff",
                  fontWeight: 600,
                }}
              >
                {resolving ? "Resolving..." : "✓ Mark as Resolved"}
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DepartmentComplaintModal;
