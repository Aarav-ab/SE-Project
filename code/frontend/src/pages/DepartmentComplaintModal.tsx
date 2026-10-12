type Complaint = {
  id: string;
  category: string;
  age: string;
  title: string;
  location: string;
  assigned: string;
  status: string;
  icon: string;
};

type DepartmentComplaintModalProps = {
  complaint: Complaint;
  onClose: () => void;
};

function DepartmentComplaintModal({
  complaint,
  onClose,
}: DepartmentComplaintModalProps) {
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
                <strong>{complaint.status}</strong>
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

          <div style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Complaint Activity</h3>

            <div className="timeline-item">
              <strong>Complaint reported</strong>
              <p className="small text-muted">{complaint.age}</p>
            </div>

            <div className="timeline-item">
              <strong>
                {complaint.status === "Resolved"
                  ? "Complaint resolved"
                  : complaint.status === "Pending Dispatch"
                    ? "Awaiting crew assignment"
                    : "Work in progress"}
              </strong>
              <p className="text-body">
                {complaint.status === "Resolved"
                  ? "The complaint is marked as resolved in this demonstration."
                  : complaint.status === "Pending Dispatch"
                    ? "A department officer needs to assign a field crew."
                    : "The assigned team is working on this complaint."}
              </p>
            </div>
          </div>
        </div>

        <div className="timeline-footer">
          <span className="small text-muted">
            Demonstration data · Not connected to the backend
          </span>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}

export default DepartmentComplaintModal;
