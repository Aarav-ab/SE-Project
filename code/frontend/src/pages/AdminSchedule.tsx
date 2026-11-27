import { useEffect, useState } from "react";
import {
  fetchAnnouncements,
  createAnnouncementApi,
  updateAnnouncementApi,
  deleteAnnouncementApi,
  getCurrentUser,
  type ApiAnnouncement,
} from "../api";

type AdminScheduleProps = {
  onOpenComplaints: () => void;
  onOpenFieldWorkers: () => void;
  onOpenAnalytics: () => void;
  onSignOut: () => void;
};

const ICON_OPTIONS = [
  { icon: "⚡", label: "Power" },
  { icon: "💧", label: "Water" },
  { icon: "🚛", label: "Waste" },
  { icon: "🚧", label: "Roads" },
  { icon: "🌧️", label: "Drainage" },
  { icon: "🔧", label: "Maintenance" },
  { icon: "📢", label: "Advisory" },
  { icon: "🛡️", label: "Safety" },
];

const CATEGORY_OPTIONS = [
  "Power",
  "Water",
  "Waste",
  "Roads",
  "Maintenance",
  "Advisory",
  "Emergency",
];

function getItemIcon(item: ApiAnnouncement): string {
  if (item.icon && item.icon !== "📢") return item.icon;
  const text = `${item.category} ${item.title}`.toLowerCase();
  if (text.includes("power") || text.includes("electric") || text.includes("light")) return "⚡";
  if (text.includes("water") || text.includes("pipe")) return "💧";
  if (text.includes("waste") || text.includes("garbage") || text.includes("sanit")) return "🚛";
  if (text.includes("drain") || text.includes("monsoon")) return "🌧️";
  if (text.includes("road") || text.includes("pothole")) return "🚧";
  if (text.includes("maint")) return "🔧";
  return item.icon || "📢";
}

