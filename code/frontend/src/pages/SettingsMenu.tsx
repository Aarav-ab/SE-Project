import { useState, useRef, useEffect } from "react";
import { getCurrentUser } from "../api";
import ChangePasswordModal from "./ChangePasswordModal";
import EditProfileModal from "./EditProfileModal";

export function useUserProfile() {
  const [user, setUser] = useState(() => getCurrentUser());

  useEffect(() => {
    function handleUpdate() {
      setUser(getCurrentUser());
    }
    window.addEventListener("nc_user_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("nc_user_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return user;
}

export default function SettingsMenu({
  onSignOut,
}: {
  onSignOut: () => void;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setSettingsOpen(false);
      }
    }
    if (settingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [settingsOpen]);

  return (
    <>
      <div style={{ position: "relative" }} ref={settingsRef}>
        <button
          type="button"
          className="btn-settings"
          title="Account Settings"
          aria-label="Settings"
          onClick={() => setSettingsOpen((prev) => !prev)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: settingsOpen ? "var(--blue-100)" : "#ffffff",
            color: "var(--navy)",
            cursor: "pointer",
            transition: "all 0.15s ease",
            padding: 0,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {settingsOpen && (
          <div
            className="settings-dialog-popup"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: "215px",
              background: "#ffffff",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              boxShadow: "0 10px 25px rgba(0, 32, 69, 0.14)",
              padding: "6px",
              zIndex: 1000,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div
              style={{
                padding: "8px 10px 6px",
                borderBottom: "1px solid var(--border-soft)",
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Settings
            </div>

            <button
              type="button"
              onClick={() => {
                setSettingsOpen(false);
                setShowEditProfile(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "6px",
                width: "100%",
                textAlign: "left",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--navy)",
                background: "transparent",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--blue-50)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span style={{ fontSize: "16px" }}>👤</span>
              <span>Edit Profile Details</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSettingsOpen(false);
                setShowChangePassword(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "6px",
                width: "100%",
                textAlign: "left",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--navy)",
                background: "transparent",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--blue-50)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span style={{ fontSize: "16px" }}>🔑</span>
              <span>Change Password</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSettingsOpen(false);
                onSignOut();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "6px",
                width: "100%",
                textAlign: "left",
                fontSize: "13px",
                fontWeight: 600,
                color: "#ba1a1a",
                background: "transparent",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#fff0f0")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span style={{ fontSize: "16px" }}>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </>
  );
}
