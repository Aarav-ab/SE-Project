import { useComplaint } from "../ComplaintContext";
import { useEffect, useState } from "react";
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

function ComplaintStep2() {
  const { complaint, updateComplaint } = useComplaint();

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

    alert(
      "Location details are ready. Step 3 navigation will be connected next.",
    );
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
              <span className="brand-tag complaint-ward-tag">WARD 14</span>
            </div>
          </a>

          <nav className="nav">
            <a href="/">Citizen Hub</a>
            <a href="/complaint-step1" className="active">
              File Complaint
            </a>
            <a href="/complaints-log">Track Complaint</a>
          </nav>

          <div className="header-right">
            <div className="user-chip">
              <div className="user-avatar">RS</div>
              <div>
                <div className="user-name">Rajesh Sharma</div>
                <div className="user-role">Ward 14 Citizen</div>
              </div>
            </div>
            <a href="/" className="btn-signout">
              Sign Out
            </a>
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
                  File a Complaint <span>| शिकायत दर्ज करें</span>
                </h1>
                <p className="small text-body">
                  Step 2 of 3: Pinpoint Grievance Location / सटीक स्थान चिह्नित
                  करें
                </p>
              </div>

              <div className="summary-badge">
                <span className="dot location-dot" />
                Type: <strong>Pothole / Damaged Road</strong>
                <span className="tag priority-tag">PRIORITY: MEDIUM</span>
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

              <div className="field ward-field">
                <label htmlFor="ward">Ward Jurisdiction</label>
                <select id="ward" defaultValue="ward14">
                  <option value="ward14">
                    Ward 14 - Indiranagar East (Selected)
                  </option>
                </select>
              </div>
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
                        pinCode: event.target.value.replace(/\D/g, ""),
                      })
                    }
                    required
                  />
                  <p className="small text-body">
                    Demo address. GPS does not automatically convert coordinates
                    into a street address yet.
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
              <a href="/complaint-step1" className="btn btn-secondary">
                ← Back to Step 1
              </a>
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
    </div>
  );
}

export default ComplaintStep2;
