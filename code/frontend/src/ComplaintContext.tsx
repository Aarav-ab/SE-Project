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

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  houseFlatNumber: string;
  streetLocality: string;
  areaWard: string;
  city: string;
  state: string;
  pinCode: string;
  landmark: string;
  preferredLanguage: "English" | "Hindi";
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
  complaintsLoading: boolean;
  addSubmittedComplaint: (complaint: ComplaintData) => Promise<SubmittedComplaint>;
  updateSubmittedComplaint: (
    id: string,
    status: string,
    feedback: string,
  ) => Promise<void>;
  user: User | null;
  profile: UserProfile | null;
  profileOpen: boolean;
  profileLoading: boolean;
  profileError: string;
  profileSaved: boolean;
  openMyAccount: () => void;
  closeMyAccount: () => void;
  loadProfile: () => Promise<UserProfile>;
  saveProfile: (profile: UserProfile) => Promise<void>;
  prepareComplaintAddress: () => Promise<void>;
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
  const [complaintRecords, setComplaintRecords] = useState<SubmittedComplaint[]>([]);
  const [complaintsUserId, setComplaintsUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const submittedComplaints =
    user && complaintsUserId === user.id ? complaintRecords : [];
  const complaintsLoading = Boolean(user && complaintsUserId !== user.id);

  const refreshComplaints = useCallback(async () => {
    if (!user) {
      return;
    }
    const result = await apiRequest<{ complaints: SubmittedComplaint[] }>("/complaints");
    setComplaintRecords(result.complaints);
    setComplaintsUserId(user.id);
  }, [user]);

  async function loadProfile() {
    setProfileLoading(true);
    setProfileError("");
    try {
      const result = await apiRequest<{ profile: UserProfile }>("/profile");
      setProfile(result.profile);
      return result.profile;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load your profile.";
      setProfileError(message);
      throw error;
    } finally {
      setProfileLoading(false);
    }
  }

  function openMyAccount() {
    setProfileSaved(false);
    setProfileError("");
    setProfile(null);
    setProfileOpen(true);
    void loadProfile().catch(() => undefined);
  }

  function closeMyAccount() {
    setProfileOpen(false);
    setProfileError("");
    setProfileSaved(false);
  }

  async function saveProfile(updatedProfile: UserProfile) {
    setProfileError("");
    setProfileSaved(false);
    try {
      const result = await apiRequest<{ profile: UserProfile }>("/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: updatedProfile.name,
          mobileNumber: updatedProfile.mobileNumber,
          houseFlatNumber: updatedProfile.houseFlatNumber,
          streetLocality: updatedProfile.streetLocality,
          areaWard: updatedProfile.areaWard,
          city: updatedProfile.city,
          state: updatedProfile.state,
          pinCode: updatedProfile.pinCode,
          landmark: updatedProfile.landmark,
          preferredLanguage: updatedProfile.preferredLanguage,
        }),
      });
      setProfile(result.profile);
      setUser((current) => current
        ? { ...current, name: result.profile.name, email: result.profile.email }
        : current);
      setProfileSaved(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save your profile.";
      setProfileError(message);
      throw error;
    }
  }

  async function prepareComplaintAddress() {
    const savedProfile = await loadProfile();
    const address = [
      savedProfile.houseFlatNumber,
      savedProfile.streetLocality,
      savedProfile.areaWard,
      savedProfile.city,
      savedProfile.state,
    ].filter(Boolean).join(", ");
    setComplaint((previous) => ({
      ...initialComplaintData,
      address,
      pinCode: savedProfile.pinCode,
      landmark: savedProfile.landmark,
      complaintType: previous.complaintType,
      priority: previous.priority,
    }));
  }

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
    const userId = user.id;
    let active = true;
    async function loadComplaints() {
      try {
        const result = await apiRequest<{ complaints: SubmittedComplaint[] }>("/complaints");
        if (active) {
          setComplaintRecords(result.complaints);
          setComplaintsUserId(userId);
        }
      } catch (error) {
        if (active) {
          setAuthError(error instanceof Error ? error.message : "Could not load complaints.");
          setComplaintsUserId(userId);
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
    setProfile(null);
    setProfileOpen(false);
    setComplaintRecords([]);
    setComplaintsUserId(null);
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
    setComplaintRecords((previous) =>
      [result.complaint, ...(complaintsUserId === user?.id ? previous : [])],
    );
    setComplaintsUserId(user?.id ?? null);
    return result.complaint;
  }

  async function updateSubmittedComplaint(id: string, status: string, feedback: string) {
    const result = await apiRequest<{ complaint: SubmittedComplaint }>(`/complaints/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, feedback }),
    });
    setComplaintRecords((previous) =>
      complaintsUserId === user?.id
        ? previous.map((item) => item.id === id ? result.complaint : item)
        : previous,
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
        complaintsLoading,
        addSubmittedComplaint,
        updateSubmittedComplaint,
        user,
        profile,
        profileOpen,
        profileLoading,
        profileError,
        profileSaved,
        openMyAccount,
        closeMyAccount,
        loadProfile,
        saveProfile,
        prepareComplaintAddress,
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
