import { useState } from "react";
import { registerUser } from "../api";

type RegisterProps = {
  onGoToLogin: (registeredEmail?: string, successMsg?: string) => void;
};

function Register({ onGoToLogin }: RegisterProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Email and Password validity rules
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isEmailValid = emailRegex.test(email.trim());

  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpperCase && hasNumber && hasSpecial;
  const isConfirmValid = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!isEmailValid) {
      setError("Please enter a valid email address (e.g. name@example.com).");
      return;
    }

    const cleanPhone = phone.trim();
    const phoneDigits = cleanPhone.replace(/\D/g, "");
    if (!cleanPhone || phoneDigits.length < 10 || phoneDigits.length > 15) {
      setError("Please enter a valid 10-digit contact number.");
      return;
    }

    if (!addressLine1.trim()) {
      setError("Please enter Address Line 1.");
      return;
    }

    if (!city.trim()) {
      setError("Please enter your city.");
      return;
    }

    if (!state.trim()) {
      setError("Please enter your state.");
      return;
    }

    if (!pincode.trim()) {
      setError("Please enter your pincode.");
      return;
    }

    if (!isPasswordValid) {
      setError(
        "Password must be at least 8 characters long and contain at least 1 capital letter, 1 number, and 1 special character."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify both password fields.");
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: cleanPhone,
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        password,
      });

      setSuccess("Account registered successfully! Redirecting to sign in...");
      setTimeout(() => {
        onGoToLogin(
          email.trim().toLowerCase(),
          "✓ Account registered successfully! You can now sign in with your email and password."
        );
      }, 900);
    } catch (err: any) {
      setError(err?.message || "Failed to register account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap">
      {/* Header */}
      <header className="site-header">
        <div className="container">
          <div className="brand">
            <div className="brand-mark">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 21h18M4 21V8l8-5 8 5v13M9 21v-6h6v6" />
              </svg>
            </div>

            <div className="brand-text">
              <div className="brand-name-row">
                <span className="brand-name">NagrikConnect</span>
              </div>

              <span className="brand-sub">
                Civic Grievance &amp; Information Platform
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Register Form */}
      <main className="main-content login-shell">
        <div className="card login-card" style={{ maxWidth: 520 }}>
          <h1>Citizen Registration</h1>

          <p className="login-sub">
            Create an account to report civic issues and track resolutions in real time
          </p>

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

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="field">
              <label>
                Full Name <span className="req">*</span>
              </label>

              <div className="input-wrap">
                <span className="icon">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>

                <input
                  type="text"
                  placeholder="e.g. Rajesh Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="field">
              <label>
                Email Address <span className="req">*</span>
              </label>

              <div className="input-wrap">
                <span className="icon">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M2 6l10 7 10-7" />
                  </svg>
                </span>

                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {email.trim().length > 0 && !isEmailValid && (
                <span style={{ color: "#d32f2f", fontSize: "12px", marginTop: "4px", display: "block" }}>
                  Please enter a valid email format (e.g. name@example.com)
                </span>
              )}
            </div>

            {/* Contact Number */}
            <div className="field">
              <label>
                Contact Number <span className="req">*</span>
              </label>

              <div className="input-wrap">
                <span className="icon">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                  </svg>
                </span>

                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              {phone.trim().length > 0 && phone.replace(/\D/g, "").length < 10 && (
                <span style={{ color: "#d32f2f", fontSize: "12px", marginTop: "4px", display: "block" }}>
                  Contact number must contain at least 10 digits
                </span>
              )}
            </div>

            {/* Address Line 1 */}
            <div className="field">
              <label>
                Address Line 1 <span className="req">*</span>
              </label>

              <div className="input-wrap">
                <span className="icon">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>

                <input
                  type="text"
                  placeholder="Flat, House no., Building, Street (e.g. #32, Nabha Road)"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Address Line 2 */}
            <div className="field">
              <label>
                Address Line 2 <span style={{ color: "#666", fontWeight: "normal", fontSize: "12px" }}>(Optional)</span>
              </label>

              <div className="input-wrap">
                <span className="icon">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </span>

                <input
                  type="text"
                  placeholder="Area, Landmark, Sector (optional)"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                />
              </div>
            </div>

            {/* City & State Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="field">
                <label>
                  City <span className="req">*</span>
                </label>

                <div className="input-wrap">
                  <span className="icon">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" />
                    </svg>
                  </span>

                  <input
                    type="text"
                    placeholder="e.g. Patiala"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label>
                  State <span className="req">*</span>
                </label>

                <div className="input-wrap">
                  <span className="icon">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                  </span>

                  <input
                    type="text"
                    placeholder="e.g. Punjab"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Pincode */}
            <div className="field">
              <label>
                Pincode <span className="req">*</span>
              </label>

              <div className="input-wrap">
                <span className="icon">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </span>

                <input
                  type="text"
                  placeholder="e.g. 147001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="field">
              <label>
                Password <span className="req">*</span>
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {password.length > 0 && (
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
                  <div style={{ fontWeight: 600, marginBottom: "4px", color: "var(--navy)" }}>
                    Password requirements:
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                    <div style={{ color: hasMinLength ? "#2e7d32" : "#777", fontWeight: hasMinLength ? 600 : 400 }}>
                      {hasMinLength ? "✓" : "○"} Min. 8 characters
                    </div>
                    <div style={{ color: hasUpperCase ? "#2e7d32" : "#777", fontWeight: hasUpperCase ? 600 : 400 }}>
                      {hasUpperCase ? "✓" : "○"} 1 capital letter (A-Z)
                    </div>
                    <div style={{ color: hasNumber ? "#2e7d32" : "#777", fontWeight: hasNumber ? 600 : 400 }}>
                      {hasNumber ? "✓" : "○"} 1 number (0-9)
                    </div>
                    <div style={{ color: hasSpecial ? "#2e7d32" : "#777", fontWeight: hasSpecial ? 600 : 400 }}>
                      {hasSpecial ? "✓" : "○"} 1 special char (!@#$...)
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="field">
              <label>
                Confirm Password <span className="req">*</span>
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
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {confirmPassword.length > 0 && (
                <span
                  style={{
                    color: isConfirmValid ? "#2e7d32" : "#d32f2f",
                    fontSize: "12px",
                    marginTop: "4px",
                    display: "block",
                    fontWeight: 600,
                  }}
                >
                  {isConfirmValid ? "✓ Passwords match" : "✕ Passwords do not match"}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-navy btn-block mt-3"
              disabled={loading}
              style={{ marginTop: "16px" }}
            >
              {loading ? "Registering Account..." : "Create Citizen Account →"}
            </button>
          </form>

          <div className="divider" style={{ marginTop: "20px" }}>
            Don't have a citizen account?{" "}
            <a
              href="#login"
              onClick={(e) => {
                e.preventDefault();
                onGoToLogin();
              }}
              style={{ fontWeight: 700, color: "var(--navy)" }}
            >
              Sign in here
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-col">
            <div className="footer-brand">
              <div className="footer-mark">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 21h18M4 21V8l8-5 8 5v13M9 21v-6h6v6" />
                </svg>
              </div>

              <span className="footer-name">NagrikConnect</span>
            </div>

            <p className="footer-desc">
              Smart City Civic Redressal Infrastructure
            </p>
          </div>

          <div className="footer-help">
            <h4>Emergency Helplines</h4>

            <p>
              112 – National Emergency • 101 – Fire • 1916 – Water Supply (24/7)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Register;
