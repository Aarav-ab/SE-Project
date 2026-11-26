import { useState, type FormEvent } from "react";
import { useComplaint, type UserProfile } from "../ComplaintContext";

type ProfileFields = Omit<UserProfile, "id" | "email">;

const emptyFields: ProfileFields = {
  name: "",
  mobileNumber: "",
  houseFlatNumber: "",
  streetLocality: "",
  areaWard: "",
  city: "",
  state: "",
  pinCode: "",
  landmark: "",
  preferredLanguage: "English",
};

function editableFields(profile: UserProfile): ProfileFields {
  return {
    name: profile.name,
    mobileNumber: profile.mobileNumber,
    houseFlatNumber: profile.houseFlatNumber,
    streetLocality: profile.streetLocality,
    areaWard: profile.areaWard,
    city: profile.city,
    state: profile.state,
    pinCode: profile.pinCode,
    landmark: profile.landmark,
    preferredLanguage: profile.preferredLanguage,
  };
}

function MyAccountModal() {
  const {
    profile,
    profileOpen,
    profileLoading,
    profileError,
    profileSaved,
    closeMyAccount,
    saveProfile,
  } = useComplaint();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileFields>(emptyFields);
  const [saving, setSaving] = useState(false);

  if (!profileOpen) return null;

  function updateField<K extends keyof ProfileFields>(key: K, value: ProfileFields[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      await saveProfile({ ...draft, id: profile.id, email: profile.email });
      setEditing(false);
    } catch {
      // The context presents the API error in this dialog.
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    if (profile) setDraft(editableFields(profile));
    setEditing(false);
  }

  const values = profile && !editing ? editableFields(profile) : draft;
  const addressComplete = Boolean(
    values.houseFlatNumber &&
    values.streetLocality &&
    values.city &&
    values.state &&
    values.pinCode,
  );
  const completionItems = [
    ["Name", Boolean(values.name)],
    ["Mobile number", Boolean(values.mobileNumber)],
    ["Residential address", addressComplete],
  ] as const;

  return (
    <div
      className="confirmation-overlay profile-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeMyAccount();
      }}
    >
      <section
        className="confirmation-modal profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="my-account-title"
      >
        <button type="button" className="timeline-close" onClick={closeMyAccount} aria-label="Close My Account">×</button>
        <div className="profile-modal-heading">
          <span className="timeline-eyebrow">NAGRIKCONNECT</span>
          <h2 id="my-account-title">My Account</h2>
          <p className="text-body">Manage your contact details and residential address.</p>
        </div>

        {profileLoading && !profile && <p className="text-body" role="status">Loading your profile…</p>}
        {!profileLoading && !profile && !profileError && (
          <p className="text-body" role="status">Your profile could not be loaded.</p>
        )}

        {profile && (
          <form id="profile-edit-form" onSubmit={handleSave}>
            <div className="profile-completion">
              <strong>Profile details</strong>
              <div className="profile-completion-items">
                {completionItems.map(([label, complete]) => (
                  <span key={label} className={complete ? "profile-complete" : "profile-missing"}>
                    {label}: {complete ? "Completed" : "Missing"}
                  </span>
                ))}
              </div>
            </div>

            <div className="profile-fields">
              <div className="field">
                <label htmlFor="profile-name">Full Name <span className="req">*</span></label>
                <input id="profile-name" type="text" autoComplete="name" maxLength={100} required disabled={!editing} value={values.name} onChange={(event) => updateField("name", event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="profile-email">Email Address</label>
                <input id="profile-email" type="email" autoComplete="email" disabled value={profile.email} />
                <p className="small text-muted">Email changes require verification and aren’t available here.</p>
              </div>
              <div className="field">
                <label htmlFor="profile-mobile">Mobile Number</label>
                <input id="profile-mobile" type="tel" autoComplete="tel" inputMode="tel" pattern="(?:\+?91[\s-]?)?[6-9][0-9]{9}" maxLength={20} disabled={!editing} value={values.mobileNumber} onChange={(event) => updateField("mobileNumber", event.target.value)} />
                <p className="small text-muted">Not verified. Enter a 10-digit Indian mobile number.</p>
              </div>

              <h3 className="profile-section-title">Residential address</h3>
              <div className="profile-grid">
                <div className="field">
                  <label htmlFor="profile-house">House / Flat Number</label>
                  <input id="profile-house" autoComplete="address-line1" maxLength={100} disabled={!editing} value={values.houseFlatNumber} onChange={(event) => updateField("houseFlatNumber", event.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="profile-street">Street / Locality</label>
                  <input id="profile-street" autoComplete="address-line2" maxLength={200} disabled={!editing} value={values.streetLocality} onChange={(event) => updateField("streetLocality", event.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="profile-area">Area / Sector / Ward</label>
                  <input id="profile-area" maxLength={200} disabled={!editing} value={values.areaWard} onChange={(event) => updateField("areaWard", event.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="profile-city">City</label>
                  <input id="profile-city" autoComplete="address-level2" maxLength={100} disabled={!editing} value={values.city} onChange={(event) => updateField("city", event.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="profile-state">State</label>
                  <input id="profile-state" autoComplete="address-level1" maxLength={100} disabled={!editing} value={values.state} onChange={(event) => updateField("state", event.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="profile-pin">PIN Code</label>
                  <input id="profile-pin" autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} disabled={!editing} value={values.pinCode} onChange={(event) => updateField("pinCode", event.target.value.replace(/\D/g, ""))} />
                </div>
                <div className="field profile-full-width">
                  <label htmlFor="profile-landmark">Landmark (optional)</label>
                  <input id="profile-landmark" maxLength={200} disabled={!editing} value={values.landmark} onChange={(event) => updateField("landmark", event.target.value)} />
                </div>
              </div>

              <div className="field profile-language">
                <label htmlFor="profile-language">Preferred Language</label>
                <select id="profile-language" disabled={!editing} value={values.preferredLanguage} onChange={(event) => updateField("preferredLanguage", event.target.value as ProfileFields["preferredLanguage"])}>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>
            </div>

            {profileError && <p className="auth-error" role="alert">{profileError}</p>}
            {profileSaved && <p className="profile-success" role="status">Your profile changes have been saved.</p>}

          </form>
        )}
        {profile && (
          <div className="profile-actions">
            {editing ? (
              <>
                <button type="button" className="btn btn-secondary" onClick={cancelEdit} disabled={saving}>Cancel</button>
                <button type="submit" form="profile-edit-form" className="btn btn-navy" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-secondary" onClick={closeMyAccount}>Close</button>
                <button type="button" className="btn btn-navy" onClick={(event) => {
                  event.preventDefault();
                  if (profile) setDraft(editableFields(profile));
                  setEditing(true);
                }}>Edit Profile</button>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default MyAccountModal;
