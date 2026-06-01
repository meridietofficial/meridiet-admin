import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { getLoggedInUser, updateUserData } from "../../helpers/auth";
import { v4 as uuidv4 } from "uuid";
import { uploadFileToS3 } from "../../utils/S3";
import { getAdminProfile, updateAdminProfile } from "../../services/profileService";
import API, { setAuthorization } from "../../helpers/api";

const SectionCard = ({ icon, title, children }) => (
  <div style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "20px", overflow: "hidden" }}>
    <div style={{ padding: "18px 24px", borderBottom: "1px solid #edf1ee", display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #e8f5ee, #d1ead9)", display: "flex", alignItems: "center", justifyContent: "center", color: "#1E8E3E" }}>
        {icon}
      </div>
      <h6 style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#111827" }}>{title}</h6>
    </div>
    <div style={{ padding: "24px" }}>{children}</div>
  </div>
);

const FieldLabel = ({ children }) => (
  <label style={{ fontSize: "11px", fontWeight: 700, color: "#aaa", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: "7px" }}>
    {children}
  </label>
);

const inputStyle = {
  height: "44px", borderRadius: "10px", border: "1px solid #e5e5e5",
  padding: "0 14px", fontSize: "14px", color: "#333",
  width: "100%", outline: "none", transition: "border 0.2s", background: "#fff",
};

export default function User() {
  const user = getLoggedInUser();
  const [selectedImage, setSelectedImage] = useState(() => user?.avatar_url || null);
  const fileInputRef = useRef(null);
  const isImageUploadRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [phoneCode, setPhoneCode] = useState(user?.phone_code || "+91");

  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const initial = (fullName || "A").charAt(0).toUpperCase();

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      setAuthorization();
      const response = await getAdminProfile();
      if (response.success && response.data) {
        const d = response.data;
        setFullName(d.full_name || "");
        setEmail(d.email || "");
        setPhone(d.phone_number || "");
        setPhoneCode(d.phone_code || "+91");
        if (d.avatar_url) setSelectedImage(d.avatar_url);
      }
    } catch {
      // keep values seeded from localStorage
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdminProfile(); }, []);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select a valid image file"); return; }
    if (file.size > 15 * 1024 * 1024) { toast.error("Image size must be under 15 MB"); return; }
    setLoading(true);
    try {
      const uniqueFileName = `profile/${uuidv4()}_${file.name}`;
      const s3Url = await uploadFileToS3(file, uniqueFileName);
      isImageUploadRef.current = true;
      setSelectedImage(s3Url);
      updateUserData({ avatar_url: s3Url });
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const payload = {
        full_name: fullName.trim(),
        phone_code: phoneCode,
        phone_number: phone.trim(),
      };
      if (selectedImage) payload.avatar_url = selectedImage;

      const response = await updateAdminProfile(payload);
      if (response.success) {
        toast.success(response.message || "Profile updated successfully");
        updateUserData({ full_name: fullName.trim(), avatar_url: selectedImage || undefined });
        await fetchAdminProfile();
      } else {
        toast.error(response.message || "Failed to update profile");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedImage && isImageUploadRef.current) {
      handleUpdate();
      isImageUploadRef.current = false;
    }
  }, [selectedImage]);

  const handleSendOtp = async () => {
    if (!newEmail.trim()) { toast.error("Please enter a new email address."); return; }
    setEmailLoading(true);
    try {
      await API.apiPost("sendOTP", { email, userType: "admin" });
      setOtpSent(true);
      toast.success("OTP sent to your current email address.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send OTP.");
    } finally { setEmailLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) { toast.error("Please enter the OTP."); return; }
    setEmailLoading(true);
    try {
      await API.apiPost("verifyOTP", { email, otp });
      await API.apiPut("updateEmail", { email: newEmail.trim() });
      toast.success("Email updated successfully.");
      setEmail(newEmail.trim());
      updateUserData({ email: newEmail.trim() });
      setShowChangeEmail(false); setNewEmail(""); setOtp(""); setOtpSent(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid OTP. Please try again.");
    } finally { setEmailLoading(false); }
  };

  const greenFocus = (e) => (e.target.style.border = "1px solid #1E8E3E");
  const resetBorder = (e) => (e.target.style.border = "1px solid #e5e5e5");

  return (
    <SectionCard
      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
      title="Profile Information"
    >
      {/* Avatar row */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid #edf1ee" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          {selectedImage ? (
            <img src={selectedImage} alt="Profile" style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "3px solid #edf1ee" }} />
          ) : (
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #1E8E3E, #4ade80)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "28px", border: "3px solid #edf1ee" }}>
              {initial}
            </div>
          )}
          <div
            onClick={() => !loading && fileInputRef.current?.click()}
            style={{ position: "absolute", bottom: 0, right: 0, width: "26px", height: "26px", borderRadius: "50%", background: "#1E8E3E", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid #fff", boxShadow: "0 2px 6px rgba(30,142,62,0.4)" }}
            title="Change photo"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "16px", color: "#111827" }}>{fullName || "Admin"}</p>
          <p style={{ margin: "2px 0 12px", fontSize: "13px", color: "#1E8E3E", fontWeight: 500 }}>Administrator</p>
          <button onClick={() => !loading && fileInputRef.current?.click()} disabled={loading}
            style={{ height: "36px", padding: "0 16px", borderRadius: "8px", border: "1px solid #1E8E3E", background: "#f0f9f3", color: "#1E8E3E", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
            {loading ? "UPLOADING..." : "UPLOAD NEW PHOTO"}
          </button>
          <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#bbb" }}>PNG, JPEG — max 15 MB</p>
        </div>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} style={{ display: "none" }} disabled={loading} />
      </div>

      {/* Full name */}
      <div style={{ marginBottom: "16px" }}>
        <FieldLabel>Full Name</FieldLabel>
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" style={inputStyle} onFocus={greenFocus} onBlur={resetBorder} />
      </div>

      {/* Phone */}
      <div style={{ marginBottom: "20px" }}>
        <FieldLabel>Phone Number</FieldLabel>
        <div style={{ display: "flex", gap: "8px" }}>
          <input type="text" value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)} style={{ ...inputStyle, width: "80px" }} onFocus={greenFocus} onBlur={resetBorder} />
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" style={{ ...inputStyle, flex: 1 }} onFocus={greenFocus} onBlur={resetBorder} />
        </div>
      </div>

      {/* Email (read-only + change flow) */}
      <div style={{ marginBottom: "20px" }}>
        <FieldLabel>Email Address</FieldLabel>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ ...inputStyle, display: "flex", alignItems: "center", gap: "10px", background: "#f8f9fa", color: "#888", cursor: "default" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1E8E3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span style={{ fontSize: "14px" }}>{email || "—"}</span>
          </div>
          {!showChangeEmail && (
            <button onClick={() => setShowChangeEmail(true)}
              style={{ height: "44px", padding: "0 16px", borderRadius: "10px", border: "1px solid #1E8E3E", background: "#f0f9f3", color: "#1E8E3E", fontSize: "13px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              Change
            </button>
          )}
        </div>

        {showChangeEmail && (
          <div style={{ marginTop: "14px", background: "#f0f9f3", border: "1px solid rgba(30,142,62,0.15)", borderRadius: "12px", padding: "18px" }}>
            <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: "14px", color: "#333" }}>Change Email Address</p>
            <div style={{ marginBottom: "12px" }}>
              <FieldLabel>New Email</FieldLabel>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Enter new email address" disabled={otpSent}
                style={{ ...inputStyle, background: otpSent ? "#f8f8f8" : "#fff" }} onFocus={greenFocus} onBlur={resetBorder} />
            </div>
            {!otpSent ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleSendOtp} disabled={emailLoading}
                  style={{ height: "40px", padding: "0 20px", borderRadius: "8px", border: "none", background: "#1E8E3E", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                  {emailLoading ? "Sending..." : "Send OTP"}
                </button>
                <button onClick={() => { setShowChangeEmail(false); setNewEmail(""); setOtp(""); setOtpSent(false); }}
                  style={{ height: "40px", padding: "0 16px", borderRadius: "8px", border: "1px solid #e5e5e5", background: "#fff", color: "#666", fontSize: "13px", cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <p style={{ fontSize: "12px", color: "#999", margin: "0 0 10px" }}>OTP sent to <strong style={{ color: "#555" }}>{email}</strong></p>
                <div style={{ marginBottom: "12px" }}>
                  <FieldLabel>Enter OTP</FieldLabel>
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" maxLength={6}
                    style={{ ...inputStyle, letterSpacing: "6px", fontSize: "18px", maxWidth: "200px", textAlign: "center" }} onFocus={greenFocus} onBlur={resetBorder} />
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button onClick={handleVerifyOtp} disabled={emailLoading}
                    style={{ height: "40px", padding: "0 20px", borderRadius: "8px", border: "none", background: "#1E8E3E", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                    {emailLoading ? "Verifying..." : "Verify & Update"}
                  </button>
                  <button onClick={handleSendOtp} disabled={emailLoading}
                    style={{ height: "40px", padding: "0 16px", borderRadius: "8px", border: "1px solid #1E8E3E", background: "#fff", color: "#1E8E3E", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>
                    Resend OTP
                  </button>
                  <button onClick={() => { setShowChangeEmail(false); setNewEmail(""); setOtp(""); setOtpSent(false); }}
                    style={{ height: "40px", padding: "0 16px", borderRadius: "8px", border: "1px solid #e5e5e5", background: "#fff", color: "#666", fontSize: "13px", cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Save */}
      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "4px" }}>
        <button onClick={handleUpdate} disabled={loading}
          style={{ height: "44px", padding: "0 28px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #1E8E3E, #166C31)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", letterSpacing: "0.5px", boxShadow: "0 4px 14px rgba(30,142,62,0.3)", opacity: loading ? 0.7 : 1 }}>
          {loading ? "SAVING..." : "SAVE CHANGES"}
        </button>
      </div>
    </SectionCard>
  );
}
