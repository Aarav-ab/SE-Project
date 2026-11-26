import type { SubmittedComplaint } from "../ComplaintContext";

type ComplaintTimelineModalProps = {
  complaint: SubmittedComplaint;
  onClose: () => void;
};

function ComplaintTimelineModal({ complaint, onClose }: ComplaintTimelineModalProps) {
  return (
    <div
      className="confirmation-overlay timeline-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="confirmation-modal timeline-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="timeline-title"
      >
        <button className="timeline-close" onClick={onClose} aria-label="Close timeline">
          ×
        </button>
        <div className="timeline-heading">
          <span className="timeline-eyebrow">CITIZEN COMPLAINT</span>
          <h2 id="timeline-title">Complaint Details</h2>
          <span className="timeline-complaint-id">#{complaint.id}</span>
          <div className="timeline-status-row">
            <span className="pill status-progress">{complaint.status}</span>
            <span className="cc-cat">{complaint.complaintType}</span>
          </div>
        </div>

        <div className="timeline-details">
          <h3>Report</h3>
          <p><strong>Description</strong><span>{complaint.description}</span></p>
          <p><strong>Location</strong><span>{complaint.address || complaint.ward}</span></p>
          <p><strong>PIN code</strong><span>{complaint.pinCode || "Not provided"}</span></p>
          {complaint.landmark && <p><strong>Landmark</strong><span>{complaint.landmark}</span></p>}
          <p><strong>Department</strong><span>{complaint.department}</span></p>
          <p><strong>Priority</strong><span>{complaint.priority}</span></p>
          <p><strong>Submitted</strong><span>{new Date(complaint.submittedAt).toLocaleString()}</span></p>
          {complaint.latitude !== null && complaint.longitude !== null && (
            <p><strong>Coordinates</strong><span>{complaint.latitude}, {complaint.longitude}</span></p>
          )}
        </div>

        <div className="timeline-history">
          <h3>Admin update</h3>
          <p className="text-body">
            {complaint.feedback || "No feedback has been added by the department yet."}
          </p>
          <p className="small text-muted">Current status: {complaint.status}</p>
        </div>

        {complaint.attachments.length > 0 && (
          <div className="timeline-history">
            <h3>Evidence</h3>
            {complaint.attachments.map((file) => (
              <a
                key={file.id}
                className="attachment-link"
                href={`/api/complaints/${encodeURIComponent(complaint.id)}/attachments/${encodeURIComponent(String(file.id))}`}
              >
                {file.name}
              </a>
            ))}
          </div>
        )}
        <button className="btn btn-navy" onClick={onClose}>Close</button>
      </section>
    </div>
  );
}

export default ComplaintTimelineModal;
