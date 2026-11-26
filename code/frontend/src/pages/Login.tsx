import { useState } from "react";
import { useComplaint } from "../ComplaintContext";

function Login() {
  const { login, register, authError, setAuthError } = useComplaint();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setAuthError("");
    try {
      if (mode === "register") await register(name, email, password);
      else await login(email, password);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-wrap">
      <header className="site-header">
        <div className="container">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">⌂</div>
            <div className="brand-text">
              <div className="brand-name-row"><span className="brand-name">NagrikConnect</span></div>
              <span className="brand-sub">Civic Grievance &amp; Information Platform</span>
            </div>
          </div>
          <div className="header-right"><span className="small text-muted">🌐 English / हिंदी</span></div>
        </div>
      </header>

      <main className="main-content login-shell">
        <section className="card login-card">
          <h1>{mode === "login" ? "Sign in" : "Create your account"}</h1>
          <p className="login-sub">
            {mode === "login"
              ? "Access your civic complaints and municipal services"
              : "Register to report issues and track their resolution"}
          </p>

          <button
            type="button"
            className="google-signin"
            onClick={() => { window.location.href = "/api/auth/google"; }}
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.64 5.93c4.46-4.11 7.13-10.16 7.13-17.58z" />
              <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.64-5.93c-2.12 1.42-4.83 2.26-8.26 2.26-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Continue with Google
          </button>

          <div className="login-divider"><span>or use email</span></div>

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <div className="field">
                <label htmlFor="account-name">Full name <span className="req">*</span></label>
                <input id="account-name" type="text" autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} />
              </div>
            )}
            <div className="field">
              <label htmlFor="account-email">Email address <span className="req">*</span></label>
              <input id="account-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="account-password">Password <span className="req">*</span></label>
              <input id="account-password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "register" ? 10 : 1} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} />
              {mode === "register" && <span className="password-hint">Use at least 10 characters.</span>}
            </div>

            {authError && <p className="auth-error" role="alert">{authError}</p>}

            <button type="submit" className="btn btn-navy btn-block" disabled={submitting}>
              {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="divider">
            {mode === "login" ? "New to NagrikConnect? " : "Already have an account? "}
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setAuthError("");
              }}
            >
              {mode === "login" ? "Register here" : "Sign in"}
            </button>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-col">
            <div className="footer-brand"><div className="footer-mark">⌂</div><span className="footer-name">NagrikConnect</span></div>
            <p className="footer-desc">Smart City Civic Redressal Infrastructure</p>
          </div>
          <div className="footer-help">
            <h4>Emergency Helplines</h4>
            <p>112 – National Emergency • 101 – Fire • 1916 – Water Supply (24/7)</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Login;
