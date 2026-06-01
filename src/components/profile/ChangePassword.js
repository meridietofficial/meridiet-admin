import { useState } from "react";
import API from "../../helpers/api";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const FieldLabel = ({ children }) => (
  <label style={{ fontSize: "11px", fontWeight: 700, color: "#aaa", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: "7px" }}>
    {children}
  </label>
);

const PasswordInput = ({ label, value, onChange, show, onToggle, placeholder }) => (
  <div style={{ flex: 1, minWidth: "200px" }}>
    <FieldLabel>{label}</FieldLabel>
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={100}
        style={{
          height: "44px",
          borderRadius: "10px",
          border: "1px solid #e5e5e5",
          padding: "0 44px 0 14px",
          fontSize: "14px",
          color: "#333",
          width: "100%",
          outline: "none",
          background: "#fff",
          transition: "border 0.2s",
        }}
        onFocus={(e) => (e.target.style.border = "1px solid #1E8E3E")}
        onBlur={(e) => (e.target.style.border = "1px solid #e5e5e5")}
      />
      <span
        onClick={onToggle}
        style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#bbb", fontSize: "15px", display: "flex" }}
      >
        {show ? <FaEye /> : <FaEyeSlash />}
      </span>
    </div>
  </div>
);

export default function ChangePassword() {
  const [pass, setPass] = useState("");
  const [newPass, setnewPass] = useState("");
  const [conPass, setconPass] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!pass || !newPass || !conPass) { toast.error("Please fill all password fields."); return; }
    if (newPass.length < 6) { toast.error("New password must be at least 6 characters."); return; }
    if (newPass === pass) { toast.error("New password must differ from current password."); return; }
    if (newPass !== conPass) { toast.error("New passwords do not match."); return; }

    setLoading(true);
    API.apiPut("changePassword", { current_password: pass, new_password: newPass })
      .then((response) => {
        toast.success(response?.data?.message || "Password changed successfully.");
        setPass(""); setnewPass(""); setconPass("");
      })
      .catch((err) => {
        const msg = err?.response?.status === 401
          ? "Current password is incorrect."
          : err?.response?.data?.message || "Failed to change password.";
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  };

  const allFilled = pass && newPass && conPass && newPass.length >= 6 && newPass !== pass && newPass === conPass;
  const passwordsMatch = newPass && conPass && newPass === conPass;
  const passwordsMismatch = newPass && conPass && newPass !== conPass;

  return (
    <div style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "20px", overflow: "hidden" }}>
      {/* Card header */}
      <div style={{ padding: "18px 24px", borderBottom: "1px solid #f5f0eb", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #e8f5ee, #d1ead9)", display: "flex", alignItems: "center", justifyContent: "center", color: "#1E8E3E" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h6 style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#1a1a1a" }}>Change Password</h6>
      </div>

      <div style={{ padding: "24px" }}>
        {/* Current password full width */}
        <div style={{ marginBottom: "16px" }}>
          <PasswordInput
            label="Current Password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            show={showCurrent}
            onToggle={() => setShowCurrent(!showCurrent)}
            placeholder="Enter your current password"
          />
        </div>

        {/* New + Confirm side by side */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
          <PasswordInput
            label="New Password"
            value={newPass}
            onChange={(e) => setnewPass(e.target.value)}
            show={showNew}
            onToggle={() => setShowNew(!showNew)}
            placeholder="Enter new password"
          />
          <PasswordInput
            label="Confirm New Password"
            value={conPass}
            onChange={(e) => setconPass(e.target.value)}
            show={showConfirm}
            onToggle={() => setShowConfirm(!showConfirm)}
            placeholder="Re-enter new password"
          />
        </div>

        {/* Match indicator */}
        {(passwordsMatch || passwordsMismatch) && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: passwordsMatch ? "#28a745" : "#e52945" }} />
            <span style={{ fontSize: "12px", color: passwordsMatch ? "#28a745" : "#e52945", fontWeight: 600 }}>
              {passwordsMatch ? "Passwords match" : "Passwords do not match"}
            </span>
          </div>
        )}

        {/* Requirements */}
        <div style={{ background: "#faf9f8", borderRadius: "10px", padding: "12px 16px", marginBottom: "24px", display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {[
            { text: "Minimum 6 characters", ok: newPass.length >= 6 },
            { text: "Must differ from current", ok: !!newPass && newPass !== pass },
            { text: "Passwords must match", ok: !!passwordsMatch },
          ].map(({ text, ok }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: ok ? "#28a745" : "#e5e5e5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {ok && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <span style={{ fontSize: "12px", color: ok ? "#555" : "#bbb", fontWeight: ok ? 600 : 400 }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleUpdate}
            disabled={loading || !allFilled}
            style={{
              height: "44px",
              padding: "0 28px",
              borderRadius: "10px",
              border: "none",
              background: allFilled ? "linear-gradient(135deg, #1E8E3E, #166C31)" : "#edf1ee",
              color: allFilled ? "#fff" : "#bbb",
              fontSize: "13px",
              fontWeight: 700,
              cursor: allFilled && !loading ? "pointer" : "not-allowed",
              letterSpacing: "0.5px",
              boxShadow: allFilled ? "0 4px 14px rgba(30,142,62,0.3)" : "none",
              transition: "all 0.2s",
            }}
          >
            {loading ? "UPDATING..." : "UPDATE PASSWORD"}
          </button>
        </div>
      </div>
    </div>
  );
}