function AdminSchedule({
  onOpenComplaints,
  onOpenFieldWorkers,
  onOpenAnalytics,
  onSignOut,
}: AdminScheduleProps) {
  const [items, setItems] = useState<ApiAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ApiAnnouncement | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Advisory");
  const [icon, setIcon] = useState("📢");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const currentUser = getCurrentUser();
  const adminName = currentUser?.name || "Anita Rao (Admin)";
  const adminInitials =
    adminName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AR";
  const adminWardLabel = currentUser?.city
    ? `${currentUser.city} • Municipal Core`
    : "All Wards • Municipal Core";

  useEffect(() => {
    let mounted = true;
    fetchAnnouncements(true).then((list) => {
      if (mounted) {
        setItems(list);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  function openAddModal() {
    setEditingItem(null);
    setTitle("");
    setContent("");
    setCategory("Advisory");
    setIcon("📢");
    setActive(true);
    setError("");
    setIsModalOpen(true);
  }

  function openEditModal(item: ApiAnnouncement) {
    setEditingItem(item);
    setTitle(item.title);
    setContent(item.content);
    setCategory(item.category || "Advisory");
    setIcon(getItemIcon(item));
    setActive(item.active);
    setError("");
    setIsModalOpen(true);
  }

  function showBanner(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim() || !content.trim()) {
      setError("Title and schedule description/timings are required.");
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        const updated = await updateAnnouncementApi(editingItem.id, {
          title: title.trim(),
          content: content.trim(),
          category,
          icon,
          active,
        });
        setItems((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        showBanner("✓ Today's Schedule item updated on Citizen Hub.");
      } else {
        const created = await createAnnouncementApi({
          title: title.trim(),
          content: content.trim(),
          category,
          icon,
          active,
        });
        setItems((prev) => [...prev, created]);
        showBanner("✓ New schedule item published to Citizen Hub.");
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to save schedule item."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(item: ApiAnnouncement) {
    try {
      const updated = await updateAnnouncementApi(item.id, {
        active: !item.active,
      });
      setItems((prev) =>
        prev.map((row) => (row.id === updated.id ? updated : row))
      );
      showBanner(
        updated.active
          ? "✓ Schedule item is now visible on Citizen Hub."
          : "Schedule item hidden from Citizen Hub."
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to update visibility."
      );
    }
  }

  async function handleDelete(item: ApiAnnouncement) {
    const confirmed = window.confirm(
      `Delete "${item.title}" from Today's Schedule?`
    );
    if (!confirmed) return;

    try {
      await deleteAnnouncementApi(item.id);
      setItems((prev) => prev.filter((row) => row.id !== item.id));
      showBanner("✓ Schedule item deleted.");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to delete schedule item."
      );
    }
  }

  const activeItems = items.filter((i) => i.active);

  return (
    <div className="admin-wrap">
      <aside className="admin-sidebar">
        <div>
          <div className="brand">
            <div className="brand-mark" style={{ width: 32, height: 32 }}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 21h18M4 21V8l8-5 8 5v13" />
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
              {adminWardLabel}
            </span>
            <span className="text-muted">Active</span>
          </div>

          <nav className="admin-nav">
            <button type="button" onClick={onOpenComplaints}>
              All Complaints
            </button>
            <button type="button" onClick={onOpenFieldWorkers}>
              Field Workers &amp; Crews
            </button>
            <button type="button" onClick={onOpenAnalytics}>
              Department Analytics
            </button>
            <button type="button" className="active">
              Citizen Hub Schedule
            </button>
          </nav>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="flex gap-3 items-center">
            <strong style={{ color: "var(--navy)", fontSize: 18 }}>
              NagrikConnect Administration Core
            </strong>
            <span className="pill" style={{ background: "var(--blue-200)" }}>
              <span className="dot" style={{ background: "#61b15f" }} />
              {adminWardLabel}
            </span>
          </div>

          <div className="flex gap-3 items-center">
            <div className="user-chip">
              <div className="user-avatar">{adminInitials}</div>
              <div>
                <div className="user-name">{adminName}</div>
                <div className="user-role">Officer Gr. I</div>
              </div>
            </div>

            <button type="button" className="btn-signout" onClick={onSignOut}>
              Sign Out
            </button>
          </div>
        </header>

        <main className="admin-body">
          <div
            className="flex justify-between items-center"
            style={{ flexWrap: "wrap", gap: 16, marginBottom: 24 }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: 24, color: "var(--navy)" }}>
                Citizen Hub — Today&apos;s Schedule &amp; Advisories
              </h1>
              <p className="small text-body mt-1">
                Create, edit, or toggle daily civic advisories, utility maintenance timings, and collection schedules displayed on Citizen Hub
              </p>
            </div>

            <button
              type="button"
              className="btn btn-navy"
              onClick={openAddModal}
            >
              + Add Schedule Item
            </button>
          </div>

          {successMsg && (
            <div
              style={{
                background: "rgba(97, 177, 95, 0.12)",
                color: "#2e7d32",
                border: "1px solid rgba(97, 177, 95, 0.35)",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {successMsg}
            </div>
          )}

          {error && !isModalOpen && (
            <div className="complaint-error" style={{ marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <div className="two-col" style={{ alignItems: "start" }}>
            <div className="card card-pad">
              <div
                className="flex justify-between items-center"
                style={{ marginBottom: 16 }}
              >
                <h2 style={{ margin: 0, fontSize: 18, color: "var(--navy)" }}>
                  Manage Schedule Entries ({items.length})
                </h2>
                <span className="small text-muted" style={{ fontWeight: 600 }}>
                  {activeItems.length} Live on Citizen Hub
                </span>
              </div>

              {loading ? (
                <p className="small text-muted">Loading schedule items...</p>
              ) : items.length === 0 ? (
                <p className="small text-muted">
                  No schedule items configured yet. Click &ldquo;+ Add Schedule Item&rdquo; to publish one.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        padding: 14,
                        background: item.active ? "#ffffff" : "#f8fafc",
                        opacity: item.active ? 1 : 0.72,
                      }}
                    >
                      <div
                        className="flex justify-between items-start"
                        style={{ gap: 12, flexWrap: "wrap" }}
                      >
                        <div className="flex gap-2 items-start" style={{ flex: 1, minWidth: 200 }}>
                          <span style={{ fontSize: 20, lineHeight: 1.2 }}>
                            {getItemIcon(item)}
                          </span>
                          <div>
                            <div className="flex gap-2 items-center" style={{ flexWrap: "wrap" }}>
                              <strong style={{ color: "var(--navy)", fontSize: 14 }}>
                                {item.title}
                              </strong>
                              <span
                                className="row-tag"
                                style={{
                                  background: "var(--blue-100)",
                                  color: "var(--navy)",
                                  fontSize: 11,
                                }}
                              >
                                {item.category}
                              </span>
                              <span
                                className="row-tag"
                                style={{
                                  background: item.active ? "#dcfce7" : "#e2e8f0",
                                  color: item.active ? "#166534" : "#475569",
                                  fontSize: 11,
                                }}
                              >
                                {item.active ? "Visible" : "Hidden"}
                              </span>
                            </div>
                            <p
                              className="small text-body"
                              style={{ margin: "6px 0 0", lineHeight: 1.5 }}
                            >
                              {item.content}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div
                        className="flex gap-2"
                        style={{
                          marginTop: 12,
                          paddingTop: 10,
                          borderTop: "1px solid var(--border-soft)",
                          justifyContent: "flex-end",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(item)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => handleToggleActive(item)}
                        >
                          {item.active ? "Hide" : "Show"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            color: "#ba1a1a",
                            border: "1px solid rgba(186, 26, 26, 0.35)",
                            background: "rgba(186, 26, 26, 0.05)",
                          }}
                          onClick={() => handleDelete(item)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card card-pad">
              <div className="flex justify-between items-center">
                <h3 style={{ margin: 0, color: "var(--navy)" }}>
                  Live Citizen Hub Preview
                </h3>
                <span className="small text-muted" style={{ fontWeight: 600 }}>
                  Admin Advisories
                </span>
              </div>
              <p className="small text-muted" style={{ margin: "6px 0 12px" }}>
                This is how &ldquo;Today&apos;s Schedule&rdquo; currently appears to citizens on Citizen Hub.
              </p>

              <div className="mt-3">
                {activeItems.length === 0 ? (
                  <p className="small text-muted">
                    No active schedule items visible to citizens.
                  </p>
                ) : (
                  activeItems.map((item) => (
                    <div className="schedule-item" key={`preview-${item.id}`}>
                      <span>{getItemIcon(item)}</span>
                      <div>
                        <strong
                          style={{
                            fontSize: "12px",
                            color: "var(--navy)",
                          }}
                        >
                          {item.title}
                        </strong>
                        <p
                          className="small text-body"
                          style={{ margin: "2px 0 0" }}
                        >
                          {item.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>

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
      </div>

      {isModalOpen && (
        <div
          className="confirmation-overlay"
          role="presentation"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="confirmation-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520, padding: 28, textAlign: "left" }}
          >
            <div
              className="flex justify-between items-center"
              style={{ marginBottom: 16 }}
            >
              <div>
                <h2 style={{ fontSize: 22, margin: 0, color: "var(--navy)" }}>
                  {editingItem ? "Edit Schedule Item" : "+ Add Schedule Item"}
                </h2>
                <p className="small text-body" style={{ margin: "4px 0 0" }}>
                  Updates appear immediately on the Citizen Hub
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="complaint-error" style={{ marginBottom: 12 }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Schedule Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Power Maintenance Cut"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "#fff",
                    }}
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Icon
                  </label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "#fff",
                    }}
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.icon} value={opt.icon}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Description &amp; Timings *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Feeder inspection scheduled 11:00 AM – 01:30 PM today across Sector 3 & 5."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontFamily: "inherit",
                    fontSize: 14,
                  }}
                />
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 18,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                Visible on Citizen Hub
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-navy"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingItem
                    ? "Save Changes"
                    : "Publish to Citizen Hub →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSchedule;
