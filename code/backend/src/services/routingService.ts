export interface DepartmentSuggestion {
  departmentId: string;
  departmentName: string;
  category: string;
  confidence: number;
  priority: "Low" | "Medium" | "Urgent";
  reason: string;
}

const CATEGORY_ROUTING: Record<
  string,
  { departmentId: string; departmentName: string; category: string; reason: string }
> = {
  "pothole / road": {
    departmentId: "pwd",
    departmentName: "Roads & Public Works (PWD)",
    category: "Pothole / Road",
    reason: "Routed by selected category to Roads & Public Works (PWD).",
  },
  streetlight: {
    departmentId: "electrical",
    departmentName: "Electrical & Streetlighting",
    category: "Streetlight",
    reason: "Routed by selected category to Electrical & Streetlighting.",
  },
  "garbage / waste": {
    departmentId: "swm",
    departmentName: "Sanitation (SWM)",
    category: "Garbage / Waste",
    reason: "Routed by selected category to Sanitation (SWM).",
  },
  garbage: {
    departmentId: "swm",
    departmentName: "Sanitation (SWM)",
    category: "Garbage / Waste",
    reason: "Routed by selected category to Sanitation (SWM).",
  },
  "drainage / water": {
    departmentId: "water",
    departmentName: "Water Supply & Drainage",
    category: "Drainage / Water",
    reason: "Routed by selected category to Water Supply & Drainage.",
  },
  drainage: {
    departmentId: "water",
    departmentName: "Water Supply & Drainage",
    category: "Drainage / Water",
    reason: "Routed by selected category to Water Supply & Drainage.",
  },
  "water supply": {
    departmentId: "water",
    departmentName: "Water Supply & Drainage",
    category: "Drainage / Water",
    reason: "Routed by selected category to Water Supply & Drainage.",
  },
};

function inferPriority(departmentId: string, text: string): "Low" | "Medium" | "Urgent" {
  if (
    departmentId === "pwd" &&
    (text.includes("accident") || text.includes("deep") || text.includes("severe"))
  ) {
    return "Urgent";
  }
  if (
    departmentId === "electrical" &&
    (text.includes("spark") || text.includes("danger") || text.includes("shock"))
  ) {
    return "Urgent";
  }
  if (
    departmentId === "water" &&
    (text.includes("flood") || text.includes("sewer") || text.includes("contamination"))
  ) {
    return "Urgent";
  }
  if (departmentId === "swm") {
    return text.includes("overflow") || text.includes("rotten") ? "Medium" : "Low";
  }
  return "Medium";
}

export function recommendDepartment(
  title: string,
  description: string,
  explicitCategory?: string
): DepartmentSuggestion {
  const descAndTitle = `${description} ${title}`.toLowerCase();

  // Honor explicit category selection first so street names (e.g. "Nabha Road") never override it
  const normalizedCategory = explicitCategory?.trim().toLowerCase();
  if (normalizedCategory && CATEGORY_ROUTING[normalizedCategory]) {
    const matched = CATEGORY_ROUTING[normalizedCategory];
    return {
      ...matched,
      confidence: 0.98,
      priority: inferPriority(matched.departmentId, descAndTitle),
    };
  }

  // Fallback keyword classification prefers description over title/address
  const text = `${description} ${title} ${explicitCategory || ""}`.toLowerCase();

  // 1. Electrical & Streetlighting
  if (
    text.includes("streetlight") ||
    text.includes("light") ||
    text.includes("lamp") ||
    text.includes("pole") ||
    text.includes("bulb") ||
    text.includes("dark") ||
    text.includes("wire") ||
    text.includes("blackout") ||
    text.includes("flickering")
  ) {
    return {
      departmentId: "electrical",
      departmentName: "Electrical & Streetlighting",
      category: "Streetlight",
      confidence: 0.92,
      priority: inferPriority("electrical", text),
      reason: "Matched municipal street lighting and public electrical keywords.",
    };
  }

  // 2. Sanitation (SWM)
  if (
    text.includes("garbage") ||
    text.includes("waste") ||
    text.includes("trash") ||
    text.includes("bin") ||
    text.includes("dump") ||
    text.includes("litter") ||
    text.includes("smell") ||
    text.includes("debris") ||
    text.includes("sweeper")
  ) {
    return {
      departmentId: "swm",
      departmentName: "Sanitation (SWM)",
      category: "Garbage / Waste",
      confidence: 0.94,
      priority: inferPriority("swm", text),
      reason: "Matched solid waste management and sanitation keywords.",
    };
  }

  // 3. Water Supply & Drainage
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
    text.includes("flood")
  ) {
    return {
      departmentId: "water",
      departmentName: "Water Supply & Drainage",
      category: "Drainage / Water",
      confidence: 0.91,
      priority: inferPriority("water", text),
      reason: "Matched municipal water supply, stormwater, and drainage keywords.",
    };
  }

  // 4. Roads & Public Works (PWD)
  if (
    text.includes("pothole") ||
    text.includes("road") ||
    text.includes("paver") ||
    text.includes("footpath") ||
    text.includes("sidewalk") ||
    text.includes("asphalt") ||
    text.includes("tar") ||
    text.includes("crater") ||
    text.includes("divider")
  ) {
    return {
      departmentId: "pwd",
      departmentName: "Roads & Public Works (PWD)",
      category: "Pothole / Road",
      confidence: 0.95,
      priority: inferPriority("pwd", text),
      reason: "Matched road infrastructure and pavement maintenance keywords.",
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
