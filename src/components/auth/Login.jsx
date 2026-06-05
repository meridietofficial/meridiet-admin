import React, { useState, useEffect } from "react";
import { Button, Form } from "react-bootstrap";
import API from "../../helpers/api";
import toast from "react-hot-toast";
import * as auth from "../../helpers/auth";
import { useRouter } from "../../helpers/useRouter";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { useLoader } from "../../constants/LoaderContext";
import { motion } from "framer-motion";
import { FiUser, FiLock } from "react-icons/fi";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { setLoading } = useLoader();

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    const payload = { email, password, user_type: "admin" };

    API.apiPost("login", payload)
      .then((response) => {
        const res = response?.data;
        const data = res?.data;
        if (res?.success && data) {
          toast.success("Successfully Login.");
          auth.login(
            `Bearer ${data?.tokens?.accessToken}`,
            data?.tokens?.refreshToken,
            data?.user
          );
          router.push("/dashboard");
        } else {
          toast.error(res?.message || "Login failed. Please try again.");
        }
        setLoading(false);
      })
      .catch((err) => {
        toast.error(
          err?.response?.data?.error?.errorMessage ||
            "Invalid email/password."
        );
        setLoading(false);
      });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        height: "100vh",
        width: "100%",
        background: "#ffffff",
        display: "flex",
        overflow: "hidden",
        fontFamily: "'Avenir LT Std', 'Avenir', sans-serif",
      }}
    >
      {/* ── Left Panel ── */}
      <div
        style={{
          width: "45%",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          padding: "24px 48px",
          background: "#ffffff",
        }}
      >
        <div style={{ width: "100%", maxWidth: "600px" }}>

          {/* Logo */}
          <div style={{ marginBottom: "14px" }}>
            <img
              src="/images/meridiet-logo-primary.png"
              alt="MeriDiet"
              style={{ height: "72px", objectFit: "contain" }}
            />
          </div>

          {/* Heading */}
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "4px",
              lineHeight: 1.3,
            }}
          >
            Welcome Back
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "16px", fontSize: "13px" }}>
            Sign in to your admin portal
          </p>

          {/* Form Card */}
          <div
            style={{
              background: "#f0f9f3",
              borderRadius: "18px",
              padding: "22px 24px",
              border: "1px solid rgba(30,142,62,0.1)",
            }}
          >
            {/* Email */}
            <Form.Group style={{ marginBottom: "14px" }}>
              <Form.Label
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#333",
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                Email Address
              </Form.Label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#ffffff",
                  border: "1px solid #d1ead9",
                  borderRadius: "12px",
                  padding: "0 16px",
                  height: "50px",
                }}
              >
                <FiUser size={16} color="#1E8E3E" style={{ flexShrink: 0 }} />
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{
                    border: "none",
                    boxShadow: "none",
                    background: "transparent",
                    fontSize: "14px",
                    padding: "0 10px",
                    color: "#333",
                    height: "100%",
                  }}
                />
              </div>
            </Form.Group>

            {/* Password */}
            <Form.Group style={{ marginBottom: "14px" }}>
              <Form.Label
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#333",
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                Password
              </Form.Label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#ffffff",
                  border: "1px solid #d1ead9",
                  borderRadius: "12px",
                  padding: "0 16px",
                  height: "50px",
                }}
              >
                <FiLock size={16} color="#1E8E3E" style={{ flexShrink: 0 }} />
                <Form.Control
                  type={showPass ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{
                    border: "none",
                    boxShadow: "none",
                    background: "transparent",
                    fontSize: "14px",
                    padding: "0 10px",
                    color: "#333",
                    flex: 1,
                    height: "100%",
                  }}
                />
                <span
                  onClick={() => setShowPass(!showPass)}
                  style={{ cursor: "pointer", color: "#aaa", flexShrink: 0, display: "flex", alignItems: "center" }}
                >
                  {showPass
                    ? <IoEyeOutline size={18} />
                    : <IoEyeOffOutline size={18} />}
                </span>
              </div>
            </Form.Group>

            {/* Remember Me */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  accentColor: "#1E8E3E",
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              />
              <label
                htmlFor="rememberMe"
                style={{
                  marginLeft: "8px",
                  fontSize: "13px",
                  color: "#555",
                  cursor: "pointer",
                  marginBottom: 0,
                }}
              >
                Remember Me
              </label>
            </div>

            {/* Login Button */}
            <Button
              onClick={handleSubmit}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #1E8E3E 0%, #166C31 100%)",
                border: "none",
                borderRadius: "50px",
                height: "46px",
                fontSize: "15px",
                fontWeight: 600,
                color: "#fff",
                letterSpacing: "0.3px",
                marginBottom: "12px",
              }}
            >
              Login
            </Button>

            {/* Forgot Password */}
            <p
              style={{
                textAlign: "center",
                margin: 0,
                fontSize: "13px",
                color: "#666",
              }}
            >
              Forgot Password?{" "}
              <span
                onClick={() => router.push("/forgot-password")}
                style={{
                  color: "#1E8E3E",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Reset
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div
        style={{
          width: "55%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 24px 24px 12px",
          background: "#F2F5F3",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "calc(100vh - 48px)",
            borderRadius: "28px",
            overflow: "hidden",
            position: "relative",
            background: "#e8f5ee",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Background blob */}
          <div style={{
            position: "absolute",
            top: "-60px",
            right: "-60px",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "rgba(30,142,62,0.08)",
          }} />
          <div style={{
            position: "absolute",
            bottom: "-40px",
            left: "-40px",
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            background: "rgba(30,142,62,0.06)",
          }} />

          {/* Food image */}
          <img
            src="/images/login-food.png"
            alt="Healthy Food"
            style={{
              width: "90%",
              maxWidth: "420px",
              height: "auto",
              objectFit: "contain",
              position: "relative",
              zIndex: 1,
              filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.12))",
            }}
          />

          {/* Bottom text card */}
          <div style={{
            position: "absolute",
            bottom: "32px",
            left: "28px",
            right: "28px",
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(12px)",
            borderRadius: "16px",
            padding: "18px 22px",
            zIndex: 2,
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

      {/* Global style overrides */}
      <style>{`
        .form-control:focus {
          border-color: transparent !important;
          box-shadow: none !important;
        }
        html, body {
          overflow: hidden !important;
          height: 100% !important;
        }
      `}</style>
    </motion.div>
  );
}
