// NagrikConnect API Client

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: "citizen" | "admin" | "department_staff";
  phone?: string;
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
  attachments?: ApiAttachment[];
  timeline?: ApiTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiAnalytics {
  summary: {
    totalComplaints: number;
    inProgress: number;
    pendingDispatch: number;
    resolved: number;
    slaComplianceRate: string;
    avgResolutionHours: string;
  };
  categoryBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  recentActivity: any[];
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
    return data;
  } catch (err: any) {
    if (err.name === "TypeError" && err.message?.includes("fetch")) {
      throw new Error("Cannot connect to backend server. Please ensure the backend is running on port 5000 (cd code/backend && npm start).");
    }
    throw err;
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

export async function freeFieldWorker(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/workers/${encodeURIComponent(id)}/free`, {
      method: "POST",
      headers: getHeaders(),
    });
    return response.ok;
  } catch (err) {
    console.warn(`Could not free field worker ${id}:`, err);
    return false;
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

export async function fetchAnalytics(): Promise<ApiAnalytics | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics`, {
      headers: getHeaders(),
    });
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
