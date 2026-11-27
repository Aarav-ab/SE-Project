import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getCurrentUser, updateProfileApi } from "../api";

type EditProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function EditProfileModal({
  isOpen,
  onClose,
}: EditProfileModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      const user = getCurrentUser();
      setName(user?.name || "");
      setPhone(user?.phone || "");
      setAddressLine1(user?.addressLine1 || user?.address || "");
      setAddressLine2(user?.addressLine2 || "");
      setCity(user?.city || "");
      setState(user?.state || "");
      setPincode(user?.pincode || "");
      setError("");
      setSuccess("");
    });
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }

    const cleanPhone = phone.trim();
    if (cleanPhone) {
      const digits = cleanPhone.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15) {
        setError("Contact number must be a valid 10-digit phone number.");
        return;
      }
    }

    const cleanPin = pincode.trim();
    if (cleanPin && !/^\d{6}$/.test(cleanPin)) {
      setError("PIN code must be a valid 6-digit number.");
      return;
    }

    setLoading(true);
    try {
      await updateProfileApi({
        name: name.trim(),
        phone: cleanPhone,
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: cleanPin,
      });

      setSuccess("Profile details updated successfully!");
      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 900);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to update profile details.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
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
          maxWidth: 480,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
          boxShadow: "0 20px 40px rgba(0, 20, 50, 0.22)",
        }}
      >
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

        <h1 id="edit-profile-title">Edit Profile Details</h1>

        <p className="login-sub">
          Update your name and residential address
        </p>

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
          <div className="field">
            <label htmlFor="profile-name">
              Full Name <span className="req">*</span>
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="profile-phone">Contact Number</label>
            <input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          <div className="field">
            <label htmlFor="profile-addr1">Address Line 1 / Street</label>
            <input
              id="profile-addr1"
              type="text"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="House / Flat No., Street Name"
            />
          </div>

          <div className="field">
            <label htmlFor="profile-addr2">Address Line 2 / Locality</label>
            <input
              id="profile-addr2"
              type="text"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Landmark, Sector, or Area"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div className="field">
              <label htmlFor="profile-city">City</label>
              <input
                id="profile-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
              />
            </div>

            <div className="field">
              <label htmlFor="profile-state">State</label>
              <input
                id="profile-state"
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="profile-pincode">PIN Code</label>
            <input
              id="profile-pincode"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={(e) =>
                setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="6-digit PIN code"
            />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-navy"
              style={{ flex: 1 }}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
