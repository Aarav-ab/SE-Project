import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  fetchComplaints,
  submitGrievance,
  deleteComplaintApi,
  type ApiComplaint,
} from "./api";

export type ComplaintData = {
  files: File[];
  address: string;
  pinCode: string;
  landmark: string;
  latitude: number | null;
  longitude: number | null;
  ward: string;
  complaintType: string;
  description: string;
  priority: string;
};

export type SubmittedComplaint = ComplaintData & {
  id: string;
  submittedAt: string;
  status: string;
  department: string;
  assignedWorker?: string;
  step?: number;
  progress?: string;
  resolved?: boolean;
  timeline?: any[];
};

export const fallbackComplaints: SubmittedComplaint[] = [
  {
    files: [],
    address: "Near 80ft Road Junction, Hoysala Nagar, Indiranagar",
    pinCode: "560038",
    landmark: "Near 80ft Road Junction",
    latitude: 12.9784,
    longitude: 77.6408,
    ward: "Ward 14 - Indiranagar East",
    complaintType: "Pothole / Road",
    description: "Pothole repair on 12th Main Road, Ward 14",
    priority: "High",
    id: "GRV-2025-W14-8902",
    submittedAt: "2025-10-24T10:30:00.000Z",
    status: "In Progress",
    department: "Roads & Infrastructure",
    assignedWorker: "Er. Manoj Kumar",
    step: 3,
    progress:
      "On-site asphalt patching team deployed • Junior Engineer Er. Manoj Kumar on site",
    resolved: false,
  },
  {
    files: [],
    address: "5th Cross, Indiranagar East, Ward 14",
    pinCode: "560038",
    landmark: "5th Cross",
    latitude: 12.9716,
    longitude: 77.6412,
    ward: "Ward 14 - Indiranagar East",
    complaintType: "Garbage",
    description: "Overflowing Garbage Bin Near Community Park",
    priority: "Medium",
    id: "GRV-2025-W14-9140",
    submittedAt: "2025-10-25T16:15:00.000Z",
    status: "Assigned",
    department: "Solid Waste Management",
    assignedWorker: "K. Ramesh",
    step: 2,
    progress:
      "Assigned to Sanitary Inspector K. Ramesh • Compactor vehicle route #C-14 scheduled",
    resolved: false,
  },
  {
    files: [],
    address: "80ft Road, Opposite SBI ATM, Ward 14",
    pinCode: "560038",
    landmark: "Opposite SBI ATM",
    latitude: 12.9754,
    longitude: 77.6452,
    ward: "Ward 14 - Indiranagar East",
    complaintType: "Streetlight",
    description: "Flickering Streetlight Pole #SL-104",
    priority: "Low",
    id: "GRV-2025-W14-7812",
    submittedAt: "2025-10-18T14:20:00.000Z",
    status: "Resolved & Closed",
    department: "Electrical & Streetlighting",
    assignedWorker: "Electrical Maintenance Team",
    step: 4,
    progress:
      "LED luminaire fixture replaced with energy-saving 70W bulb. Verified via citizen OTP authentication.",
    resolved: true,
  },
  {
    files: [],
    address: "2nd Main Road, Near Post Office, Ward 14",
    pinCode: "560038",
    landmark: "Near Post Office",
    latitude: 12.9732,
    longitude: 77.6421,
    ward: "Ward 14 - Indiranagar East",
    complaintType: "Drainage",
    description: "Blocked Stormwater Drain",
    priority: "High",
    id: "GRV-2025-W14-6504",
    submittedAt: "2025-10-10T09:15:00.000Z",
    status: "Resolved & Closed",
    department: "Stormwater & Drainage",
    assignedWorker: "Stormwater Maintenance Team",
    step: 4,
    progress:
      "Complete de-silting and debris clearing of 45-meter drainage culvert executed prior to monsoon showers.",
    resolved: true,
  },
];

const initialComplaintData: ComplaintData = {
  files: [],
  address: "",
  pinCode: "",
  landmark: "",
  latitude: null,
  longitude: null,
  ward: "Ward 14 - Indiranagar East",
  complaintType: "Pothole / Road",
  description: "",
  priority: "Medium",
};

