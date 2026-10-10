import { useState } from "react";

type Role = "citizen" | "admin";

type LoginProps = {
  onLogin: (role: Role) => void;
};

function Login({ onLogin }: LoginProps) {
  const [role, setRole] = useState<Role>("citizen");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onLogin(role);
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

                {/* <span className="brand-tag">Smart City Prototype</span> */}
              </div>

              <span className="brand-sub">
                Civic Grievance &amp; Information Platform
              </span>
            </div>
          </div>

          <div className="header-right">
            <a href="#" className="small text-muted">
              🌐 English / हिंदी
            </a>
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

          <span className="role-label">Select access role / भूमिका चुनें</span>

          {/* Role selector */}
          <div className="role-toggle">
            <button
              type="button"
              className={role === "citizen" ? "active-role" : ""}
              onClick={() => setRole("citizen")}
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
              onClick={() => setRole("admin")}
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

          {/* Role feedback
            <div className="role-feedback">
                Signing in as{" "}
                <strong>
                {role === "citizen" ? "Citizen" : "Officer"}
                </strong>{" "}
                to{" "}
                {role === "citizen"
                ? "track & report grievances."
                : "manage department complaints."}
            </div> */}

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

                <input type="text" defaultValue="citizen@demo.com" />
              </div>
            </div>

            <div className="field">
              <div className="flex justify-between items-center">
                <label style={{ margin: 0 }}>
                  Password / पासवर्ड <span className="req">*</span>
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

                <input type="password" defaultValue="citizen123" />
              </div>
            </div>

            <div className="remember-row">
              <input type="checkbox" defaultChecked />

              <span>Remember my session</span>
            </div>

            <button type="submit" className="btn btn-navy btn-block">
              Sign in →
            </button>
          </form>

          <div className="divider">
            Don't have a citizen account? <a href="#">Register here</a>
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
