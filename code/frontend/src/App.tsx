import { useEffect, useState } from "react";
import Login from "./pages/Login";
import CitizenPortal from "./pages/CitizenPortal";
import ComplaintsLog from "./pages/ComplaintsLog";
import ComplaintStep1 from "./pages/ComplaintStep1";
import ComplaintStep2 from "./pages/ComplaintStep2";
import ComplaintStep3 from "./pages/ComplaintStep3";

import DepartmentPortal from "./pages/DepartmentPortal";
import FieldWorkers from "./pages/FieldWorkers";
import DepartmentAnalytics from "./pages/DepartmentAnalytics";
import { assignComplaintWorker } from "./api";

function App() {
  const [currentPage, setCurrentPage] = useState("login");
  const [, setUserRole] = useState<"citizen" | "admin" | null>(null);
  const [crewAssignments, setCrewAssignments] = useState<
    Record<string, string>
  >(() => {
    try {
      const saved = localStorage.getItem("nc_crew_assignments");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [, setSelectedComplaintId] = useState("");
  const [complaintToAssign, setComplaintToAssign] = useState<{
    id: string;
    title: string;
    location: string;
  } | null>(null);

  const handleCrewAssignment = async (complaintId: string, crewName: string) => {
    setCrewAssignments((current) => {
      const updated = {
        ...current,
        [complaintId]: crewName,
      };
      localStorage.setItem("nc_crew_assignments", JSON.stringify(updated));
      return updated;
    });

    try {
      await assignComplaintWorker(complaintId, crewName);
    } catch (e) {
      console.warn("Failed to persist crew assignment to backend:", e);
    }
  };

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [currentPage, currentStep]);

  function startComplaint() {
    setCurrentStep(1);
    setCurrentPage("complaint");
  }

  function handleSignOut() {
    setCurrentStep(1);
    setCurrentPage("login");
    setUserRole(null);
  }

  if (currentPage === "login") {
    return (
      <Login
        onLogin={(role) => {
          setUserRole(role);
          setCurrentPage(role === "admin" ? "department" : "portal");
        }}
      />
    );
  }

  // Department Portal pages

  if (currentPage === "department") {
    return (
      <DepartmentPortal
        onSignOut={handleSignOut}
        onOpenFieldWorkers={() => setCurrentPage("field-workers")}
        onOpenAnalytics={() => setCurrentPage("department-analytics")}
        onAssignComplaint={(complaint) => {
          setComplaintToAssign({
            id: complaint.id,
            title: complaint.title,
            location: complaint.location,
          });
          setCurrentPage("field-workers");
        }}
        crewAssignments={crewAssignments}
        onUpdateCrewAssignment={handleCrewAssignment}
      />
    );
  }

  if (currentPage === "department-analytics") {
    return (
      <DepartmentAnalytics
        onBack={() => setCurrentPage("department")}
        onOpenFieldWorkers={() => setCurrentPage("field-workers")}
        onSignOut={handleSignOut}
      />
    );
  }

  if (currentPage === "field-workers") {
    return (
      <FieldWorkers
        onBack={() => {
          setComplaintToAssign(null);
          setCurrentPage("department");
        }}
        onSignOut={handleSignOut}
        onViewComplaint={(id) => {
          setSelectedComplaintId(id);
          setCurrentPage("department");
        }}
        onDispatch={() => setCurrentPage("department")}
        complaintToAssign={complaintToAssign}
        onAssignCrew={handleCrewAssignment}
        onOpenAnalytics={() => setCurrentPage("department-analytics")}
      />
    );
  }

  // Citizen Portal pages

  if (currentPage === "portal") {
    return (
      <CitizenPortal
        onFileComplaint={startComplaint}
        onGoHome={() => setCurrentPage("portal")}
        onTrackComplaints={() => setCurrentPage("complaints")}
        onSignOut={handleSignOut}
      />
    );
  }

  if (currentPage === "complaints") {
    return (
      <ComplaintsLog
        onBack={() => setCurrentPage("portal")}
        onFileComplaint={startComplaint}
        onSignOut={handleSignOut}
        onViewComplaint={(complaintId) => {
          setSelectedComplaintId(complaintId);
          setCurrentPage("timeline");
        }}
      />
    );
  }

  switch (currentStep) {
    case 1:
      return (
        <ComplaintStep1
          onNext={() => setCurrentStep(2)}
          onCancel={() => setCurrentPage("portal")}
          onTrackComplaints={() => setCurrentPage("complaints")}
          onSignOut={handleSignOut}
        />
      );

    case 2:
      return (
        <ComplaintStep2
          onNext={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
          onCancel={() => setCurrentPage("portal")}
          onGoToStep1={() => setCurrentStep(1)}
          onTrackComplaints={() => setCurrentPage("complaints")}
          onSignOut={handleSignOut}
        />
      );

    case 3:
      return (
        <ComplaintStep3
          onBack={() => setCurrentStep(2)}
          onCancel={() => setCurrentPage("portal")}
          onGoToStep1={() => setCurrentStep(1)}
          onTrackComplaints={() => setCurrentPage("complaints")}
          onSignOut={handleSignOut}
        />
      );

    default:
      return (
        <ComplaintStep1
          onNext={() => setCurrentStep(2)}
          onCancel={() => setCurrentPage("portal")}
          onTrackComplaints={() => setCurrentPage("complaints")}
          onSignOut={handleSignOut}
        />
      );
  }
}

export default App;
