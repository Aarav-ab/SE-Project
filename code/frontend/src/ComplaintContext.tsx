/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "citizen" | "admin";
};

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

export type ComplaintAttachment = {
  id: number | string;
  name: string;
  type: string;
  size: number;
};

export type SubmittedComplaint = Omit<ComplaintData, "files"> & {
  id: string;
  submittedAt: string;
  status: string;
  department: string;
  feedback: string;
  attachments: ComplaintAttachment[];
  reporterName?: string;
  reporterEmail?: string;
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
  addSubmittedComplaint: (complaint: ComplaintData) => Promise<SubmittedComplaint>;
  updateSubmittedComplaint: (
    id: string,
    status: string,
    feedback: string,
  ) => Promise<void>;
  user: User | null;
  authLoading: boolean;
  authError: string;
  setAuthError: (message: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshComplaints: () => Promise<void>;
};

const ComplaintContext = createContext<ComplaintContextValue | null>(null);

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: "include",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${response.status}).`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function ComplaintProvider({ children }: { children: ReactNode }) {
  const [complaint, setComplaint] = useState<ComplaintData>(initialComplaintData);
  const [submittedComplaints, setSubmittedComplaints] = useState<SubmittedComplaint[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const refreshComplaints = useCallback(async () => {
    if (!user) {
      return;
    }
    const result = await apiRequest<{ complaints: SubmittedComplaint[] }>("/complaints");
    setSubmittedComplaints(result.complaints);
  }, [user]);

  useEffect(() => {
    let active = true;
    apiRequest<{ user: User }>("/auth/me")
      .then(({ user: currentUser }) => {
        if (active) setUser(currentUser);
      })
      .catch((error: unknown) => {
        if (active && error instanceof Error && !error.message.includes("Not signed in")) {
          setAuthError(error.message);
        }
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
    let active = true;
    async function loadComplaints() {
      try {
        const result = await apiRequest<{ complaints: SubmittedComplaint[] }>("/complaints");
        if (active) setSubmittedComplaints(result.complaints);
      } catch (error) {
        if (active) {
          setAuthError(error instanceof Error ? error.message : "Could not load complaints.");
        }
      }
    }
    void loadComplaints();
    return () => {
      active = false;
    };
  }, [user]);

  async function login(email: string, password: string) {
    setAuthError("");
    const result = await apiRequest<{ user: User }>("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setUser(result.user);
  }

  async function register(name: string, email: string, password: string) {
    setAuthError("");
    const result = await apiRequest<{ user: User }>("/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setUser(result.user);
  }

  async function signOut() {
    await apiRequest<void>("/auth/logout", { method: "POST" });
    setUser(null);
    setSubmittedComplaints([]);
    setComplaint(initialComplaintData);
  }

  async function addSubmittedComplaint(data: ComplaintData) {
    const formData = new FormData();
    formData.set("complaintType", data.complaintType);
    formData.set("description", data.description);
    formData.set("priority", data.priority);
    formData.set("address", data.address);
    formData.set("pinCode", data.pinCode);
    formData.set("landmark", data.landmark);
    formData.set("ward", data.ward);
    if (data.latitude !== null) formData.set("latitude", String(data.latitude));
    if (data.longitude !== null) formData.set("longitude", String(data.longitude));
    data.files.forEach((file) => formData.append("files", file));
    const result = await apiRequest<{ complaint: SubmittedComplaint }>("/complaints", {
      method: "POST",
      body: formData,
    });
    setSubmittedComplaints((previous) => [result.complaint, ...previous]);
    return result.complaint;
  }

  async function updateSubmittedComplaint(id: string, status: string, feedback: string) {
    const result = await apiRequest<{ complaint: SubmittedComplaint }>(`/complaints/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, feedback }),
    });
    setSubmittedComplaints((previous) =>
      previous.map((item) => item.id === id ? result.complaint : item),
    );
  }

  function updateComplaint(updates: Partial<ComplaintData>) {
    setComplaint((previous) => ({ ...previous, ...updates }));
  }

  return (
    <ComplaintContext.Provider
      value={{
        complaint,
        updateComplaint,
        submittedComplaints,
        addSubmittedComplaint,
        updateSubmittedComplaint,
        user,
        authLoading,
        authError,
        setAuthError,
        login,
        register,
        signOut,
        refreshComplaints,
      }}
    >
      {children}
      {user && authError && (
        <div className="global-error" role="alert">
          <span>{authError}</span>
          <button type="button" onClick={() => setAuthError("")} aria-label="Dismiss error">×</button>
        </div>
      )}
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
