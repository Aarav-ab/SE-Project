import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CitizenPortal from "./pages/CitizenPortal";
import ComplaintsLog from "./pages/ComplaintsLog";
import ComplaintStep1 from "./pages/ComplaintStep1";
import ComplaintStep2 from "./pages/ComplaintStep2";
import ComplaintStep3 from "./pages/ComplaintStep3";

import DepartmentPortal from "./pages/DepartmentPortal";
import FieldWorkers from "./pages/FieldWorkers";
import DepartmentAnalytics from "./pages/DepartmentAnalytics";
import { assignComplaintWorker, removeAuthToken } from "./api";

function App() {
  const [currentPage, setCurrentPage] = useState("login");
  const [, setUserRole] = useState<"citizen" | "admin" | null>(null);
  const [preFilledEmail, setPreFilledEmail] = useState("");
  const [authSuccessMsg, setAuthSuccessMsg] = useState("");
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

  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  function startComplaint() {
    setCurrentStep(1);
    setCurrentPage("complaint");
  }

  function handleSignOut() {
    setShowSignOutConfirm(true);
  }

  function confirmSignOut() {
    setShowSignOutConfirm(false);
    removeAuthToken();
    setCurrentStep(1);
    setCurrentPage("login");
    setUserRole(null);
    setPreFilledEmail("");
    setAuthSuccessMsg("");
  }

  function cancelSignOut() {
    setShowSignOutConfirm(false);
  }

  function renderPageContent() {
    if (currentPage === "register") {
      return (
        <Register
          onGoToLogin={(registeredEmail, successMsg) => {
            if (registeredEmail) setPreFilledEmail(registeredEmail);
            if (successMsg) setAuthSuccessMsg(successMsg);
            setCurrentPage("login");
          }}
        />
      );
    }

    if (currentPage === "login") {
      return (
        <Login
          preFilledEmail={preFilledEmail}
          successMessage={authSuccessMsg}
          onLogin={(role) => {
            setUserRole(role);
            setAuthSuccessMsg("");
            setCurrentPage(role === "admin" ? "department" : "portal");
          }}
          onGoToRegister={() => {
            setAuthSuccessMsg("");
            setCurrentPage("register");
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

  return (
    <>
      {renderPageContent()}

      {/* Inbuilt Site Pop-out Box for Sign Out Confirmation */}
      {showSignOutConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 32, 69, 0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) cancelSignOut();
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 420,
              width: "100%",
              padding: "28px 24px 22px",
              textAlign: "center",
              borderRadius: "12px",
              boxShadow: "0 20px 40px rgba(0, 20, 50, 0.25)",
              background: "#ffffff",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "rgba(225, 4, 4, 0.1)",
                color: "#ba1a1a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: "24px",
              }}
            >
              🚪
            </div>

            <h3
              style={{
                margin: "0 0 8px",
                color: "var(--navy)",
                fontSize: "20px",
                fontWeight: 700,
              }}
            >
              Sign Out Confirmation
            </h3>

            <p
              style={{
                margin: "0 0 24px",
                color: "var(--text-body)",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              Are you sure you want to sign out of NagrikConnect? You will need to sign in again to file or track grievances.
            </p>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: "10px" }}
                onClick={cancelSignOut}
              >
                Cancel
              </button>

              <button
                type="button"
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#ba1a1a",
                  color: "#ffffff",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "14px",
                  border: "none",
                  cursor: "pointer",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                onClick={confirmSignOut}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
