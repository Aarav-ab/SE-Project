import { useState } from "react";

type Complaint = {
  id: string;
  category: string;
  age: string;
  title: string;
  location: string;
  assigned: string;
  status: string;
  feedback: string;
  priority: string;
  reporterName: string;
};

type DepartmentComplaintModalProps = {
  complaint: Complaint;
  onClose: () => void;
  onUpdate: (status: string, feedback: string) => Promise<void>;
};

function DepartmentComplaintModal({ complaint, onClose, onUpdate }: DepartmentComplaintModalProps) {
  const [status, setStatus] = useState(complaint.status);
  const [feedback, setFeedback] = useState(complaint.feedback);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onUpdate(status, feedback);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this update.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="confirmation-overlay department-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="confirmation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="department-complaint-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="timeline-header">
          <div>
            <span className="small text-muted">DEPARTMENT COMPLAINT DETAILS</span>
            <h2 id="department-complaint-title" style={{ margin: "8px 0" }}>{complaint.title}</h2>
            <code>#{complaint.id}</code>
          </div>
          <button type="button" className="timeline-close" onClick={onClose} aria-label="Close complaint details">×</button>
        </div>

        <div className="timeline-body">
          <div className="grid grid-2" style={{ gap: 12 }}>
            <div className="department-detail-item"><span className="small text-muted">CATEGORY</span><p><strong>{complaint.category}</strong></p></div>
            <div className="department-detail-item"><span className="small text-muted">CURRENT STATUS</span><p><strong>{complaint.status}</strong></p></div>
            <div className="department-detail-item"><span className="small text-muted">LOCATION</span><p>📍 {complaint.location}</p></div>
            <div className="department-detail-item"><span className="small text-muted">REPORTED BY</span><p><strong>{complaint.reporterName}</strong></p></div>
            <div className="department-detail-item"><span className="small text-muted">PRIORITY</span><p><strong>{complaint.priority}</strong></p></div>
            <div className="department-detail-item"><span className="small text-muted">ASSIGNED OFFICER / CREW</span><p><strong>{complaint.assigned}</strong></p></div>
          </div>
          <p className="small text-muted">Reported {complaint.age}</p>

          <form onSubmit={saveUpdate} className="admin-feedback-form">
            <h3>Update status and feedback</h3>
            <label htmlFor="complaint-status">Status</label>
            <select id="complaint-status" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>Pending Dispatch</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>
            <label htmlFor="complaint-feedback">Feedback for citizen</label>
            <textarea
              id="complaint-feedback"
              maxLength={5000}
              rows={4}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="Share progress or resolution details with the citizen."
            />
            {error && <p className="auth-error" role="alert">{error}</p>}
            <div className="timeline-footer">
              <span className="small text-muted">Updates are saved to the complaint record.</span>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save Update"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default DepartmentComplaintModal;
