import { createContext, useContext, useState, type ReactNode } from "react";

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
};

const ComplaintContext = createContext<ComplaintContextValue | null>(null);

export function ComplaintProvider({ children }: { children: ReactNode }) {
  const [complaint, setComplaint] =
    useState<ComplaintData>(initialComplaintData);

  function updateComplaint(updates: Partial<ComplaintData>) {
    setComplaint((previous) => ({ ...previous, ...updates }));
  }

  return (
    <ComplaintContext.Provider value={{ complaint, updateComplaint }}>
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
