// NagrikConnect API Client

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: "citizen" | "admin" | "department_staff";
  phone?: string;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  ward?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface ApiTimelineEvent {
  id: string;
  title: string;
  description: string;
  status?: string;
  comment?: string;
  author?: string;
  step: number;
  createdAt: string;
}

export interface ApiAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface ApiFieldWorker {
  id: string;
  name: string;
  initials: string;
  role: string;
  department: string;
  departmentCode: string;
  status: string;
  dotColor: string;
  phone?: string;
  activeTicket: string;
  activeComplaintId: string | null;
  ticketsClosedMonth: number;
  avgResolutionHours: string;
}

export interface ApiComplaint {
  id: string;
  title: string;
  description: string;
  complaintType: string;
  priority: string;
  status: string;
  address: string;
  pinCode?: string;
  landmark?: string;
  latitude?: number | null;
  longitude?: number | null;
  wardId?: string;
  ward?: {
    id: string;
    name: string;
    code: string;
  };
  departmentId?: string;
  department?: {
    id: string;
    name: string;
    code: string;
  };
  assignedWorkerId?: string | null;
  assignedWorker?: {
    id: string;
    name: string;
    initials: string;
    role: string;
  } | null;
  targetCompletion?: string | null;
  resolvedAt?: string | null;
  userId?: string | null;
  attachments?: ApiAttachment[];
  timeline?: ApiTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiAnalytics {
  range?: string;
  summary: {
    totalComplaints: number;
    inProgress: number;
    pendingDispatch: number;
    resolved: number;
    slaComplianceRate: string;
    avgResolutionHours: string;
    avgRating?: string | null;
    ratingCount?: number;
  };
  categoryBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  departmentBreakdown?: {
    id: string;
    name: string;
    code: string;
    total: number;
    resolved: number;
    inProgress: number;
    pending: number;
    percentage: number;
  }[];
  slaTurnaround?: {
    under24hCount: number;
    under24hPct: number;
    between24And48hCount: number;
    between24And48hPct: number;
    breachedCount: number;
    breachedPct: number;
  };
  operations?: {
    totalWorkers: number;
    deployedWorkers: number;
    availableWorkers: number;
    offDutyWorkers: number;
    utilizationPct: number;
    topLocality: string;
    topLocalityCount: number;
    topLocalityPct: number;
    peakReportingWindow: string;
    peakCount: number;
  };
  recentActivity: unknown[];
}

export interface SuggestionResult {
  departmentId: string;
  departmentName: string;
  category: string;
  confidence: number;
  priority: "Low" | "Medium" | "Urgent";
  reason: string;
}

// Token storage helpers
export function getAuthToken(): string | null {
  return localStorage.getItem("nc_token");
}

export function setAuthToken(token: string): void {
  localStorage.setItem("nc_token", token);
}

export function removeAuthToken(): void {
  localStorage.removeItem("nc_token");
  localStorage.removeItem("nc_current_user");
}

export function getCurrentUser(): {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  phone?: string;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
} | null {
  try {
    const raw = localStorage.getItem("nc_current_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getHeaders(isFormData = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// API functions
export async function loginUser(role: "citizen" | "admin", email?: string, password?: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ role, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Authentication failed. Please verify your credentials.");
    }

    if (data.token) {
      setAuthToken(data.token);
    }
    if (data.user) {
      localStorage.setItem("nc_current_user", JSON.stringify(data.user));
    }
    return data;
  } catch (err: unknown) {
    if (err instanceof TypeError && err.message?.includes("fetch")) {
      throw new Error("Cannot connect to backend server. Please ensure the backend is running on port 5000 (cd code/backend && npm start).", { cause: err });
    }
    throw err;
  }
}

export async function registerUser(data: {
  name: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  password: string;
  phone?: string;
}) {
  try {
    const fullAddress = [data.addressLine1, data.addressLine2, data.city, data.state, data.pincode]
      .filter(Boolean)
      .map((s) => s?.trim())
      .join(", ");

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        address: fullAddress,
        addressLine1: data.addressLine1.trim(),
        addressLine2: data.addressLine2 ? data.addressLine2.trim() : null,
        city: data.city.trim(),
        state: data.state.trim(),
        pincode: data.pincode.trim(),
        password: data.password,
        phone: data.phone?.trim() || null,
        role: "citizen",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to register account.");
    }

    return result;
  } catch (err: unknown) {
    if (err instanceof TypeError && err.message?.includes("fetch")) {
      throw new Error("Cannot connect to backend server. Please ensure the backend is running on port 5000 (cd code/backend && npm start).", { cause: err });
    }
    throw err;
  }
}

export async function updateProfileApi(data: {
  name: string;
  phone?: string;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Failed to update profile details.");
    }

    if (result.token) {
      setAuthToken(result.token);
    }
    if (result.user) {
      localStorage.setItem("nc_current_user", JSON.stringify(result.user));
      window.dispatchEvent(new Event("nc_user_updated"));
    }
    return result;
  } catch (err: unknown) {
    if (err instanceof TypeError && err.message?.includes("fetch")) {
      throw new Error("Cannot connect to backend server.", { cause: err });
    }
    throw err;
  }
}

