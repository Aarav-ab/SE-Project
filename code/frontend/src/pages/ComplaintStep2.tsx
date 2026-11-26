import { useComplaint } from "../ComplaintContext";
import { useEffect, useState, useRef } from "react";
import { getCurrentUser } from "../api";
import ChangePasswordModal from "./ChangePasswordModal";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapClickHandler({
  onSelect,
}: {
  onSelect: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lon], 16, { animate: true });
  }, [lat, lon, map]);

  return null;
}

function ComplaintStep2({
  onNext,
  onBack,
  onCancel,
  onGoToStep1,
  onTrackComplaints,
  onSignOut,
}: {
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
  onGoToStep1: () => void;
  onTrackComplaints: () => void;
  onSignOut: () => void;
}) {
  const { complaint, updateComplaint } = useComplaint();

  const currentUser = getCurrentUser();
  const userName = currentUser?.name || "Rajesh Sharma";
  const initials =
    userName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "RS";
  const userLocationTag = currentUser?.city ? currentUser.city.toUpperCase() : "WARD 14";
  const userRoleDisplay = currentUser?.city ? `${currentUser.city} Citizen` : "Ward 14 Citizen";

  const [settingsOpen, setSettingsOpen] = useState(false);
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

  useEffect(() => {
    if (!complaint.address && currentUser?.address) {
      updateComplaint({
        address: currentUser.address,
        pinCode: currentUser.pincode || complaint.pinCode || "",
      });
    }
  }, []);

  const address = complaint.address;
  const pinCode = complaint.pinCode;
  const landmark = complaint.landmark;

  const [coordinates, setCoordinates] = useState({
    lat: complaint.latitude ?? 30.3533,
    lon: complaint.longitude ?? 76.3583,
  });

  const [gpsMessage, setGpsMessage] = useState("");

  async function updateAddressFromCoordinates(lat: number, lon: number) {
    setGpsMessage("Updating address for selected location...");
    updateComplaint({ landmark: "" });
    try {
      const url =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
        `&lat=${lat}&lon=${lon}&addressdetails=1`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Address lookup failed");
      }

      const data = await response.json();
      const parts = data.address ?? {};

      const city =
        parts.city ?? parts.town ?? parts.village ?? parts.municipality;

      const streetAddress = [
        parts.house_number,
        parts.road,
        parts.residential,
        parts.neighbourhood,
        parts.quarter,
        parts.suburb,
        parts.city_district,
        city,
        parts.state,
      ]
        .filter(Boolean)
        .filter((value, index, array) => array.indexOf(value) === index)
        .join(", ");

      // Try a broader lookup if the precise lookup has no postcode.
      let postcode = parts.postcode ?? "";

      if (!postcode) {
        const fallbackUrl =
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
          `&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;

        const fallbackResponse = await fetch(fallbackUrl);

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          postcode = fallbackData.address?.postcode ?? "";
        }
      }

      updateComplaint({ address: streetAddress });
      updateComplaint({ pinCode: postcode });
      setGpsMessage(
        streetAddress
          ? "Location and address updated."
          : "Location selected. Please enter the address manually.",
      );
    } catch {
      updateComplaint({
        address: "",
        pinCode: "",
        landmark: "",
      });

      setGpsMessage(
        "Location selected, but address lookup failed. Please enter the address manually.",
      );
    }
  }

  async function detectLocation() {
    if (!navigator.geolocation) {
      setGpsMessage("Geolocation is not supported by this browser.");
      return;
    }

    setGpsMessage("Detecting your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        updateComplaint({ landmark: "" });
        setCoordinates({ lat, lon });
        updateComplaint({
          latitude: lat,
          longitude: lon,
        });
        setGpsMessage("GPS detected. Looking up your address...");

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`,
          );

          if (!response.ok) {
            throw new Error("Address lookup failed");
          }

          const data = await response.json();

          console.log("Geocoding response:", data);
          console.log("Full address details:", data.address);
          console.log("Full display address:", data.display_name);

          const parts = data.address ?? {};

          const city =
            parts.city ?? parts.town ?? parts.village ?? parts.municipality;

          const streetAddress = [
            parts.house_number,
            parts.road,
            parts.residential,
            parts.neighbourhood,
            parts.quarter,
            parts.suburb,
            parts.city_district,
            city,
            parts.state,
          ]
            .filter(Boolean)
            .filter((value, index, array) => array.indexOf(value) === index)
            .join(", ");

          if (streetAddress) {
            updateComplaint({ address: streetAddress });
          }

          let detectedPostcode = parts.postcode ?? "";

          if (!detectedPostcode) {
            try {
              const fallbackResponse = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
              );

              if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                detectedPostcode = fallbackData.address?.postcode ?? "";
              }
            } catch {
              // Leave the PIN field empty if the lookup fails.
            }
          }

          updateComplaint({ pinCode: detectedPostcode });

          setGpsMessage(
            streetAddress
              ? "Location and address detected successfully."
              : "GPS detected, but no street address was found. Please enter it manually.",
          );
        } catch {
          setGpsMessage(
            "GPS detected, but address lookup failed. Please enter your address manually.",
          );
        }
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied. Allow location access and try again."
            : error.code === error.TIMEOUT
              ? "Location detection timed out. Please try again."
              : "Unable to detect your location. Check your device location settings.";

        setGpsMessage(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }

  function continueToStep3() {
    if (!address.trim()) {
      setGpsMessage("Please enter a street address.");
      return;
    }

    if (!/^\d{6}$/.test(pinCode.trim())) {
      setGpsMessage("Please enter a valid 6-digit PIN code.");
      return;
    }

    onNext();
  }

  return (
    <div className="page-wrap">
      <header className="site-header">
        <div className="container">
          <a className="brand" href="/" aria-label="NagrikConnect home">
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
            </div>{" "}
            <div className="brand-name-row">
              <span className="brand-name">NagrikConnect</span>
              <span className="brand-tag complaint-ward-tag">{userLocationTag}</span>
            </div>
          </a>

          <nav className="nav">
            <button type="button" onClick={onCancel}>
              Citizen Hub
            </button>

            <button type="button" onClick={onGoToStep1}>
              File Complaint
            </button>

            <button type="button" onClick={onTrackComplaints}>
              Track Complaint
            </button>
          </nav>

          <div className="header-right">
            <div className="user-chip">
              <div className="user-avatar">{initials}</div>
              <div>
                <div className="user-name">{userName}</div>
                <div className="user-role">{userRoleDisplay}</div>
              </div>
            </div>

            {/* Settings Dialog Menu Button */}
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
                    width: "210px",
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

                  {/* Option 1: Change Password */}
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

                  {/* Option 2: Sign Out */}
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
          </div>
        </div>
      </header>

      <main className="complaint-main">
        <div className="complaint-container">
          <section className="card complaint-card">
            <div className="stepper">
              <div className="step done">
                <div className="step-circle">✓</div>
                <div className="step-label">Step 1</div>
                <div className="step-sub">Upload Media</div>
              </div>
              <div className="step active">
                <div className="step-circle">2</div>
                <div className="step-label">Step 2</div>
                <div className="step-sub">Location &amp; Ward</div>
              </div>
              <div className="step">
                <div className="step-circle">3</div>
                <div className="step-label">Step 3</div>
                <div className="step-sub">Type &amp; Description</div>
              </div>
            </div>

            <div className="location-heading">
              <div>
                <h1 className="complaint-title">
                  File a Complaint
                </h1>
                <p className="small text-body">
                  Step 2 of 3: Pinpoint Grievance Location
                </p>
              </div>
            </div>

            <div className="location-controls">
              <button
                className="btn btn-amber gps-button"
                type="button"
                onClick={detectLocation}
              >
                📍 Use GPS / Auto-Detect Location
              </button>

              {/* <div className="field ward-field">
                <label htmlFor="ward">Ward Jurisdiction</label>
                <select id="ward" defaultValue="ward14">
                  <option value="ward14">
                    Ward 14 - Indiranagar East (Selected)
                  </option>
                </select>
              </div> */}
            </div>

            <div className="real-map-wrapper">
              <div className="map-overlay-top">
                <span className="map-chip">🗺️ Street Map</span>
                <span className="map-chip">
                  Lat: {coordinates.lat.toFixed(4)}°, Lon:{" "}
                  {coordinates.lon.toFixed(4)}°
                </span>
              </div>

              <MapContainer
                center={[coordinates.lat, coordinates.lon]}
                zoom={16}
                scrollWheelZoom
                className="real-map"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapClickHandler
                  onSelect={(lat, lon) => {
                    setCoordinates({ lat, lon });

                    updateComplaint({
                      latitude: lat,
                      longitude: lon,
                    });

                    void updateAddressFromCoordinates(lat, lon);
                  }}
                />

                <RecenterMap lat={coordinates.lat} lon={coordinates.lon} />

                <Marker position={[coordinates.lat, coordinates.lon]} />
              </MapContainer>
            </div>

            <p className="map-hint">
              Click anywhere on the map preview to reposition the pin. This is a
              visual prototype, not a live map.
            </p>

            <section className="addr-box">
              <div className="address-title">
                <span>📌</span>
                <h3>Verified Address Details</h3>
              </div>

              <div className="address-grid">
                <div className="field address-full">
                  <label htmlFor="street">
                    Landmark / Street Address <span className="req">*</span>
                  </label>
                  <input
                    id="street"
                    type="text"
                    value={address}
                    onChange={(event) =>
                      updateComplaint({
                        address: event.target.value,
                      })
                    }
                    required
                  />
                  <p className="small text-body">
                    Confirmed civic location for field engineer inspection and dispatch.
                  </p>
                </div>

                <div className="field">
                  <label htmlFor="pin">
                    PIN Code <span className="req">*</span>
                  </label>
                  <input
                    id="pin"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pinCode}
                    onChange={(event) =>
                      updateComplaint({
                        pinCode: event.target.value.replace(/\D/g, ""),
                      })
                    }
                    required
                  />
                  <p className="small text-body">Postal PIN code</p>
                </div>

                <div className="field address-full">
                  <label htmlFor="landmark">
                    Additional Landmark / Directions for Field Engineer
                  </label>
                  <input
                    id="landmark"
                    type="text"
                    value={landmark}
                    onChange={(event) =>
                      updateComplaint({ landmark: event.target.value })
                    }
                  />
                  <p className="small text-body">
                    Add visible markers to help the field team locate the issue.
                  </p>
                </div>
              </div>
            </section>

            {gpsMessage && (
              <p className="gps-message" role="status">
                {gpsMessage}
              </p>
            )}

            <div className="complaint-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onBack}
              >
                ← Back to Step 1
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={continueToStep3}
              >
                Next: Enter Details &amp; Description →
              </button>
            </div>
          </section>
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
              </div>{" "}
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

      {/* Change Password Dialog Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
}

export default ComplaintStep2;
