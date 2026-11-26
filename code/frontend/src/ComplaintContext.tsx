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
  ward: "",
  complaintType: "Pothole / Road",
  description: "",
  priority: "Medium",
};

export function isProfileComplete(
  profile: Pick<UserProfile, "name" | "mobileNumber" | "houseFlatNumber" | "streetLocality" | "areaWard" | "city" | "state" | "pinCode">,
) {
  return Boolean(
    profile.name.trim() &&
    /^(?:\+?91[\s-]?)?[6-9]\d{9}$/.test(profile.mobileNumber.trim()) &&
    profile.houseFlatNumber.trim() &&
    profile.streetLocality.trim() &&
    profile.areaWard.trim() &&
    profile.city.trim() &&
    profile.state.trim() &&
    /^\d{6}$/.test(profile.pinCode.trim()),
  );
}

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
  profileCompletionRequired: boolean;
  profileLoading: boolean;
  profileError: string;
  profileSaved: boolean;
  openMyAccount: () => void;
  beginProfileCompletion: (resumeComplaint?: boolean) => void;
  completeProfileSetup: () => void;
  closeMyAccount: () => void;
  loadProfile: () => Promise<UserProfile>;
  saveProfile: (profile: UserProfile, complete?: boolean) => Promise<void>;
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
  const [profileCompletionRequired, setProfileCompletionRequired] = useState(false);
  const [resumeComplaintAfterProfile, setResumeComplaintAfterProfile] = useState(false);
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

  const loadProfile = useCallback(async () => {
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
  }, []);

  function openMyAccount() {
    setProfileSaved(false);
    setProfileError("");
    setProfile(null);
    setProfileOpen(true);
    void loadProfile().catch(() => undefined);
  }

  const beginProfileCompletion = useCallback((resumeComplaint = false) => {
    setProfileCompletionRequired(true);
    setResumeComplaintAfterProfile(resumeComplaint);
    setProfileSaved(false);
    setProfileError("");
    setProfileOpen(true);
  }, []);

  const completeProfileSetup = useCallback(() => {
    if (resumeComplaintAfterProfile) {
      window.dispatchEvent(new Event("nagrikconnect:profile-complete"));
    }
    setProfileCompletionRequired(false);
    setResumeComplaintAfterProfile(false);
    setProfileOpen(false);
    setProfileError("");
  }, [resumeComplaintAfterProfile]);

  function closeMyAccount() {
    setProfileOpen(false);
    setProfileError("");
    setProfileSaved(false);
  }

  async function saveProfile(updatedProfile: UserProfile, complete = false) {
    setProfileError("");
    setProfileSaved(false);
    try {
      const result = await apiRequest<{ profile: UserProfile }>(
        complete ? "/profile/complete" : "/profile",
        {
        method: complete ? "POST" : "PATCH",
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

  const prepareComplaintAddress = useCallback(async () => {
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
  }, [loadProfile]);

  useEffect(() => {
    let active = true;
    apiRequest<{ user: User }>("/auth/me")
      .then(({ user: currentUser }) => {
        if (active) {
          setUser(currentUser);
          const redirectUrl = new URL(window.location.href);
          if (redirectUrl.searchParams.get("completeProfile") === "1") {
            redirectUrl.searchParams.delete("completeProfile");
            window.history.replaceState({}, "", redirectUrl);
            setProfileCompletionRequired(true);
            setProfileOpen(true);
            void loadProfile().catch(() => undefined);
          }
        }
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
  }, [loadProfile]);

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
    beginProfileCompletion();
    await loadProfile();
  }

  async function signOut() {
    await apiRequest<void>("/auth/logout", { method: "POST" });
    setUser(null);
    setProfile(null);
    setProfileOpen(false);
    setProfileCompletionRequired(false);
    setResumeComplaintAfterProfile(false);
    setComplaintRecords([]);
    setComplaintsUserId(null);
    setComplaint(initialComplaintData);
  }

  async function addSubmittedComplaint(data: ComplaintData) {
    if (user?.role === "citizen") {
      const currentProfile = await loadProfile();
      if (!isProfileComplete(currentProfile)) {
        beginProfileCompletion(true);
        throw new Error("Complete your required profile details before submitting a complaint.");
      }
    }
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
        profileCompletionRequired,
        profileLoading,
        profileError,
        profileSaved,
        openMyAccount,
        beginProfileCompletion,
        completeProfileSetup,
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
