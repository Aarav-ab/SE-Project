import { useState, useEffect } from "react";
import {
  fetchComplaintById,
  type ApiComplaint,
  type ApiTimelineEvent,
} from "../api";

type ComplaintTimelineModalProps = {
  complaintId: string;
  currentStep?: number;
  complaintData?: {
    id: string;
    title: string;
    category: string;
    department?: string;
    complaintType?: string;
    location: string;
    date: string;
    status: string;
    priority?: string;
    assignedTo?: string;
    assignedWorker?: string;
    assignedWorkerDetails?: {
      id?: string;
      name: string;
      initials?: string;
      role?: string;
      phone?: string | null;
      status?: string;
      department?: string;
    } | null;
    step?: number;
    progress?: string;
    resolved?: boolean;
    timeline?: ApiTimelineEvent[];
  };
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
  currentStep,
  complaintData,
  onClose,
}: ComplaintTimelineModalProps) {
  const [serverComplaint, setServerComplaint] = useState<ApiComplaint | null>(null);

  useEffect(() => {
    let mounted = true;
    const needsFetch =
      complaintId &&
      (!complaintData?.timeline ||
        (complaintData?.assignedWorker && !complaintData?.assignedWorkerDetails));
    if (needsFetch) {
      fetchComplaintById(complaintId).then((data) => {
        if (mounted && data) {
          setServerComplaint(data);
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [complaintId, complaintData?.timeline, complaintData?.assignedWorker, complaintData?.assignedWorkerDetails]);

  // Fallback mock if complaintId matches demo data
  const mockFallback = timelineData[complaintId];

  // Derive initial values from serverComplaint, complaintData prop, or mockFallback
  const rawStatus =
    serverComplaint?.status ||
    complaintData?.status ||
    mockFallback?.status ||
    "Pending Dispatch";

  const isPendingDispatch =
    rawStatus === "Pending Dispatch" &&
    !serverComplaint?.assignedWorker?.name &&
    !complaintData?.assignedWorker;

  const isResolved =
    !isPendingDispatch &&
    (Boolean(complaintData?.resolved) ||
      rawStatus.toLowerCase().includes("resolve") ||
      rawStatus.toLowerCase().includes("closed") ||
      serverComplaint?.status === "Resolved" ||
      serverComplaint?.status === "Closed" ||
      Boolean(mockFallback?.status?.toLowerCase().includes("resolve")));

  // Calculate effectiveStep (1-4) consistently with ComplaintsLog
  let effectiveStep = 1;
  if (isResolved) {
    effectiveStep = 4;
  } else if (isPendingDispatch) {
    effectiveStep = 1;
  } else if (currentStep && currentStep >= 1 && currentStep <= 4) {
    effectiveStep = currentStep;
  } else if (complaintData?.step && complaintData.step >= 1 && complaintData.step <= 4) {
    effectiveStep = complaintData.step;
  } else if (serverComplaint?.status === "In Progress") {
    effectiveStep = 3;
  } else if (
    serverComplaint?.status === "Assigned" ||
    serverComplaint?.assignedWorker?.name ||
    complaintData?.assignedWorker
  ) {
    effectiveStep = 2;
  } else if (mockFallback?.currentStep) {
    effectiveStep = mockFallback.currentStep;
  }

  const timelineEvents = serverComplaint?.timeline || complaintData?.timeline;

  // Advance only from explicit step >= 3 timeline events when not Pending Dispatch
  if (!isResolved && !isPendingDispatch && timelineEvents && timelineEvents.length > 0) {
    for (const ev of timelineEvents) {
      if (ev.step && ev.step > effectiveStep && ev.step <= 4) {
        effectiveStep = ev.step;
      }
    }
  }

  const title =
    serverComplaint?.description ||
    complaintData?.title ||
    serverComplaint?.title ||
    mockFallback?.title ||
    "Civic Grievance";

  const category =
    serverComplaint?.department?.name ||
    complaintData?.department ||
    complaintData?.category ||
    serverComplaint?.complaintType ||
    mockFallback?.category ||
    "Civic Department";

  const location =
    serverComplaint?.address ||
    complaintData?.location ||
    mockFallback?.location ||
    "Ward 14, Indiranagar";

  const filedDate = serverComplaint?.createdAt
    ? new Date(serverComplaint.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : complaintData?.date || mockFallback?.date || "Recently filed";

  const assignedOfficer = isPendingDispatch
    ? "Pending Crew Assignment"
    : serverComplaint?.assignedWorker?.name ||
      complaintData?.assignedWorkerDetails?.name ||
      complaintData?.assignedWorker ||
      complaintData?.assignedTo ||
      mockFallback?.assignedTo ||
      (effectiveStep >= 2 ? "Assigned Field Crew" : "Pending Crew Assignment");

  const staffDetails = isPendingDispatch
    ? null
    : serverComplaint?.assignedWorker
    ? {
        name: serverComplaint.assignedWorker.name,
        initials: serverComplaint.assignedWorker.initials,
        role: serverComplaint.assignedWorker.role,
        phone: serverComplaint.assignedWorker.phone ?? null,
        status: serverComplaint.assignedWorker.status,
        department:
          serverComplaint.assignedWorker.department?.name ||
          serverComplaint.department?.name ||
          category,
      }
    : complaintData?.assignedWorkerDetails
    ? {
        name: complaintData.assignedWorkerDetails.name,
        initials: complaintData.assignedWorkerDetails.initials,
        role: complaintData.assignedWorkerDetails.role,
        phone: complaintData.assignedWorkerDetails.phone ?? null,
        status: complaintData.assignedWorkerDetails.status,
        department: complaintData.assignedWorkerDetails.department || category,
      }
    : assignedOfficer !== "Pending Crew Assignment"
    ? {
        name: assignedOfficer,
        initials: assignedOfficer
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        role: "Assigned Field Staff",
        phone: null,
        status: undefined,
        department: category,
      }
    : null;

  const priority =
    serverComplaint?.priority ||
    complaintData?.priority ||
    mockFallback?.priority ||
    "Medium";

  // Build the 4-step timeline events (hide stale step >= 2 events if Pending Dispatch)
  const step1Event = timelineEvents?.find((t) => t.step === 1);
  const step2Event = effectiveStep >= 2 ? timelineEvents?.find((t) => t.step === 2) : undefined;
  const step3Event = effectiveStep >= 3 ? timelineEvents?.find((t) => t.step === 3) : undefined;
  const step4Event = effectiveStep >= 4 ? timelineEvents?.find((t) => t.step === 4) : undefined;

  const mockEvents = mockFallback?.events;

  const events = [
    {
      title: "Complaint Registered",
      date: step1Event
        ? new Date(step1Event.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : filedDate,
      description:
        step1Event?.description ||
        mockEvents?.[0]?.description ||
        `Grievance registered under ${category}. Categorized and routed to ward administration.`,
      author: step1Event?.author || mockEvents?.[0]?.author || undefined,
    },
    {
      title: "Department Assigned",
      date: step2Event
        ? new Date(step2Event.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : effectiveStep >= 2
        ? filedDate
        : "Pending assignment",
      description:
        step2Event?.description ||
        mockEvents?.[1]?.description ||
        (effectiveStep >= 2
          ? `Forwarded to ${category}. Assigned to ${assignedOfficer}.`
          : `Awaiting crew assignment by department administrator.`),
      comment:
        step2Event?.comment ||
        mockEvents?.[1]?.comment ||
        (effectiveStep === 2 && complaintData?.progress
          ? complaintData.progress
          : effectiveStep >= 2 && assignedOfficer !== "Pending Crew Assignment"
          ? "Dispatch initiated for site inspection and resolution."
          : undefined),
      author:
        step2Event?.author ||
        mockEvents?.[1]?.author ||
        (effectiveStep >= 2 ? "Municipal Administrator" : undefined),
    },
    {
      title: "Work in Progress",
      date: step3Event
        ? new Date(step3Event.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : effectiveStep >= 3
        ? filedDate
        : "Pending on-site visit",
      description:
        step3Event?.description ||
        mockEvents?.[2]?.description ||
        (effectiveStep >= 3
          ? "On-site field team deployed for physical inspection and repair."
          : "Field team deployment scheduled following department dispatch."),
      comment:
        step3Event?.comment ||
        mockEvents?.[2]?.comment ||
        (effectiveStep >= 3
          ? complaintData?.progress || `Field technician actively deployed on site for remediation.`
          : undefined),
      author:
        step3Event?.author ||
        mockEvents?.[2]?.author ||
        (effectiveStep >= 3 ? assignedOfficer : undefined),
    },
    {
      title: "Resolution & Verification",
      date: step4Event
        ? new Date(step4Event.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : isResolved
        ? filedDate
        : "Pending completion",
      description:
        step4Event?.description ||
        mockEvents?.[3]?.description ||
        (isResolved
          ? "Grievance remediation completed and verified on site."
          : "Completion and verification will be recorded after physical work is executed."),
      comment:
        step4Event?.comment ||
        mockEvents?.[3]?.comment ||
        (isResolved
          ? "Resolution verified through municipal inspection."
          : undefined),
      author:
        step4Event?.author ||
        mockEvents?.[3]?.author ||
        (isResolved ? "Quality Inspection Officer" : undefined),
    },
  ];

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
            <span
              className={`pill ${isResolved ? "badge-resolved" : "status-progress"}`}
              style={
                isResolved
                  ? {
                      background: "rgba(97, 177, 95, 0.15)",
                      color: "#2e7d32",
                      border: "1px solid rgba(97, 177, 95, 0.4)",
                      fontWeight: 700,
                    }
                  : undefined
              }
            >
              {isResolved ? "Resolved & Closed" : rawStatus}
            </span>
            <span className="cc-cat">{category}</span>
          </div>
        </div>

        <div className="timeline-details">
          <h3>Complaint Details</h3>

          <p>
            <strong>Description</strong>
            <span>{title}</span>
          </p>

          <p>
            <strong>Location</strong>
            <span>{location}</span>
          </p>

          <p>
            <strong>Date Filed</strong>
            <span>{filedDate}</span>
          </p>

          <p>
            <strong>Priority</strong>
            <span>{priority}</span>
          </p>

          <p>
            <strong>Assigned Officer</strong>
            <span>{assignedOfficer}</span>
          </p>

          <div
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: 10,
              background: "var(--blue-50)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="small text-muted"
              style={{ fontWeight: 700, marginBottom: 8, letterSpacing: "0.4px" }}
            >
              ASSIGNED STAFF MEMBER DETAILS
            </div>

            {staffDetails ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: 10,
                  fontSize: 13,
                }}
              >
                <div>
                  <div className="small text-muted">Staff Name</div>
                  <strong style={{ color: "var(--navy)" }}>
                    {staffDetails.name}
                  </strong>
                </div>
                <div>
                  <div className="small text-muted">Role / Designation</div>
                  <div style={{ color: "var(--text-dark)", fontWeight: 600 }}>
                    {staffDetails.role || "Municipal Field Staff"}
                  </div>
                </div>
                <div>
                  <div className="small text-muted">Department</div>
                  <div style={{ color: "var(--text-dark)", fontWeight: 600 }}>
                    {staffDetails.department || category}
                  </div>
                </div>
                <div>
                  <div className="small text-muted">Contact Number</div>
                  <div style={{ fontWeight: 700, color: "var(--navy)" }}>
                    {staffDetails.phone ? (
                      <a
                        href={`tel:${staffDetails.phone}`}
                        style={{ color: "var(--navy)", textDecoration: "underline" }}
                      >
                        📞 {staffDetails.phone}
                      </a>
                    ) : (
                      <span className="text-muted">Not available</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="small text-muted">
                No staff member has been assigned yet. Staff name, designation, and contact number will appear here once dispatched.
              </div>
            )}
          </div>
        </div>

        <div className="timeline-history">
          <h3>Progress History</h3>

          <div className="timeline-events">
            {events.map((event, index) => {
              const stepNumber = index + 1;
              const completed = isResolved || stepNumber < effectiveStep;
              const current = !isResolved && stepNumber === effectiveStep;

              return (
                <article className="timeline-event" key={event.title}>
                  <div
                    className={`timeline-marker ${
                      completed ? "completed" : current ? "current" : "upcoming"
                    }`}
                  >
                    {completed ? "✓" : stepNumber}
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
                          {event.author && <span>{event.author}</span>}
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
          ✓ Verified 4-step municipal resolution audit trail recorded in NagrikConnect Core.
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
