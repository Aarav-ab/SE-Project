import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import {
  fetchComplaints,
  submitGrievance,
  deleteComplaintApi,
  getCurrentUser,
  type ApiComplaint,
  type ApiTimelineEvent,
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
  title?: string;
  userId?: string | null;
  submittedAt: string;
  status: string;
  department: string;
  departmentId?: string;
  assignedWorker?: string;
  step?: number;
  progress?: string;
  resolved?: boolean;
  timeline?: ApiTimelineEvent[];
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
  areaComplaints: SubmittedComplaint[];
  myComplaints: SubmittedComplaint[];
  allComplaints: SubmittedComplaint[];
  totalCount: number;
  inProgressCount: number;
  resolvedCount: number;
  addSubmittedComplaint: (complaint: ComplaintData) => Promise<string>;
  removeComplaint: (id: string) => Promise<boolean>;
  refreshComplaints: () => Promise<void>;
  syncUserSession: () => void;
  isLoading: boolean;
};

const ComplaintContext = createContext<ComplaintContextValue | null>(null);

function removeStaleCrewAssignment(complaintId: string) {
  try {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("nc_crew_assignments");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && parsed[complaintId]) {
      delete parsed[complaintId];
      localStorage.setItem("nc_crew_assignments", JSON.stringify(parsed));
    }
  } catch {
    // Ignore localStorage parse errors
  }
}

