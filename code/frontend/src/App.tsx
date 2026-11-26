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
import { useComplaint } from "./ComplaintContext";

function App() {
  const { user, authLoading, signOut, setAuthError } = useComplaint();
  const [currentPage, setCurrentPage] = useState("login");
  const [crewAssignments, setCrewAssignments] = useState<
    Record<string, string>
  >({});
  const [currentStep, setCurrentStep] = useState(1);
  const [complaintToAssign, setComplaintToAssign] = useState<{
    id: string;
    title: string;
    location: string;
  } | null>(null);
  const activePage =
    currentPage === "login" && user
      ? user.role === "admin" ? "department" : "portal"
      : currentPage;

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [activePage, currentStep]);

  function startComplaint() {
    setCurrentStep(1);
    setCurrentPage("complaint");
  }

  async function handleSignOut() {
    try {
      await signOut();
      setCurrentStep(1);
      setCurrentPage("login");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Could not sign out.");
    }
  }

  if (authLoading) {
    return <main className="auth-loading" aria-live="polite">Checking your session…</main>;
  }

  if (!user) {
    return <Login />;
  }

  // Department Portal pages

  if (activePage === "department") {
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
      />
    );
  }

  if (activePage === "department-analytics") {
    return (
      <DepartmentAnalytics
        onBack={() => setCurrentPage("department")}
        onOpenFieldWorkers={() => setCurrentPage("field-workers")}
        onSignOut={handleSignOut}
      />
    );
  }

  if (activePage === "field-workers") {
    return (
      <FieldWorkers
        onBack={() => {
          setComplaintToAssign(null);
          setCurrentPage("department");
        }}
        onSignOut={handleSignOut}
        onViewComplaint={() => setCurrentPage("department")}
        onDispatch={() => setCurrentPage("department")}
        complaintToAssign={complaintToAssign}
        onAssignCrew={(complaintId, crewName) => {
          setCrewAssignments((current) => ({
            ...current,
            [complaintId]: crewName,
          }));
        }}
        onOpenAnalytics={() => setCurrentPage("department-analytics")}
      />
    );
  }

  // Citizen Portal pages

  if (activePage === "portal") {
    return (
      <CitizenPortal
        onFileComplaint={startComplaint}
        onGoHome={() => setCurrentPage("portal")}
        onTrackComplaints={() => setCurrentPage("complaints")}
        onSignOut={handleSignOut}
      />
    );
  }

  if (activePage === "complaints") {
    return (
      <ComplaintsLog
        onBack={() => setCurrentPage("portal")}
        onFileComplaint={startComplaint}
        onSignOut={handleSignOut}
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
