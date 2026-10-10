type ComplaintTimelineModalProps = {
  complaintId: string;
  onClose: () => void;
};

const timelineData: Record<
  string,
  {
    title: string;
    category: string;
    location: string;
    date: string;
    status: string;
    priority: string;
    assignedTo: string;
    currentStep: number;
    events: {
      title: string;
      date: string;
      description: string;
      comment?: string;
      author?: string;
    }[];
  }
> = {
  "GRV-2025-W14-8902": {
    title: "Pothole repair on 12th Main Road, Ward 14",
    category: "Roads & Infrastructure",
    location: "Near 80ft Road Junction, Hoysala Nagar, Indiranagar",
    date: "24 Oct, 2025",
    status: "In Progress",
    priority: "High",
    assignedTo: "Junior Engineer Er. Manoj Kumar",
    currentStep: 3,
    events: [
      {
        title: "Complaint Registered",
        date: "24 Oct, 2025",
        description: "Your complaint was successfully registered.",
      },
      {
        title: "Department Assigned",
        date: "24 Oct, 2025",
        description: "The complaint was forwarded to Roads & Infrastructure.",
        comment:
          "The repair request has been assigned to the road maintenance team.",
        author: "Municipal Administrator",
      },
      {
        title: "Work in Progress",
        date: "26 Oct, 2025",
        description: "An on-site asphalt patching team has been deployed.",
        comment:
          "The team is on site. Asphalt patching work is currently in progress.",
        author: "Junior Engineer Er. Manoj Kumar",
      },
      {
        title: "Resolution & Verification",
        date: "Pending",
        description:
          "The completed work will be verified before the complaint is closed.",
      },
    ],
  },
  "GRV-2025-W14-9140": {
    title: "Overflowing Garbage Bin Near Community Park",
    category: "Solid Waste Management",
    location: "5th Cross, Indiranagar East, Ward 14",
    date: "Yesterday, 04:15 PM",
    status: "Assigned to Sanitation Crew",
    priority: "Medium",
    assignedTo: "Sanitary Inspector K. Ramesh",
    currentStep: 2,
    events: [
      {
        title: "Complaint Registered",
        date: "Yesterday, 04:15 PM",
        description: "Your garbage collection complaint was registered.",
      },
      {
        title: "Department Assigned",
        date: "Pending update",
        description:
          "The complaint was assigned to the Solid Waste Management team.",
        comment:
          "The complaint has been assigned to our sanitation crew. The compactor vehicle route #C-14 is scheduled.",
        author: "Sanitary Inspector K. Ramesh",
      },
      {
        title: "Collection in Progress",
        date: "Pending",
        description:
          "The sanitation crew will update the status after visiting the location.",
      },
      {
        title: "Resolution & Verification",
        date: "Pending",
        description:
          "Completion will be recorded after the garbage is cleared and the result is verified.",
      },
    ],
  },
  "GRV-2025-W14-7812": {
    title: "Flickering Streetlight Pole #SL-104",
    category: "Electrical & Streetlighting",
    location: "80ft Road, Opposite SBI ATM, Ward 14",
    date: "18 Oct, 2025",
    status: "Resolved & Closed",
    priority: "Low",
    assignedTo: "Electrical Maintenance Team",
    currentStep: 4,
    events: [
      {
        title: "Complaint Registered",
        date: "18 Oct, 2025",
        description: "The streetlight fault was reported.",
      },
      {
        title: "Department Assigned",
        date: "18 Oct, 2025",
        description: "The complaint was assigned to the electrical team.",
        comment: "Inspection of streetlight pole SL-104 was scheduled.",
        author: "Municipal Administrator",
      },
      {
        title: "Repair Completed",
        date: "19 Oct, 2025",
        description: "The faulty streetlight fixture was replaced.",
        comment:
          "The LED luminaire was replaced with an energy-saving 70W bulb.",
        author: "Electrical Maintenance Team",
      },
      {
        title: "Resolution Verified",
        date: "19 Oct, 2025",
        description: "The repair was verified and the complaint was closed.",
        comment: "Resolution verified through citizen OTP authentication.",
        author: "Municipal Administrator",
      },
    ],
  },
  "GRV-2025-W14-6504": {
    title: "Blocked Stormwater Drain",
    category: "Stormwater & Drainage",
    location: "2nd Main Road, Near Post Office, Ward 14",
    date: "10 Oct, 2025",
    status: "Resolved & Closed",
    priority: "High",
    assignedTo: "Stormwater & Drainage Maintenance Team",
    currentStep: 4,
    events: [
      {
        title: "Complaint Registered",
        date: "10 Oct, 2025",
        description: "The blocked stormwater drain was reported by a citizen.",
      },
      {
        title: "Department Assigned",
        date: "10 Oct, 2025",
        description:
          "The complaint was assigned to the Stormwater & Drainage team.",
        comment:
          "The drainage maintenance team has been assigned to inspect the blockage.",
        author: "Municipal Administrator",
      },
      {
        title: "Drainage Work Completed",
        date: "12 Oct, 2025",
        description:
          "The drainage team completed the de-silting and debris removal.",
        comment:
          "De-silting and debris clearing of the 45-meter drainage culvert has been completed.",
        author: "Stormwater & Drainage Maintenance Team",
      },
      {
        title: "Resolution Verified",
        date: "12 Oct, 2025",
        description:
          "The completed work was recorded and the complaint was closed.",
        comment:
          "The resolution was signed off by the Zonal Quality Control Inspector.",
        author: "Zonal QC Inspector",
      },
    ],
  },
};