export async function changePasswordApi(
  oldPassword: string,
  newPassword: string,
  email?: string
) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ oldPassword, newPassword, email }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to update password.");
    }
    return data;
  } catch (err: any) {
    if (err.name === "TypeError" && err.message?.includes("fetch")) {
      throw new Error("Cannot connect to backend server.");
    }
    throw err;
  }
}

export async function verifyPasswordApi(
  password: string,
  email?: string
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-password`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ password, email }),
    });
    const data = await response.json();
    return Boolean(data.valid);
  } catch {
    return false;
  }
}

export async function fetchComplaints(filters?: {
  status?: string;
  category?: string;
  departmentId?: string;
  search?: string;
}): Promise<ApiComplaint[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== "All Status" && filters.status !== "All") {
      params.append("status", filters.status);
    }
    if (filters?.category && filters.category !== "All") {
      params.append("category", filters.category);
    }
    if (filters?.departmentId && filters.departmentId !== "All") {
      params.append("departmentId", filters.departmentId);
    }
    if (filters?.search) {
      params.append("search", filters.search);
    }

    const response = await fetch(`${API_BASE_URL}/complaints?${params.toString()}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to load complaints");
    const data = await response.json();
    return data.complaints || [];
  } catch (err) {
    console.warn("Could not fetch complaints from backend:", err);
    return [];
  }
}

export async function fetchComplaintById(id: string): Promise<ApiComplaint | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/${encodeURIComponent(id)}`, {
      headers: getHeaders(),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.complaint || null;
  } catch (err) {
    console.warn(`Could not fetch complaint ${id}:`, err);
    return null;
  }
}

export async function deleteComplaintApi(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return response.ok;
  } catch (err) {
    console.warn(`Could not delete complaint ${id}:`, err);
    return false;
  }
}

export async function submitGrievance(formData: {
  complaintType: string;
  description: string;
  priority: string;
  address: string;
  pinCode: string;
  landmark: string;
  latitude: number | null;
  longitude: number | null;
  ward: string;
  files: File[];
}): Promise<ApiComplaint> {
  const form = new FormData();
  form.append("complaintType", formData.complaintType);
  form.append("description", formData.description);
  form.append("priority", formData.priority);
  form.append("address", formData.address);
  form.append("pinCode", formData.pinCode);
  form.append("landmark", formData.landmark);
  form.append("wardId", "ward-14");

  if (formData.latitude !== null) form.append("latitude", String(formData.latitude));
  if (formData.longitude !== null) form.append("longitude", String(formData.longitude));

  formData.files.forEach((file) => {
    form.append("files", file);
  });

  const response = await fetch(`${API_BASE_URL}/complaints`, {
    method: "POST",
    headers: getHeaders(true),
    body: form,
  });

  if (!response.ok) {
    throw new Error("Grievance submission failed on server.");
  }

  const data = await response.json();
  return data.complaint;
}

export async function updateComplaintStatus(
  id: string,
  status: string,
  comment?: string
): Promise<ApiComplaint | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status, comment }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.complaint || null;
  } catch (err) {
    console.warn(`Could not update status for complaint ${id}:`, err);
    return null;
  }
}

export async function assignComplaintWorker(
  id: string,
  workerName: string,
  comment?: string
): Promise<ApiComplaint | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/${encodeURIComponent(id)}/assign`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ workerName, comment }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.complaint || null;
  } catch (err) {
    console.warn(`Could not assign worker for complaint ${id}:`, err);
    return null;
  }
}

export async function fetchFieldWorkers(): Promise<ApiFieldWorker[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/workers`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to load field workers");
    const data = await response.json();
    return data.workers || [];
  } catch (err) {
    console.warn("Could not fetch field workers:", err);
    return [];
  }
}

export async function createFieldWorker(workerData: {
  name: string;
  role: string;
  department?: string;
  phone?: string;
  status?: string;
}): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/workers`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(workerData),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.worker || null;
  } catch (err) {
    console.warn("Could not create field worker:", err);
    return null;
  }
}

export async function freeFieldWorker(
  id: string
): Promise<{ ok: boolean; unassignedComplaintIds: string[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/workers/${encodeURIComponent(id)}/free`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!response.ok) return { ok: false, unassignedComplaintIds: [] };
    const data = await response.json();
    return {
      ok: true,
      unassignedComplaintIds: Array.isArray(data.unassignedComplaintIds)
        ? data.unassignedComplaintIds
        : [],
    };
  } catch (err) {
    console.warn(`Could not free field worker ${id}:`, err);
    return { ok: false, unassignedComplaintIds: [] };
  }
}

export async function updateFieldWorkerStatus(
  id: string,
  status: string,
  dotColor?: string
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/workers/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status, dotColor }),
    });
    return response.ok;
  } catch (err) {
    console.warn(`Could not update status for field worker ${id}:`, err);
    return false;
  }
}

export async function fetchAnalytics(range = "all"): Promise<ApiAnalytics | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/analytics?range=${encodeURIComponent(range)}`,
      {
        headers: getHeaders(),
      }
    );
    if (!response.ok) throw new Error("Failed to load analytics");
    return await response.json();
  } catch (err) {
    console.warn("Could not fetch analytics:", err);
    return null;
  }
}

export async function getAiSuggestion(
  title: string,
  description: string,
  category?: string
): Promise<SuggestionResult | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/civic/suggest`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ title, description, category }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.suggestion || null;
  } catch (err) {
    console.warn("Could not fetch AI suggestion:", err);
    return null;
  }
}
