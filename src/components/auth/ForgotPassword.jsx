import React, { useState, useEffect } from "react";
import { Button, Form } from "react-bootstrap";
import API from "../../helpers/api";
import toast from "react-hot-toast";
import { useRouter } from "../../helpers/useRouter";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { FiMail, FiLock } from "react-icons/fi";
import OtpInput from "react-otp-input";
import { useLoader } from "../../constants/LoaderContext";
import { motion } from "framer-motion";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [password, setPassword] = useState("");
  const [password1, setPassword1] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showPass1, setShowPass1] = useState(false);
  const [otp, setOtp] = useState();
  const [timer, setTimer] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const { setLoading } = useLoader();
  const [showPassUI, setShowPassUI] = useState(false);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds) => {
    const min = String(Math.floor(seconds / 60)).padStart(2, "0");
    const sec = String(seconds % 60).padStart(2, "0");
    return `${min}:${sec}`;
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async () => {
    if (!isValidEmail(email)) { setEmailError(true); return; }
    setEmailError(false);
    setLoading(true);
    API.apiPost("sendOTP", { email, userType: "admin" })
      .then((response) => {
        const data = response?.data?.response;
        if (data) { toast.success("OTP sent successfully."); setTimer(60); setShowTimer(true); }
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err?.response?.data?.error?.errorMessage || "Invalid email or error occurred.");
        setLoading(false);
      });
  };

  const handleVerify = async () => {
    setLoading(true);
    API.apiPost("verifyOTP", { email, otp })
      .then((response) => {
        const data = response?.data?.response;
        if (data) { toast.success("OTP verified successfully."); setShowPassUI(true); setShowTimer(false); }
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err?.response?.data?.error?.errorMessage || "Invalid OTP.");
        setLoading(false);
      });
  };

  const isValidPassword = (p) => /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()-]).{8,}$/.test(p);

  const handleUpdate = () => {
    if (!isValidPassword(password)) {
      toast.error("Password must have 8+ chars, 1 uppercase, 1 lowercase, 1 number & 1 special symbol.");
      return;
    }
    if (password !== password1) { toast.error("Passwords do not match."); return; }
    setLoading(true);
    API.apiPost("updatePassword", { email, newPassword: password, confirmNewPassword: password1 })
      .then((response) => {
        const data = response?.data?.response;
        if (data) { toast.success("Password updated successfully."); setLoading(false); router?.push("/"); }
      })
      .catch((err) => {
        toast.error(err?.response?.data?.error?.errorMessage || "Failed to update password.");
        setLoading(false);
      });
  };

  const inputBox = {
    display: "flex", alignItems: "center",
    background: "#ffffff", border: "1px solid #d1ead9",
    borderRadius: "12px", padding: "0 16px", height: "50px",
  };

  const labelStyle = { fontSize: "13px", fontWeight: 500, color: "#333", marginBottom: "8px", display: "block" };
  const controlStyle = { border: "none", boxShadow: "none", background: "transparent", fontSize: "14px", padding: "0 10px", color: "#333", height: "100%", flex: 1 };
  const btnGreen = { background: "linear-gradient(135deg, #1E8E3E 0%, #166C31 100%)", border: "none", borderRadius: "50px", fontWeight: 600, color: "#fff" };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fp-container"
      style={{
        height: "100vh", width: "100%", background: "#ffffff",
        display: "flex", overflow: "hidden",
        fontFamily: "'Avenir LT Std', 'Avenir', sans-serif",
      }}
    >
      {/* ── Left Panel ── */}
      <div className="fp-left-panel" style={{
        width: "45%", height: "100vh", display: "flex",
        flexDirection: "column", justifyContent: "center",
        alignItems: "center", overflow: "hidden",
        padding: "24px 48px", background: "#ffffff",
      }}>
        <div style={{ width: "100%", maxWidth: "600px" }}>

          {/* Logo */}
          <div style={{ marginBottom: "14px" }}>
            <img src="/images/meridiet-logo-primary.png" alt="MeriDiet"
              style={{ height: "72px", objectFit: "contain" }} />
          </div>

          {/* Heading */}
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "4px", lineHeight: 1.3 }}>
            {showPassUI ? "Set New Password" : "Forgot Password"}
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "16px", fontSize: "13px" }}>
            {showPassUI
              ? "Enter and confirm your new password below"
              : "Enter your email to receive a one-time password"}
          </p>

          {/* Form Card */}
          <div style={{ background: "#f0f9f3", borderRadius: "18px", padding: "22px 24px", border: "1px solid rgba(30,142,62,0.1)" }}>

            {!showPassUI ? (
              <>
                {/* Email Row */}
                <Form.Group style={{ marginBottom: "14px" }}>
                  <Form.Label style={labelStyle}>Email Address</Form.Label>
                  <div style={{
                    ...inputBox,
                    border: emailError ? "1px solid #ef4444" : "1px solid #d1ead9",
                    height: "52px",
                    padding: "0 8px 0 16px",
                  }}>
                    <FiMail size={16} color="#1E8E3E" style={{ flexShrink: 0 }} />
                    <Form.Control
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(false); }}
                      style={controlStyle}
                    />
                    <button
                      onClick={handleSubmit}
                      disabled={timer > 0}
                      style={{
                        flexShrink: 0,
                        background: timer > 0
                          ? "#ccc"
                          : "linear-gradient(135deg, #1E8E3E 0%, #166C31 100%)",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        padding: "6px 14px",
                        cursor: timer > 0 ? "not-allowed" : "pointer",
                        letterSpacing: "0.3px",
                      }}
                    >
                      {timer > 0 ? formatTime(timer) : "SEND OTP"}
                    </button>
                  </div>
                  {emailError && (
                    <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px", marginBottom: 0 }}>
                      Please enter a valid email address
                    </p>
                  )}
                </Form.Group>

                {/* OTP Row */}
                <Form.Group style={{ marginBottom: "14px" }}>
                  <Form.Label style={labelStyle}>
                    One-Time Password{" "}
                    {showTimer && (
                      <span style={{ color: "#1E8E3E", fontWeight: 600 }}>{formatTime(timer)}</span>
                    )}
                  </Form.Label>
                  <div className="fp-otp-row" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <OtpInput
                      value={otp}
                      name="otp"
                      onChange={setOtp}
                      numInputs={6}
                      inputStyle={{
                        backgroundColor: "#ffffff",
                        width: "44px", height: "44px",
                        borderRadius: "10px", margin: "0 3px",
                        border: "1px solid #d1ead9",
                        fontSize: "16px", fontWeight: 600, color: "#333",
                      }}
                      otpType="number"
                      renderInput={(props) => <input {...props} disabled={timer <= 0} />}
                    />
                    <Button
                      onClick={handleVerify}
                      style={{ ...btnGreen, height: "44px", fontSize: "13px", padding: "0 20px", whiteSpace: "nowrap" }}
                    >
                      VERIFY
                    </Button>
                  </div>
                  {showTimer && timer === 0 && (
                    <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px", marginBottom: 0 }}>
                      OTP expired. Click "SEND OTP" to get a new one.
                    </p>
                  )}
                </Form.Group>
              </>
            ) : (
              <>
                {/* New Password */}
                <Form.Group style={{ marginBottom: "14px" }}>
                  <Form.Label style={labelStyle}>New Password</Form.Label>
                  <div style={inputBox}>
                    <FiLock size={16} color="#1E8E3E" style={{ flexShrink: 0 }} />
                    <Form.Control
                      type={showPass ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={controlStyle}
                    />
                    <span onClick={() => setShowPass(!showPass)}
                      style={{ cursor: "pointer", color: "#aaa", flexShrink: 0, display: "flex", alignItems: "center" }}>
                      {showPass ? <IoEyeOutline size={18} /> : <IoEyeOffOutline size={18} />}
                    </span>
                  </div>
                </Form.Group>

                {/* Confirm Password */}
                <Form.Group style={{ marginBottom: "16px" }}>
                  <Form.Label style={labelStyle}>Confirm New Password</Form.Label>
                  <div style={inputBox}>
                    <FiLock size={16} color="#1E8E3E" style={{ flexShrink: 0 }} />
                    <Form.Control
                      type={showPass1 ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={password1}
                      onChange={(e) => setPassword1(e.target.value)}
                      style={controlStyle}
                    />
                    <span onClick={() => setShowPass1(!showPass1)}
                      style={{ cursor: "pointer", color: "#aaa", flexShrink: 0, display: "flex", alignItems: "center" }}>
                      {showPass1 ? <IoEyeOutline size={18} /> : <IoEyeOffOutline size={18} />}
                    </span>
                  </div>
                  {password1 && password !== password1 && (
                    <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px", marginBottom: 0 }}>
                      Passwords do not match
                    </p>
                  )}
                </Form.Group>

                {/* Update Button */}
                <Button onClick={handleUpdate} style={{ ...btnGreen, width: "100%", height: "46px", fontSize: "15px", letterSpacing: "0.3px", marginBottom: "12px" }}>
                  UPDATE PASSWORD
                </Button>
              </>
            )}

            {/* Back to Login */}
            <p style={{ textAlign: "center", margin: 0, fontSize: "13px", color: "#666", marginTop: showPassUI ? 0 : "8px" }}>
              Remember your password?{" "}
              <span onClick={() => router.push("/")}
                style={{ color: "#1E8E3E", fontWeight: 600, cursor: "pointer" }}>
                Login
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="fp-right-panel" style={{
        width: "55%", height: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        padding: "24px 24px 24px 12px", background: "#F2F5F3",
      }}>
        <div style={{
          width: "100%", height: "calc(100vh - 48px)", borderRadius: "28px",
          overflow: "hidden", position: "relative", background: "#e8f5ee",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {/* Background blobs */}
          <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "320px", height: "320px", borderRadius: "50%", background: "rgba(30,142,62,0.08)" }} />
          <div style={{ position: "absolute", bottom: "-40px", left: "-40px", width: "220px", height: "220px", borderRadius: "50%", background: "rgba(30,142,62,0.06)" }} />

          {/* Food image */}
          <img
            src="/images/login-food.png"
            alt="Healthy Food"
            style={{ width: "90%", maxWidth: "420px", height: "auto", objectFit: "contain", position: "relative", zIndex: 1, filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.12))" }}
          />

          {/* Bottom text card */}
          <div style={{
            position: "absolute", bottom: "32px", left: "28px", right: "28px",
            background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)",
            borderRadius: "16px", padding: "18px 22px", zIndex: 2,
            border: "1px solid rgba(30,142,62,0.12)",
          }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#111827" }}>
              Way to Healthy Life
            </p>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "13px" }}>
              Manage dietitians, users and nutrition plans — all in one place.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .form-control:focus {
          border-color: transparent !important;
          box-shadow: none !important;
        }
        html, body {
          height: 100% !important;
        }
        @media (max-width: 767px) {
          .fp-container {
            overflow-y: auto !important;
            height: auto !important;
            min-height: 100vh !important;
          }
          .fp-left-panel {
            width: 100% !important;
            height: auto !important;
            min-height: 100vh !important;
            padding: 60px 20px 40px !important;
            overflow: visible !important;
            justify-content: flex-start !important;
          }
          .fp-right-panel {
            display: none !important;
          }
.fp-otp-row {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .fp-otp-row > button {
            width: 100% !important;
            margin-top: 4px !important;
          }
          .fp-otp-row input {
            width: 36px !important;
            height: 36px !important;
            font-size: 14px !important;
            margin: 0 2px !important;
          }
          html, body {
            overflow: auto !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .fp-left-panel {
            width: 55% !important;
            padding: 24px 32px !important;
          }
          .fp-right-panel {
            width: 45% !important;
          }
        }
      `}</style>
    </motion.div>
  );
}