type ComplaintContextValue = {
  complaint: ComplaintData;
  updateComplaint: (updates: Partial<ComplaintData>) => void;
  submittedComplaints: SubmittedComplaint[];
  allComplaints: SubmittedComplaint[];
  totalCount: number;
  inProgressCount: number;
  resolvedCount: number;
  addSubmittedComplaint: (complaint: ComplaintData) => Promise<string>;
  removeComplaint: (id: string) => Promise<boolean>;
  refreshComplaints: () => Promise<void>;
  isLoading: boolean;
};

const ComplaintContext = createContext<ComplaintContextValue | null>(null);

function mapApiToSubmitted(c: ApiComplaint): SubmittedComplaint {
  // Check if resolved from status or timeline
  const isResolved =
    c.status === "Resolved" ||
    c.status === "Closed" ||
    c.status?.toLowerCase().includes("resolve") ||
    Boolean(
      c.timeline?.some(
        (t) =>
          t.step === 4 ||
          t.status === "Resolved" ||
          t.title?.toLowerCase().includes("resolv")
      )
    );

  // Check crew assignment from API, local storage, or timeline event
  let storedCrew: string | undefined;
  try {
    const raw =
      typeof window !== "undefined"
        ? localStorage.getItem("nc_crew_assignments")
        : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[c.id] && !parsed[c.id].includes("Unassigned")) {
        storedCrew = parsed[c.id];
      }
    }
  } catch {}

  const timelineWorker = c.timeline
    ?.find((t) => t.description?.startsWith("Assigned to "))
    ?.description?.replace("Assigned to ", "")
    .replace(".", "")
    .trim();

  const assignedWorkerName =
    c.assignedWorker?.name || storedCrew || timelineWorker || undefined;

  const hasWorkerAssigned = Boolean(
    assignedWorkerName && !assignedWorkerName.includes("Unassigned")
  );

  // Check timeline events for progress
  const hasTimelineInProgress = Boolean(
    c.timeline?.some(
      (t) =>
        t.step === 3 ||
        t.status === "In Progress" ||
        t.title?.toLowerCase().includes("progress") ||
        (t.comment && t.comment.toLowerCase().includes("dispatch"))
    )
  );

  const hasTimelineAssigned =
    hasWorkerAssigned ||
    Boolean(
      c.timeline?.some(
        (t) =>
          t.step === 2 ||
          t.status === "Assigned" ||
          t.title?.toLowerCase().includes("assign")
      )
    );

  // Unified resolution step calculation matching the timeline modal
  let step = 1;
  let status = c.status;

  if (isResolved) {
    step = 4;
    status = "Resolved & Closed";
  } else if (c.status === "In Progress" || hasTimelineInProgress) {
    step = 3;
    status = "In Progress";
  } else if (c.status === "Assigned" || hasTimelineAssigned) {
    step = 2;
    status = "Assigned";
  } else {
    step = 1;
    status = c.status || "Pending Dispatch";
  }

  let progress = `Complaint received by ${
    c.department?.name || "municipal department"
  }. Awaiting crew assignment.`;

  if (isResolved) {
    progress =
      "Work completed and verified on site. Verified via municipal site inspection.";
  } else if (step === 3) {
    progress = assignedWorkerName
      ? `On-site crew deployed • ${assignedWorkerName} on site.`
      : "On-site remediation currently in progress.";
  } else if (step === 2) {
    progress = `Assigned to ${
      assignedWorkerName || "Field Crew"
    } • Site inspection scheduled.`;
  }

  // Look for any specific comment or description in timeline
  if (c.timeline && c.timeline.length > 0) {
    const latestEventWithComment = [...c.timeline]
      .reverse()
      .find((t) => t.comment && t.comment.trim().length > 0);
    if (latestEventWithComment?.comment) {
      progress = latestEventWithComment.comment;
    }
  }

  return {
    files: [],
    address: c.address,
    pinCode: c.pinCode || "",
    landmark: c.landmark || "",
    latitude: c.latitude ?? null,
    longitude: c.longitude ?? null,
    ward: c.ward?.name || "Ward 14 - Indiranagar East",
    complaintType: c.complaintType,
    description: c.description,
    priority: c.priority,
    id: c.id,
    submittedAt: c.createdAt,
    status,
    department: c.department?.name || "General Municipal Services",
    assignedWorker: assignedWorkerName,
    step,
    progress,
    resolved: isResolved,
    timeline: c.timeline,
  };
}

