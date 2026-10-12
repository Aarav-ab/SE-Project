import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

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
};

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
  addSubmittedComplaint: (complaint: ComplaintData) => void;
};

const ComplaintContext = createContext<ComplaintContextValue | null>(null);

export function ComplaintProvider({ children }: { children: ReactNode }) {
  const [complaint, setComplaint] =
    useState<ComplaintData>(initialComplaintData);

  const [submittedComplaints, setSubmittedComplaints] = useState<
    SubmittedComplaint[]
  >([]);

  function updateComplaint(updates: Partial<ComplaintData>) {
    setComplaint((previous) => ({ ...previous, ...updates }));
  }

  function addSubmittedComplaint(data: ComplaintData) {
    const departmentMap: Record<string, string> = {
      "Pothole / Road": "Roads & Public Works (PWD)",
      "Streetlight": "Electrical",
      "Garbage": "Sanitation (SWM)",
      "Water Supply": "Water Supply & Drainage",
      "Drainage": "Water Supply & Drainage",
    };

    const newComplaint: SubmittedComplaint = {
      ...data,
      files: [...data.files],
      id: `GRV-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: "Pending Dispatch",
      department:
        departmentMap[data.complaintType] ?? "General Municipal Services",
    };

    setSubmittedComplaints((previous) => [newComplaint, ...previous]);
  }

  return (
    <ComplaintContext.Provider
      value={{
        complaint,
        updateComplaint,
        submittedComplaints,
        addSubmittedComplaint,
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