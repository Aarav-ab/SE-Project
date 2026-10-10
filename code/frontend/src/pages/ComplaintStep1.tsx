import { useComplaint } from "../ComplaintContext";
import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "video/mp4"];

function formatFileSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(0)} KB`;
}

function ComplaintStep1({
  onNext,
  onCancel,
  onTrackComplaints,
  onSignOut,
}: {
  onNext: () => void;
  onCancel: () => void;
  onTrackComplaints: () => void;
  onSignOut: () => void;
}) {
  const { complaint, updateComplaint } = useComplaint();
  const files = complaint.files;

  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(selectedFiles: FileList | File[]) {
    const incoming = Array.from(selectedFiles);
    const accepted: File[] = [];
    const errors: string[] = [];

    incoming.forEach((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: use JPG, PNG, or MP4.`);
      } else if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: the maximum size is 25 MB.`);
      } else {
        accepted.push(file);
      }
    });

    const combined = [...files];

    accepted.forEach((file) => {
      const alreadyAdded = combined.some(
        (existing) =>
          existing.name === file.name &&
          existing.size === file.size &&
          existing.lastModified === file.lastModified,
      );

      if (!alreadyAdded) {
        combined.push(file);
      }
    });

    updateComplaint({ files: combined });

    setError(errors.join(" "));

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      addFiles(event.target.files);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  }

  function removeFile(index: number) {
    updateComplaint({
      files: files.filter((_, i) => i !== index),
    });

    setError("");
  }

  function continueToStep2() {
    if (files.length === 0) {
      setError("Please upload at least one photo or video before continuing.");
      return;
    }

    onNext();
  }

  return (
    <div className="page-wrap">
      <header className="site-header">
        <div className="container">
          <button
            type="button"
            className="brand"
            aria-label="NagrikConnect home"
            onClick={onCancel}
          >
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
            <div className="brand-text">
              <div className="brand-name-row">
                <span className="brand-name">NagrikConnect</span>
                <span className="brand-tag complaint-ward-tag">WARD 14</span>
              </div>
            </div>
          </button>

          <nav className="nav">
            <button type="button" onClick={onCancel}>
              Citizen Hub
            </button>

            <button
              type="button"
              className="active"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              File Complaint
            </button>

            <button type="button" onClick={onTrackComplaints}>
              Track Complaint
            </button>
          </nav>
          <div className="header-right">
            <div className="user-chip">
              <div className="user-avatar">RS</div>
              <div>
                <div className="user-name">Rajesh Sharma</div>
                <div className="user-role">Ward 14 Citizen</div>
              </div>
            </div>
            <button type="button" className="btn-signout" onClick={onSignOut}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="complaint-main">
        <div className="complaint-container">
          <section className="card complaint-card">
            <div className="stepper">
              <div className="step active">
                <div className="step-circle">1</div>
                <div className="step-label">Step 1</div>
                <div className="step-sub">Upload Media</div>
              </div>

              <div className="step">
                <div className="step-circle">2</div>
                <div className="step-label">Step 2</div>
                <div className="step-sub">Location Pin</div>
              </div>

              <div className="step">
                <div className="step-circle">3</div>
                <div className="step-label">Step 3</div>
                <div className="step-sub">Type &amp; Description</div>
              </div>
            </div>

            <h1 className="complaint-title">
              File a Complaint <span>/ शिकायत दर्ज करें</span>
            </h1>

            <p className="complaint-intro">
              Step 1 of 3: Upload Evidence Photos or Video &amp; Voice Note
            </p>

            <div className="upload-heading">
              <label>
                Upload Evidence Photos / Videos / प्रमाण फोटो एवं वीडियो{" "}
                <span className="req">*</span>
              </label>
              <span className="small text-muted">
                JPG, PNG, MP4 (MAX 25MB Each)
              </span>
            </div>

            <input
              ref={inputRef}
              className="complaint-file-input"
              type="file"
              accept="image/jpeg,image/png,video/mp4"
              multiple
              onChange={handleFileChange}
            />

            <div
              className={`upload-zone ${dragging ? "upload-zone-active" : ""}`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <div className="upload-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
              </div>

              <p className="upload-title">
                Drag &amp; drop photos or video here, or{" "}
                <button
                  type="button"
                  className="browse-button"
                  onClick={() => inputRef.current?.click()}
                >
                  browse files
                </button>
              </p>

              <p className="small text-body">
                Select files from your device gallery or folders.
              </p>

              <div className="tag-row">
                <span className="tag">📷 Photos</span>
                <span className="tag">🎥 Short Video (15s)</span>
                <span className="tag">📍 Location tagging</span>
              </div>
            </div>

            {error && (
              <p className="upload-error" role="alert">
                {error}
              </p>
            )}

            <section className="evidence-section">
              <div className="evidence-heading">
                <label>
                  Attached Evidence ({files.length}{" "}
                  {files.length === 1 ? "file" : "files"})
                </label>

                {files.length > 0 && (
                  <span className="evidence-count">✓ Files selected</span>
                )}
              </div>

              {files.length === 0 ? (
                <div className="evidence-empty">
                  Your selected photos and videos will appear here.
                </div>
              ) : (
                files.map((file, index) => (
                  <div
                    className="evidence-item"
                    key={`${file.name}-${file.lastModified}-${index}`}
                  >
                    <div className="evidence-file-info">
                      <div className="evidence-thumb">
                        {file.type.startsWith("image/") ? (
                          <img
                            className="evidence-preview"
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                          />
                        ) : (
                          <span aria-hidden="true">🎥</span>
                        )}
                      </div>

                      <div className="evidence-file-text">
                        <strong>{file.name}</strong>
                        <span className="tag">{formatFileSize(file.size)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="remove-file-button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => removeFile(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}

              <div className="voice-item">
                <div className="voice-item-info">
                  <div className="voice-icon">🎙️</div>
                  <div>
                    <strong>Add Voice Recording (Optional)</strong>
                    <p className="small text-body">
                      Voice recording and speech-to-text will be added later.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    alert(
                      "Voice recording will be implemented in a later step.",
                    )
                  }
                >
                  ● Record Note (Max 60s)
                </button>
              </div>
            </section>

            <div className="complaint-actions">
              <button
                type="button"
                className="btn btn-secondary complaint-cancel"
                onClick={onCancel}
              >
                ← Cancel
              </button>

              <button
                type="button"
                className="btn btn-navy"
                onClick={continueToStep2}
              >
                Next: Choose Location →
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

export default ComplaintStep1;
