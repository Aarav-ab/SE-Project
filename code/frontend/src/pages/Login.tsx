import { useState } from "react";
import { loginUser } from "../api";

type Role = "citizen" | "admin";

type LoginProps = {
  onLogin: (role: Role) => void;
  onGoToRegister?: () => void;
  preFilledEmail?: string;
  successMessage?: string;
};

function Login({ onLogin, onGoToRegister, preFilledEmail, successMessage }: LoginProps) {
  const [role, setRole] = useState<Role>("citizen");
  const [email, setEmail] = useState(preFilledEmail || "citizen123@gmail.com");
  const [password, setPassword] = useState(preFilledEmail ? "" : "Citizen@123");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(successMessage || "");
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setError("");
    setSuccess("");
    if (newRole === "citizen") {
      setEmail("citizen123@gmail.com");
      setPassword("Citizen@123");
    } else {
      setEmail("admin123@gmail.com");
      setPassword("admin@123");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser(role, email.trim(), password);
      onLogin(role);
    } catch (err: any) {
      setError(err?.message || "Invalid email or password.");
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

      {/* Login */}
      <main className="main-content login-shell">
        <div className="card login-card">
          <h1>Sign in</h1>

          <p className="login-sub">
            Select your role to access grievances and municipal services
          </p>

          <span className="role-label">Select access role</span>

          {/* Role selector */}
          <div className="role-toggle">
            <button
              type="button"
              className={role === "citizen" ? "active-role" : ""}
              onClick={() => handleRoleChange("citizen")}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
              </svg>
              Citizen / User
            </button>

            <button
              type="button"
              className={role === "admin" ? "active-role" : ""}
              onClick={() => handleRoleChange("admin")}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
              </svg>
              Admin / Officer
            </button>
          </div>

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

          {/* Error Banner styled using the design system */}
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

          {/* Login form */}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>
                Email or Registered Mobile Number <span className="req">*</span>
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
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <div className="flex justify-between items-center">
                <label style={{ margin: 0 }}>
                  Password <span className="req">*</span>
                </label>

                <a href="#" className="forgot-link">
                  Forgot Password?
                </a>
              </div>

              <div className="input-wrap" style={{ marginTop: "6px" }}>
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="remember-row">
              <input type="checkbox" defaultChecked />
              <span>Remember my session</span>
            </div>

            <button
              type="submit"
              className="btn btn-navy btn-block"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>

          <div className="divider">
            Don't have a citizen account?{" "}
            <a
              href="#register"
              onClick={(e) => {
                e.preventDefault();
                if (onGoToRegister) onGoToRegister();
              }}
              style={{ fontWeight: 700, color: "var(--navy)", cursor: "pointer" }}
            >
              Register here
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
                  <path d="M3 21h18M4 21V8l8-5 8 5v13" />
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

export default Login;
