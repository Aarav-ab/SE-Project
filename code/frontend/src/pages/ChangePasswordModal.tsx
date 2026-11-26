import { useState } from "react";
import { changePasswordApi, verifyPasswordApi, getCurrentUser } from "../api";

type ChangePasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [oldPasswordError, setOldPasswordError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const currentUser = getCurrentUser();

  // Password validity criteria
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isNewPasswordValid =
    hasMinLength && hasUpperCase && hasNumber && hasSpecial;
  const isConfirmMatch =
    newPassword.length > 0 && newPassword === confirmNewPassword;

  if (!isOpen) return null;

  const handleVerifyOldPassword = async () => {
    if (!oldPassword.trim()) return;
    try {
      const isValid = await verifyPasswordApi(
        oldPassword.trim(),
        currentUser?.email
      );
      if (!isValid) {
        setOldPasswordError(
          "Current password does not match. Please verify your old password."
        );
        setError("Current password does not match. Please verify your old password.");
      } else {
        setOldPasswordError("");
        if (error.includes("Current password")) setError("");
      }
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setOldPasswordError("");
    setSuccess("");

    if (!oldPassword) {
      setOldPasswordError("Please enter your current password.");
      setError("Please enter your current password.");
      return;
    }

    // Verify current password first immediately
    try {
      const isOldValid = await verifyPasswordApi(
        oldPassword.trim(),
        currentUser?.email
      );
      if (!isOldValid) {
        setOldPasswordError(
          "Current password does not match. Please enter your correct existing password."
        );
        setError("Current password does not match. Please verify your old password.");
        return;
      }
    } catch (e: any) {
      console.warn("Verify check failed, will defer to changePassword:", e);
    }

    if (!isNewPasswordValid) {
      setError(
        "New password must be at least 8 characters long, contain at least 1 capital letter, 1 number, and 1 special character."
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match. Please verify both password fields.");
      return;
    }

    if (oldPassword === newPassword) {
      setError("New password cannot be identical to your current password.");
      return;
    }

    setLoading(true);

    try {
      await changePasswordApi(
        oldPassword.trim(),
        newPassword.trim(),
        currentUser?.email
      );

      setSuccess("✓ Password updated successfully!");
      setTimeout(() => {
        setOldPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setSuccess("");
        onClose();
      }, 1200);
    } catch (err: any) {
      const msg = err?.message || "Failed to update password. Please try again.";
      setError(msg);
      if (msg.toLowerCase().includes("current password")) {
        setOldPasswordError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
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
        zIndex: 2000,
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card login-card"
        style={{
          maxWidth: 440,
          width: "100%",
          position: "relative",
          boxShadow: "0 20px 40px rgba(0, 20, 50, 0.22)",
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            background: "none",
            border: "none",
            fontSize: "18px",
            cursor: "pointer",
            color: "var(--text-muted)",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--blue-50)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          ✕
        </button>

        <h1>Change Password</h1>

        <p className="login-sub">
          Update your citizen account password securely
        </p>

        {/* Success Banner */}
        {success && (
          <div
            style={{
              background: "rgba(97, 177, 95, 0.12)",
              color: "#2e7d32",
              border: "1px solid rgba(97, 177, 95, 0.35)",
              borderRadius: "8px",
              padding: "10px 14px",
              marginBottom: "16px",
              fontSize: "14px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div
            className="complaint-error"
            style={{
              marginTop: 0,
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Current Password */}
          <div className="field">
            <label>
              Current Password <span className="req">*</span>
            </label>

            <div className="input-wrap">
              <span className="icon">
                <svg
                  width="12"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </span>

              <input
                type="password"
                placeholder="Enter your current password"
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value);
                  if (oldPasswordError) setOldPasswordError("");
                  if (error.includes("Current password")) setError("");
                }}
                onBlur={handleVerifyOldPassword}
                required
              />
            </div>

            {oldPasswordError && (
              <span
                style={{
                  color: "#d32f2f",
                  fontSize: "12px",
                  marginTop: "4px",
                  display: "block",
                  fontWeight: 600,
                }}
              >
                ⚠️ {oldPasswordError}
              </span>
            )}
          </div>

          {/* New Password */}
          <div className="field">
            <label>
              New Password <span className="req">*</span>
            </label>

            <div className="input-wrap">
              <span className="icon">
                <svg
                  width="12"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </span>

              <input
                type="password"
                placeholder="Min. 8 chars, 1 uppercase, 1 number, 1 symbol"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error && !error.includes("Current password")) setError("");
                }}
                required
              />
            </div>

            {newPassword.length > 0 && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "8px 12px",
                  background: "var(--blue-50)",
                  borderRadius: "6px",
                  fontSize: "12px",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: "4px",
                    color: "var(--navy)",
                  }}
                >
                  Password requirements:
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      color: hasMinLength ? "#2e7d32" : "#777",
                      fontWeight: hasMinLength ? 600 : 400,
                    }}
                  >
                    {hasMinLength ? "✓" : "○"} Min. 8 characters
                  </div>
                  <div
                    style={{
                      color: hasUpperCase ? "#2e7d32" : "#777",
                      fontWeight: hasUpperCase ? 600 : 400,
                    }}
                  >
                    {hasUpperCase ? "✓" : "○"} 1 capital letter (A-Z)
                  </div>
                  <div
                    style={{
                      color: hasNumber ? "#2e7d32" : "#777",
                      fontWeight: hasNumber ? 600 : 400,
                    }}
                  >
                    {hasNumber ? "✓" : "○"} 1 number (0-9)
                  </div>
                  <div
                    style={{
                      color: hasSpecial ? "#2e7d32" : "#777",
                      fontWeight: hasSpecial ? 600 : 400,
                    }}
                  >
                    {hasSpecial ? "✓" : "○"} 1 special char (!@#$...)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="field">
            <label>
              Confirm New Password <span className="req">*</span>
            </label>

            <div className="input-wrap">
              <span className="icon">
                <svg
                  width="12"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </span>

              <input
                type="password"
                placeholder="Re-enter new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>

            {confirmNewPassword.length > 0 && (
              <span
                style={{
                  color: isConfirmMatch ? "#2e7d32" : "#d32f2f",
                  fontSize: "12px",
                  marginTop: "4px",
                  display: "block",
                  fontWeight: 600,
                }}
              >
                {isConfirmMatch
                  ? "✓ Passwords match"
                  : "✕ Passwords do not match"}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <button
            type="submit"
            className="btn btn-navy btn-block mt-3"
            disabled={loading}
            style={{ marginTop: "16px" }}
          >
            {loading ? "Updating Password..." : "Update Password →"}
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={onClose}
            style={{ marginTop: "8px" }}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