function ComplaintTimelineModal({
  complaintId,
  onClose,
}: ComplaintTimelineModalProps) {
  const complaint = timelineData[complaintId];

  if (!complaint) {
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
          <button
            className="timeline-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
          <h2 id="timeline-title">Complaint Timeline</h2>
          <p>Timeline details are not available for this complaint yet.</p>
          <button className="btn btn-navy" onClick={onClose}>
            Close
          </button>
        </section>
      </div>
    );
  }

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
        <button
          className="timeline-close"
          onClick={onClose}
          aria-label="Close timeline"
        >
          ×
        </button>

        <div className="timeline-heading">
          <span className="timeline-eyebrow">CITIZEN COMPLAINT HISTORY</span>
          <h2 id="timeline-title">Complaint Timeline</h2>
          <span className="timeline-complaint-id">#{complaintId}</span>

          <div className="timeline-status-row">
            <span className="pill status-progress">{complaint.status}</span>
            <span className="cc-cat">{complaint.category}</span>
          </div>
        </div>

        <div className="timeline-details">
          <h3>Complaint Details</h3>

          <p>
            <strong>Description</strong>
            <span>{complaint.title}</span>
          </p>

          <p>
            <strong>Location</strong>
            <span>{complaint.location}</span>
          </p>

          <p>
            <strong>Date Filed</strong>
            <span>{complaint.date}</span>
          </p>

          <p>
            <strong>Priority</strong>
            <span>{complaint.priority}</span>
          </p>

          <p>
            <strong>Assigned Officer</strong>
            <span>{complaint.assignedTo}</span>
          </p>
        </div>

        <div className="timeline-history">
          <h3>Progress History</h3>

          <div className="timeline-events">
            {complaint.events.map((event, index) => {
              const completed = index < complaint.currentStep - 1;
              const current = index === complaint.currentStep - 1;

              return (
                <article className="timeline-event" key={event.title}>
                  <div
                    className={`timeline-marker ${
                      completed ? "completed" : current ? "current" : "upcoming"
                    }`}
                  >
                    {completed ? "✓" : index + 1}
                  </div>

                  <div className="timeline-event-content">
                    <div className="timeline-event-top">
                      <h4>{event.title}</h4>
                      <span className="timeline-date">{event.date}</span>
                    </div>

                    <p>{event.description}</p>

                    {event.comment && (
                      <div className="timeline-comment">
                        <div className="timeline-comment-heading">
                          <span>💬 Staff Update</span>
                          <span>{event.author}</span>
                        </div>
                        <p>{event.comment}</p>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <p className="timeline-demo-note">
          Demo timeline and staff comments. Live updates will be connected to
          the backend later.
        </p>

        <div className="timeline-footer">
          <button className="btn btn-navy" onClick={onClose}>
            Close Timeline
          </button>
        </div>
      </section>
    </div>
  );
}

export default ComplaintTimelineModal;