function mapApiToSubmitted(c: ApiComplaint): SubmittedComplaint {
  const isPendingDispatch = c.status === "Pending Dispatch" && !c.assignedWorker;

  // Check if resolved from status or timeline (unless reset to Pending Dispatch)
  const isResolved =
    !isPendingDispatch &&
    (c.status === "Resolved" ||
      c.status === "Closed" ||
      c.status?.toLowerCase().includes("resolve") ||
      Boolean(
        c.timeline?.some(
          (t) =>
            t.step === 4 ||
            t.status === "Resolved" ||
            t.title?.toLowerCase().includes("resolv")
        )
      ));

  if (isPendingDispatch) {
    removeStaleCrewAssignment(c.id);
  }

  let storedCrew: string | undefined;
  if (!isPendingDispatch) {
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
    } catch {
      // Ignore localStorage parse errors
    }
  }

  const timelineWorker = !isPendingDispatch
    ? c.timeline
        ?.find((t) => t.description?.startsWith("Assigned to "))
        ?.description?.replace("Assigned to ", "")
        .replace(".", "")
        .trim()
    : undefined;

  const assignedWorkerName = isPendingDispatch
    ? undefined
    : c.assignedWorker?.name || storedCrew || timelineWorker || undefined;

  const hasWorkerAssigned = Boolean(
    assignedWorkerName && !assignedWorkerName.includes("Unassigned")
  );

  // Only treat as Step 3 (In Progress) when complaint status is In Progress or a step-3 timeline event exists
  const hasTimelineInProgress =
    !isPendingDispatch &&
    Boolean(
      c.timeline?.some(
        (t) =>
          t.step === 3 ||
          (t.step !== 2 && t.status === "In Progress") ||
          t.title?.toLowerCase().includes("work in progress")
      )
    );

  const hasTimelineAssigned =
    !isPendingDispatch &&
    (hasWorkerAssigned ||
      Boolean(
        c.timeline?.some(
          (t) =>
            t.step === 2 ||
            t.status === "Assigned" ||
            t.title?.toLowerCase().includes("assign")
        )
      ));

  let step: number;
  let status: string;

  if (isResolved) {
    step = 4;
    status = "Resolved & Closed";
  } else if (isPendingDispatch) {
    step = 1;
    status = "Pending Dispatch";
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

  // Only use timeline comments from events up to the active step
  if (!isPendingDispatch && c.timeline && c.timeline.length > 0) {
    const latestEventWithComment = [...c.timeline]
      .reverse()
      .find(
        (t) =>
          (t.step ?? 1) <= step &&
          t.comment &&
          t.comment.trim().length > 0
      );
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
    title: c.title,
    userId: c.userId ?? null,
    submittedAt: c.createdAt,
    status,
    department: c.department?.name || "General Municipal Services",
    departmentId: c.department?.id || c.departmentId,
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
  const [hasLoadedFromServer, setHasLoadedFromServer] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(
    () => getCurrentUser()?.id ?? null
  );
  const [isLoading, setIsLoading] = useState(false);
  const inFlightRefreshRef = useRef<Promise<void> | null>(null);

  const syncUserSession = useCallback(() => {
    setActiveUserId(getCurrentUser()?.id ?? null);
  }, []);

  const refreshComplaints = useCallback(async () => {
    if (inFlightRefreshRef.current) {
      return inFlightRefreshRef.current;
    }

    const promise = (async () => {
      setIsLoading(true);
      try {
        const serverComplaints = await fetchComplaints();
        const stored = localStorage.getItem("nc_deleted_complaints");
        const deletedIds = new Set(stored ? JSON.parse(stored) : []);
        setSubmittedComplaints(
          serverComplaints
            .filter((c) => !deletedIds.has(c.id))
            .map(mapApiToSubmitted)
        );
        setHasLoadedFromServer(true);
        setActiveUserId(getCurrentUser()?.id ?? null);
      } catch (e) {
        console.warn("Could not load complaints from API:", e);
      } finally {
        setIsLoading(false);
        inFlightRefreshRef.current = null;
      }
    })();

    inFlightRefreshRef.current = promise;
    return promise;
  }, []);

  async function removeComplaint(id: string): Promise<boolean> {
    try {
      await deleteComplaintApi(id);
    } catch (err) {
      console.warn("deleteComplaintApi error, continuing with local removal:", err);
    }

    setSubmittedComplaints((prev) => prev.filter((c) => c.id !== id));
    removeStaleCrewAssignment(id);

    try {
      const stored = localStorage.getItem("nc_deleted_complaints");
      const list: string[] = stored ? JSON.parse(stored) : [];
      if (!list.includes(id)) {
        list.push(id);
        localStorage.setItem("nc_deleted_complaints", JSON.stringify(list));
      }
    } catch {
      // Ignore localStorage write errors
    }

    return true;
  }

  useEffect(() => {
    void Promise.resolve().then(() => refreshComplaints());
  }, [refreshComplaints]);

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
        "Streetlight": "Electrical & Streetlighting",
        "Garbage": "Sanitation (SWM)",
        "Garbage / Waste": "Sanitation (SWM)",
        "Water Supply": "Water Supply & Drainage",
        "Drainage": "Water Supply & Drainage",
        "Drainage / Water": "Water Supply & Drainage",
      };

      const fallbackId = `GRV-OFFLINE-${Date.now().toString().slice(-4)}`;
      const newComplaint: SubmittedComplaint = {
        ...data,
        files: [...data.files],
        id: fallbackId,
        userId: getCurrentUser()?.id ?? null,
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
  const uniqueFallback = hasLoadedFromServer
    ? []
    : fallbackComplaints.filter(
        (c) => !submittedIds.has(c.id) && !deletedIds.has(c.id)
      );

  const areaComplaints = [...submittedComplaints, ...uniqueFallback].filter(
    (c) => !deletedIds.has(c.id)
  );

  const currentUserId = activeUserId ?? getCurrentUser()?.id ?? null;
  const myComplaints = currentUserId
    ? areaComplaints.filter((c) => c.userId === currentUserId)
    : [];

  const allComplaints = areaComplaints;

  const totalCount = myComplaints.length;
  const inProgressCount = myComplaints.filter((c) => !c.resolved).length;
  const resolvedCount = myComplaints.filter((c) => c.resolved).length;

  return (
    <ComplaintContext.Provider
      value={{
        complaint,
        updateComplaint,
        submittedComplaints,
        areaComplaints,
        myComplaints,
        allComplaints,
        totalCount,
        inProgressCount,
        resolvedCount,
        addSubmittedComplaint,
        removeComplaint,
        refreshComplaints,
        syncUserSession,
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
