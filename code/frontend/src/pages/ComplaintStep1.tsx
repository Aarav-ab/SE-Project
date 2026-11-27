import { useComplaint } from "../ComplaintContext";
import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import SettingsMenu, { useUserProfile } from "./SettingsMenu";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "video/mp4",
  "audio/webm",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/m4a",
];

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

  const currentUser = useUserProfile();
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

  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceNoteAudioUrl, setVoiceNoteAudioUrl] = useState<string | null>(null);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [voiceError, setVoiceError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  async function startRecording() {
    setVoiceError("");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setVoiceError("Microphone recording is not supported on this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setVoiceNoteAudioUrl(audioUrl);

        const newVoiceFile = new File(
          [audioBlob],
          `voice-note-${Date.now()}.webm`,
          { type: "audio/webm" }
        );
        setVoiceFile(newVoiceFile);

        // Append to complaint files
        updateComplaint({
          files: [...complaint.files, newVoiceFile],
        });

        // Turn off microphone tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setVoiceError(
        "Could not access microphone. Please check browser permissions and try again."
      );
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
  }

  function deleteVoiceNote() {
    if (voiceNoteAudioUrl) {
      URL.revokeObjectURL(voiceNoteAudioUrl);
      setVoiceNoteAudioUrl(null);
    }
    if (voiceFile) {
      updateComplaint({
        files: complaint.files.filter((f) => f !== voiceFile),
      });
      setVoiceFile(null);
    }
    setRecordingSeconds(0);
    setVoiceError("");
  }

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
                <span className="brand-tag complaint-ward-tag">{userLocationTag}</span>
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
              <div className="user-avatar">{initials}</div>
              <div>
                <div className="user-name">{userName}</div>
                <div className="user-role">{userRoleDisplay}</div>
              </div>
            </div>

            <SettingsMenu onSignOut={onSignOut} />
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
              File a Complaint
            </h1>

            <p className="complaint-intro">
              Step 1 of 3: Upload Evidence Photos or Video &amp; Voice Note
            </p>

            <div className="upload-heading">
              <label>
                Upload Evidence Photos / Videos{" "}
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
                        ) : file.type.startsWith("audio/") ? (
                          <span aria-hidden="true" style={{ fontSize: "20px" }}>🎙️</span>
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

              <div
                className="voice-item"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  background: isRecording
                    ? "rgba(225, 4, 4, 0.04)"
                    : "var(--blue-50)",
                  border: isRecording
                    ? "1px solid rgba(225, 4, 4, 0.3)"
                    : "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "16px",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div
                    className="voice-item-info"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      className="voice-icon"
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: isRecording ? "#ba1a1a" : "var(--navy)",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        boxShadow: isRecording
                          ? "0 0 0 6px rgba(186, 26, 26, 0.2)"
                          : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      🎙️
                    </div>

                    <div>
                      <strong
                        style={{ color: "var(--navy)", fontSize: "14px" }}
                      >
                        {isRecording
                          ? "Recording in progress..."
                          : voiceNoteAudioUrl
                          ? "Voice Recording Attached"
                          : "Add Voice Recording (Optional)"}
                      </strong>

                      <p
                        className="small text-body"
                        style={{ margin: "2px 0 0" }}
                      >
                        {isRecording
                          ? `Recording audio grievance note (${recordingSeconds}s / 60s max)...`
                          : voiceNoteAudioUrl
                          ? "Audio note saved and attached to your complaint evidence."
                          : "Speak your issue clearly. Recording will be attached as evidence (up to 60s)."}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {!isRecording && !voiceNoteAudioUrl && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontWeight: 600,
                        }}
                        onClick={startRecording}
                      >
                        <span style={{ color: "#ba1a1a" }}>●</span>
                        <span>Record Note (Max 60s)</span>
                      </button>
                    )}

                    {isRecording && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            color: "#ba1a1a",
                            fontSize: "13px",
                            padding: "4px 8px",
                            background: "rgba(186, 26, 26, 0.1)",
                            borderRadius: "4px",
                          }}
                        >
                          🔴 00:{String(recordingSeconds).padStart(2, "0")} / 01:00
                        </span>

                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            background: "#ba1a1a",
                            color: "#ffffff",
                            fontWeight: 600,
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 14px",
                            cursor: "pointer",
                          }}
                          onClick={stopRecording}
                        >
                          ⏹ Stop Recording
                        </button>
                      </div>
                    )}

                    {voiceNoteAudioUrl && !isRecording && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          background: "#fff5f5",
                          color: "#ba1a1a",
                          border: "1px solid #ffc9c9",
                          borderRadius: "6px",
                          fontWeight: 600,
                          padding: "6px 12px",
                          cursor: "pointer",
                        }}
                        onClick={deleteVoiceNote}
                      >
                        🗑️ Delete / Re-record
                      </button>
                    )}
                  </div>
                </div>

                {voiceNoteAudioUrl && (
                  <div
                    style={{
                      marginTop: "6px",
                      paddingTop: "10px",
                      borderTop: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <audio
                      controls
                      src={voiceNoteAudioUrl}
                      style={{ width: "100%", maxHeight: "38px" }}
                    />
                  </div>
                )}

                {voiceError && (
                  <div
                    style={{
                      color: "#d32f2f",
                      fontSize: "12px",
                      fontWeight: 600,
                      marginTop: "4px",
                    }}
                  >
                    ⚠️ {voiceError}
                  </div>
                )}
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
