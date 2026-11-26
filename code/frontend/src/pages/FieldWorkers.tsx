import { useEffect, useRef, useState, type FormEvent } from "react";
import { useComplaint, type FieldWorker } from "../ComplaintContext";

type ComplaintToAssign = {
  id: string;
  title: string;
  location: string;
};

type FieldWorkersProps = {
  onBack: () => void;
  onSignOut: () => void;
  complaintToAssign: ComplaintToAssign | null;
  onOpenAnalytics: () => void;
};

function FieldWorkers({
  onBack,
  onSignOut,
  complaintToAssign,
  onOpenAnalytics,
}: FieldWorkersProps) {
  const [search, setSearch] = useState("");
  const [workers, setWorkers] = useState<FieldWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyWorkerId, setBusyWorkerId] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorker, setNewWorker] = useState({ name: "", designation: "", department: "", contactInfo: "" });
  const [createWorkerError, setCreateWorkerError] = useState("");
  const [creatingWorker, setCreatingWorker] = useState(false);
  const creatingWorkerRef = useRef(false);
  const addWorkerButtonRef = useRef<HTMLButtonElement>(null);
  const createWorkerDialogRef = useRef<HTMLDivElement>(null);
  const {
    user,
    openMyAccount,
    loadFieldWorkers,
    createFieldWorker,
    updateFieldWorkerDuty,
    assignFieldWorker,
    endFieldAssignment,
  } = useComplaint();

  async function refreshWorkers() {
    setError("");
    try {
      setWorkers(await loadFieldWorkers());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load field workers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    loadFieldWorkers()
      .then((loadedWorkers) => {
        if (active) setWorkers(loadedWorkers);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load field workers.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadFieldWorkers]);

  const filteredWorkers = workers.filter((worker) =>
    `${worker.name} ${worker.designation} ${worker.department} ${worker.availability}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const availableCount = workers.filter((worker) => worker.availability === "available").length;
  const busyCount = workers.filter((worker) => worker.availability === "busy").length;
  const offDutyCount = workers.filter((worker) => worker.availability === "off_duty" || worker.availability === "on_leave").length;

  useEffect(() => {
    if (!showCreateForm) return;
    const previousOverflow = document.body.style.overflow;
    const addWorkerButton = addWorkerButtonRef.current;
    document.body.style.overflow = "hidden";
    createWorkerDialogRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !creatingWorkerRef.current) closeCreateWorkerModal();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      addWorkerButton?.focus();
    };
  }, [showCreateForm]);

  function closeCreateWorkerModal() {
    setShowCreateForm(false);
    setCreateWorkerError("");
    setNewWorker({ name: "", designation: "", department: "", contactInfo: "" });
  }

  async function handleDispatch(worker: FieldWorker) {
    if (!complaintToAssign || worker.availability !== "available" || busyWorkerId) return;
    setBusyWorkerId(worker.id);
    setError("");
    setNotice("");
    try {
      await assignFieldWorker(complaintToAssign.id, worker.id);
      setNotice(`${worker.name} assigned to complaint ${complaintToAssign.id}.`);
      await refreshWorkers();
      onBack();
    } catch (dispatchError) {
      setError(dispatchError instanceof Error ? dispatchError.message : "Could not dispatch this worker.");
    } finally {
      setBusyWorkerId("");
    }
  }

  async function handleEndAssignment(worker: FieldWorker, status: "completed" | "released") {
    if (!worker.activeAssignment || busyWorkerId) return;
    setBusyWorkerId(worker.id);
    setError("");
    setNotice("");
    try {
      await endFieldAssignment(worker.activeAssignment.id, status);
      setNotice(status === "completed" ? "Assignment completed." : "Assignment released.");
      await refreshWorkers();
    } catch (assignmentError) {
      setError(assignmentError instanceof Error ? assignmentError.message : "Could not update this assignment.");
    } finally {
      setBusyWorkerId("");
    }
  }

  async function handleDutyChange(worker: FieldWorker, dutyStatus: FieldWorker["dutyStatus"]) {
    setBusyWorkerId(worker.id);
    setError("");
    try {
      await updateFieldWorkerDuty(worker.id, dutyStatus);
      await refreshWorkers();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update worker duty status.");
    } finally {
      setBusyWorkerId("");
    }
  }

  async function handleCreateWorker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateWorkerError("");
    setNotice("");
    const trimmedWorker = {
      name: newWorker.name.trim(),
      designation: newWorker.designation.trim(),
      department: newWorker.department.trim(),
      contactInfo: newWorker.contactInfo.trim(),
    };
    if (!trimmedWorker.name || !trimmedWorker.designation || !trimmedWorker.department) {
      setCreateWorkerError("Enter a full name, designation, and department.");
      return;
    }
    setCreatingWorker(true);
    creatingWorkerRef.current = true;
    try {
      await createFieldWorker(trimmedWorker);
      closeCreateWorkerModal();
      setNotice("Field worker added.");
      await refreshWorkers();
    } catch (createError) {
      setCreateWorkerError(createError instanceof Error ? createError.message : "Could not add field worker.");
    } finally {
      setCreatingWorker(false);
      creatingWorkerRef.current = false;
    }
  }

  return (
    <div className="admin-wrap">
      <aside className="admin-sidebar">
        <div>
          <div className="brand">
            <div className="brand-mark">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 21h18M4 21V8l8-5 8 5v13M9 21v-6h6v6" />
              </svg>
            </div>
            <div>
              <div className="brand-name" style={{ fontSize: 18 }}>
                NagrikConnect
              </div>
              <div
                className="small text-muted"
                style={{ fontWeight: 700, letterSpacing: ".5px" }}
              >
                ADMINISTRATION CORE
              </div>
            </div>
          </div>

          <div className="admin-ward-pill">
            <span className="flex gap-1 items-center">
              <span className="dot" style={{ background: "#61b15f" }} />
              Municipal Operations
            </span>
            <span className="text-muted">Active</span>
          </div>

          <nav className="admin-nav">
            <button type="button" onClick={onBack}>
              All Complaints
            </button>
            <button type="button" className="active">
              Field Workers &amp; Crews
            </button>
            <button type="button" onClick={onOpenAnalytics}>
              Department Analytics
            </button>
          </nav>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="flex gap-3 items-center">
            <strong style={{ color: "var(--navy)", fontSize: 18 }}>
              NagrikConnect Administration Core
            </strong>
          </div>

          <div className="flex items-center admin-header-actions">
            <div className="admin-search">
              🔍
              <input
                type="search"
                placeholder="Search crew, worker..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <button type="button" className="user-chip profile-trigger" onClick={openMyAccount} aria-label="Open My Account">
              <div className="user-avatar">{user?.name.slice(0, 1).toUpperCase()}</div>
              <div>
                <div className="user-name">{user?.name}</div>
                <div className="user-role">Administrator</div>
            </div>
            </button>

            <button className="btn-signout" onClick={onSignOut}>
              Sign Out
            </button>
          </div>
        </header>

        <section className="admin-body">
          <div
            className="flex justify-between items-center"
            style={{ flexWrap: "wrap", gap: 16, marginBottom: 24 }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: 24, color: "var(--navy)" }}>
                Field Workers &amp; Crews{" "}
                <span style={{ fontWeight: 600, color: "var(--text-muted)" }}>
                  /
                </span>{" "}
                <span
                  style={{
                    fontWeight: 600,
                    color: "var(--text-body)",
                    fontSize: 18,
                  }}
                >
                  फील्ड दल प्रबंधन
                </span>
              </h1>

              <p className="small text-body mt-1">
                Monitor crew availability, current dispatch, and workload across municipal services.
              </p>
            </div>

            {complaintToAssign && (
              <div
                className="card card-pad"
                style={{
                  marginBottom: 24,
                  borderLeft: "4px solid var(--amber)",
                }}
              >
                <h3 style={{ marginTop: 0 }}>Assign Crew to Complaint</h3>
                <strong>{complaintToAssign.title}</strong>
                <p className="small text-muted">
                  #{complaintToAssign.id} · {complaintToAssign.location}
                </p>
                <p className="small text-body">
                  Choose an available crew below and click “Dispatch to Ticket”.
                </p>
              </div>
            )}

            <button
              ref={addWorkerButtonRef}
              type="button"
              className="btn btn-navy"
              onClick={() => {
                setCreateWorkerError("");
                setShowCreateForm(true);
              }}
            >
              + Add New Crew Member
            </button>
          </div>

          {error && <div className="card card-pad" role="alert">{error}</div>}
          {notice && <div className="card card-pad" role="status">{notice}</div>}

          <div className="kpi-row">
            <div className="kpi-card">
              <div>
                <span className="kpi-label">Total Field Staff</span>
                <div className="kpi-val" style={{ color: "var(--navy)" }}>
                  {workers.length}
                </div>
                <p className="small mt-1" style={{ fontWeight: 600 }}>
                  Registered field workers
                </p>
              </div>
              <div
                className="kpi-icon"
                style={{ background: "var(--blue-200)" }}
              >
                👷
              </div>
            </div>

            <div className="kpi-card">
              <div>
                <span className="kpi-label">On-Site Now</span>
                <div className="kpi-val" style={{ color: "var(--amber)" }}>
                  {busyCount}
                </div>
                <p className="small mt-1" style={{ fontWeight: 600 }}>
                  Actively deployed
                </p>
              </div>
              <div
                className="kpi-icon"
                style={{ background: "var(--amber-bg)" }}
              >
                🚧
              </div>
            </div>

            <div className="kpi-card">
              <div>
                <span className="kpi-label">Available / On Standby</span>
                <div className="kpi-val" style={{ color: "#61b15f" }}>
                  {availableCount}
                </div>
                <p className="small mt-1" style={{ fontWeight: 600 }}>
                  Ready for dispatch
                </p>
              </div>
              <div
                className="kpi-icon"
                style={{ background: "var(--green-bg)" }}
              >
                ✅
              </div>
            </div>

            <div className="kpi-card">
              <div>
                <span className="kpi-label">On Leave / Off-Duty</span>
                <div className="kpi-val" style={{ color: "var(--text-muted)" }}>
                  {offDutyCount}
                </div>
                <p className="small mt-1" style={{ fontWeight: 600 }}>
                  Scheduled rotation
                </p>
              </div>
              <div
                className="kpi-icon"
                style={{ background: "var(--blue-50)" }}
              >
                🛌
              </div>
            </div>
          </div>

          {loading && <div className="card card-pad" aria-live="polite">Loading field workers…</div>}
          {!loading && !filteredWorkers.length && (
            <div className="card card-pad text-body">
              {workers.length ? "No workers match your search." : "No field workers have been added yet."}
            </div>
          )}

          <div className="crew-grid">
            {filteredWorkers.map((worker) => (
              <article className="crew-card" key={worker.id}>
                <div className="crew-top">
                  <div
                    className="crew-avatar"
                    style={{ background: worker.availability === "available" ? "#61b15f" : worker.availability === "busy" ? "var(--amber)" : "var(--text-muted)" }}
                  >
                    {worker.name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")}
                  </div>
                  <div>
                    <strong>{worker.name}</strong>
                    <div className="small text-body">{worker.designation} • {worker.department}</div>
                    <span
                      className="small mt-1"
                      style={{ display: "inline-block" }}
                    >
                      <span
                        className="avail-dot"
                        style={{ background: worker.availability === "available" ? "#61b15f" : worker.availability === "busy" ? "var(--amber)" : "#c4c6cf" }}
                      />
                      {worker.availability === "busy" ? "On-site / Busy" : worker.availability === "available" ? "Available" : worker.availability === "on_leave" ? "On leave" : "Off-duty"}
                    </span>
                  </div>
                </div>

                <div className="crew-stat-row">
                  <span className="text-body">Active Assignment</span>
                  <strong>{worker.activeAssignment ? `#${worker.activeAssignment.complaintId}` : "—"}</strong>
                </div>
                <div className="crew-stat-row">
                  <span className="text-body">Complaint</span>
                  <strong>{worker.activeAssignment?.title ?? "No active assignment"}</strong>
                </div>
                <div className="crew-stat-row">
                  <span className="text-body">Duty status</span>
                  <div
                    className={`worker-duty-control worker-duty-${worker.dutyStatus}${worker.activeAssignment ? " worker-duty-locked" : ""}`}
                    title={worker.activeAssignment ? "Duty status cannot be changed while this worker has an active assignment." : undefined}
                  >
                    <span className="worker-duty-indicator" aria-hidden="true" />
                    <select
                      className="worker-duty-select"
                      value={worker.dutyStatus}
                      disabled={Boolean(worker.activeAssignment) || busyWorkerId === worker.id}
                      onChange={(event) => void handleDutyChange(worker, event.target.value as FieldWorker["dutyStatus"])}
                      aria-label={`Duty status for ${worker.name}${worker.activeAssignment ? ". Locked while an active assignment is in progress." : ""}`}
                    >
                      <option value="available">Available</option>
                      <option value="off_duty">Off-duty</option>
                      <option value="on_leave">On leave</option>
                    </select>
                    {worker.activeAssignment && (
                      <span className="worker-duty-lock" aria-hidden="true">🔒</span>
                    )}
                  </div>
                </div>

                {worker.activeAssignment ? (
                  <div className="flex gap-2 mt-3">
                    <button type="button" className="btn btn-navy btn-sm" disabled={Boolean(busyWorkerId)} onClick={() => void handleEndAssignment(worker, "completed")}>Complete</button>
                    <button type="button" className="btn btn-secondary btn-sm" disabled={Boolean(busyWorkerId)} onClick={() => void handleEndAssignment(worker, "released")}>Release</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={`btn ${worker.dutyStatus !== "available" ? "btn-secondary worker-dispatch-unavailable" : "btn-navy"} btn-block btn-sm mt-3`}
                    disabled={!complaintToAssign || worker.availability !== "available" || Boolean(busyWorkerId)}
                    onClick={() => void handleDispatch(worker)}
                  >
                    {worker.dutyStatus === "off_duty"
                      ? "Unavailable — Off Duty"
                      : worker.dutyStatus === "on_leave"
                        ? "Unavailable — On Leave"
                      : busyWorkerId === worker.id
                        ? "Dispatching…"
                        : complaintToAssign
                          ? "Dispatch to Ticket →"
                          : "Select a complaint to dispatch"}
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>

        {showCreateForm && (
          <div
            className="confirmation-overlay worker-create-overlay"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !creatingWorkerRef.current) {
                closeCreateWorkerModal();
              }
            }}
          >
            <section
              ref={createWorkerDialogRef}
              className="confirmation-modal worker-create-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-worker-title"
              aria-describedby="create-worker-description"
            >
              <button
                type="button"
                className="timeline-close"
                onClick={closeCreateWorkerModal}
                aria-label="Close Add New Crew Member dialog"
                disabled={creatingWorker}
              >
                ×
              </button>
              <div className="worker-create-heading">
                <span className="timeline-eyebrow">NAGRIKCONNECT ADMINISTRATION</span>
                <h2 id="create-worker-title">Add New Crew Member</h2>
                <p id="create-worker-description">
                  Register a municipal field worker to manage complaint assignments.
                </p>
              </div>
              <form onSubmit={(event) => void handleCreateWorker(event)} noValidate>
                <div className="worker-create-fields">
                  {([
                    ["name", "Full Name", "Enter the worker's full name"],
                    ["designation", "Designation", "e.g. Field Engineer"],
                    ["department", "Department", "e.g. Roads and Public Works"],
                    ["contactInfo", "Contact Information (optional)", "Phone number or other contact details"],
                  ] as const).map(([field, label, placeholder]) => (
                    <label key={field} className="worker-create-field" htmlFor={`new-worker-${field}`}>
                      <span>
                        {label}
                        {field !== "contactInfo" && <span className="worker-required"> *</span>}
                      </span>
                      <input
                        id={`new-worker-${field}`}
                        type="text"
                        autoComplete={field === "name" ? "name" : "off"}
                        value={newWorker[field]}
                        onChange={(event) => setNewWorker((current) => ({ ...current, [field]: event.target.value }))}
                        placeholder={placeholder}
                        required={field !== "contactInfo"}
                        maxLength={field === "contactInfo" ? 120 : 160}
                        disabled={creatingWorker}
                      />
                    </label>
                  ))}
                </div>
                {createWorkerError && <p className="worker-create-error" role="alert">{createWorkerError}</p>}
                <div className="worker-create-actions">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={closeCreateWorkerModal}
                    disabled={creatingWorker}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-navy" type="submit" disabled={creatingWorker}>
                    {creatingWorker ? "Saving…" : "Save Worker"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

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
                112 – National Emergency • 101 – Fire • 1916 – Water Supply
                (24/7)
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default FieldWorkers;
