import { useEffect, useState } from "react";
import Login from "./pages/Login";
import CitizenPortal from "./pages/CitizenPortal";
import ComplaintsLog from "./pages/ComplaintsLog";
import ComplaintStep1 from "./pages/ComplaintStep1";
import ComplaintStep2 from "./pages/ComplaintStep2";
import ComplaintStep3 from "./pages/ComplaintStep3";

import DepartmentPortal from "./pages/DepartmentPortal";
import FieldWorkers from "./pages/FieldWorkers";

function App() {
  const [currentPage, setCurrentPage] = useState("login");
  const [userRole, setUserRole] = useState<"citizen" | "admin" | null>(null);
  const [crewAssignments, setCrewAssignments] = useState<
    Record<string, string>
  >({});
  const [currentStep, setCurrentStep] = useState(1);
  const [, setSelectedComplaintId] = useState("");
  const [complaintToAssign, setComplaintToAssign] = useState<{
    id: string;
    title: string;
    location: string;
  } | null>(null);

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
        onUpdateCrewAssignment={(complaintId, crewName) => {
          setCrewAssignments((current) => ({
            ...current,
            [complaintId]: crewName,
          }));
        }}
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
        onAssignCrew={(complaintId, crewName) => {
          setCrewAssignments((current) => ({
            ...current,
            [complaintId]: crewName,
          }));
        }}
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