export function ComplaintProvider({ children }: { children: ReactNode }) {
  const [complaint, setComplaint] =
    useState<ComplaintData>(initialComplaintData);
  const [submittedComplaints, setSubmittedComplaints] = useState<
    SubmittedComplaint[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  async function refreshComplaints() {
    setIsLoading(true);
    try {
      const serverComplaints = await fetchComplaints();
      const stored = localStorage.getItem("nc_deleted_complaints");
      const deletedIds = new Set(stored ? JSON.parse(stored) : []);
      if (serverComplaints && serverComplaints.length > 0) {
        setSubmittedComplaints(
          serverComplaints
            .filter((c) => !deletedIds.has(c.id))
            .map(mapApiToSubmitted)
        );
      }
    } catch (e) {
      console.warn("Could not load complaints from API:", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function removeComplaint(id: string): Promise<boolean> {
    try {
      await deleteComplaintApi(id);
    } catch (err) {
      console.warn("deleteComplaintApi error, continuing with local removal:", err);
    }

    setSubmittedComplaints((prev) => prev.filter((c) => c.id !== id));

    try {
      const stored = localStorage.getItem("nc_deleted_complaints");
      const list: string[] = stored ? JSON.parse(stored) : [];
      if (!list.includes(id)) {
        list.push(id);
        localStorage.setItem("nc_deleted_complaints", JSON.stringify(list));
      }
    } catch {}

    return true;
  }

  useEffect(() => {
    refreshComplaints();
  }, []);

  function updateComplaint(updates: Partial<ComplaintData>) {
    setComplaint((previous) => ({ ...previous, ...updates }));
  }

  async function addSubmittedComplaint(data: ComplaintData): Promise<string> {
    try {
      // 1. Try submitting to backend API
      const serverComplaint = await submitGrievance(data);
      const mapped = mapApiToSubmitted(serverComplaint);
      setSubmittedComplaints((prev) => [mapped, ...prev]);
      return serverComplaint.id;
    } catch (err) {
      console.warn("Server submission failed, falling back to local storage:", err);
      // 2. Fallback in case backend is offline
      const departmentMap: Record<string, string> = {
        "Pothole / Road": "Roads & Public Works (PWD)",
        "Streetlight": "Electrical",
        "Garbage": "Sanitation (SWM)",
        "Water Supply": "Water Supply & Drainage",
        "Drainage": "Water Supply & Drainage",
      };

      const fallbackId = `GRV-OFFLINE-${Date.now().toString().slice(-4)}`;
      const newComplaint: SubmittedComplaint = {
        ...data,
        files: [...data.files],
        id: fallbackId,
        submittedAt: new Date().toISOString(),
        status: "Pending Dispatch",
        department:
          departmentMap[data.complaintType] ?? "General Municipal Services",
      };

      setSubmittedComplaints((previous) => [newComplaint, ...previous]);
      return fallbackId;
    }
  }

  const storedDeleted =
    typeof window !== "undefined"
      ? localStorage.getItem("nc_deleted_complaints")
      : null;
  const deletedIds = new Set(storedDeleted ? JSON.parse(storedDeleted) : []);

  const submittedIds = new Set(submittedComplaints.map((c) => c.id));
  const uniqueFallback = fallbackComplaints.filter(
    (c) => !submittedIds.has(c.id) && !deletedIds.has(c.id)
  );

  const allComplaints = [...submittedComplaints, ...uniqueFallback].filter(
    (c) => !deletedIds.has(c.id)
  );

  const totalCount = allComplaints.length;
  const inProgressCount = allComplaints.filter((c) => !c.resolved).length;
  const resolvedCount = allComplaints.filter((c) => c.resolved).length;

  return (
    <ComplaintContext.Provider
      value={{
        complaint,
        updateComplaint,
        submittedComplaints,
        allComplaints,
        totalCount,
        inProgressCount,
        resolvedCount,
        addSubmittedComplaint,
        removeComplaint,
        refreshComplaints,
        isLoading,
      }}
    >
      {children}
    </ComplaintContext.Provider>
  );
}

export function useComplaint() {
  const context = useContext(ComplaintContext);

  if (!context) {
    throw new Error("useComplaint must be used inside ComplaintProvider.");
  }

  return context;
}
