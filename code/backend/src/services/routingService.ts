export interface DepartmentSuggestion {
  departmentId: string;
  departmentName: string;
  category: string;
  confidence: number;
  priority: "Low" | "Medium" | "Urgent";
  reason: string;
}

export function recommendDepartment(
  title: string,
  description: string,
  explicitCategory?: string
): DepartmentSuggestion {
  const text = `${title} ${description} ${explicitCategory || ""}`.toLowerCase();

  // 1. Roads & Public Works (PWD)
  if (
    text.includes("pothole") ||
    text.includes("road") ||
    text.includes("paver") ||
    text.includes("footpath") ||
    text.includes("sidewalk") ||
    text.includes("asphalt") ||
    text.includes("tar") ||
    text.includes("crater") ||
    text.includes("divider") ||
    explicitCategory === "Pothole / Road"
  ) {
    const isUrgent = text.includes("accident") || text.includes("deep") || text.includes("severe");
    return {
      departmentId: "pwd",
      departmentName: "Roads & Public Works (PWD)",
      category: "Pothole / Road",
      confidence: 0.95,
      priority: isUrgent ? "Urgent" : "Medium",
      reason: "Matched road infrastructure and pavement maintenance keywords.",
    };
  }

  // 2. Electrical & Streetlighting
  if (
    text.includes("streetlight") ||
    text.includes("light") ||
    text.includes("lamp") ||
    text.includes("pole") ||
    text.includes("bulb") ||
    text.includes("dark") ||
    text.includes("wire") ||
    text.includes("blackout") ||
    text.includes("flickering") ||
    explicitCategory === "Streetlight"
  ) {
    return {
      departmentId: "electrical",
      departmentName: "Electrical & Streetlighting",
      category: "Streetlight",
      confidence: 0.92,
      priority: text.includes("spark") || text.includes("danger") ? "Urgent" : "Medium",
      reason: "Matched municipal street lighting and public electrical keywords.",
    };
  }

  // 3. Sanitation (SWM)
  if (
    text.includes("garbage") ||
    text.includes("waste") ||
    text.includes("trash") ||
    text.includes("bin") ||
    text.includes("dump") ||
    text.includes("litter") ||
    text.includes("smell") ||
    text.includes("debris") ||
    text.includes("sweeper") ||
    explicitCategory === "Garbage / Waste"
  ) {
    return {
      departmentId: "swm",
      departmentName: "Sanitation (SWM)",
      category: "Garbage / Waste",
      confidence: 0.94,
      priority: text.includes("overflow") || text.includes("rotten") ? "Medium" : "Low",
      reason: "Matched solid waste management and sanitation keywords.",
    };
  }

  // 4. Water Supply & Drainage
  if (
    text.includes("drain") ||
    text.includes("drainage") ||
    text.includes("water") ||
    text.includes("sewer") ||
    text.includes("pipe") ||
    text.includes("overflow") ||
    text.includes("leak") ||
    text.includes("contamination") ||
    text.includes("sump") ||
    text.includes("flood") ||
    explicitCategory === "Drainage / Water"
  ) {
    const isUrgent = text.includes("flood") || text.includes("sewer") || text.includes("contamination");
    return {
      departmentId: "water",
      departmentName: "Water Supply & Drainage",
      category: "Drainage / Water",
      confidence: 0.91,
      priority: isUrgent ? "Urgent" : "Medium",
      reason: "Matched municipal water supply, stormwater, and drainage keywords.",
    };
  }

  // Default Fallback
  return {
    departmentId: "pwd",
    departmentName: "Roads & Public Works (PWD)",
    category: explicitCategory || "General Civic Issue",
    confidence: 0.6,
    priority: "Medium",
    reason: "Default civic department assignment based on general intake guidelines.",
  };
}

export function calculateSlaTargetDate(priority: string, departmentSlaHours = 48): Date {
  let hours = departmentSlaHours;
  if (priority === "Urgent") hours = 24;
  else if (priority === "Medium") hours = 48;
  else if (priority === "Low") hours = 72;

  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function generateComplaintId(wardCode = "W14"): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `GRV-${year}-${wardCode}-${randomSuffix}`;
}
