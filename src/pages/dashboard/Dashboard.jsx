import { useState, useEffect } from "react";
import API from "../../helpers/api";

const statCards = [
  {
    key: "totalUsers",
    label: "Total Users",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    color: "#1E8E3E",
    bg: "linear-gradient(135deg, #e8f5ee 0%, #d1ead9 100%)",
    border: "rgba(30, 142, 62, 0.2)",
  },
  {
    key: "activeUsers",
    label: "Active Users",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    color: "#3b82f6",
    bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    border: "rgba(59, 130, 246, 0.2)",
  },
  {
    key: "blockedUsers",
    label: "Blocked Users",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
    ),
    color: "#ef4444",
    bg: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
    border: "rgba(239, 68, 68, 0.2)",
  },
  {
    key: "newToday",
    label: "New Today",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    color: "#7c3aed",
    bg: "linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)",
    border: "rgba(124, 58, 237, 0.2)",
  },
];

const quickLinks = [
  { label: "Manage Users", desc: "View and manage all registered users", href: "/dashboard/user-management", color: "#1E8E3E" },
  { label: "Dietitian Management", desc: "Review and verify registered dietitians", href: "/dashboard/dietitian-management", color: "#3b82f6" },
  { label: "Settings", desc: "Update your profile and preferences", href: "/dashboard/setting", color: "#7c3aed" },
];

const Dashboard = () => {
  const [stats, setStats] = useState({ totalUsers: "—", activeUsers: "—", blockedUsers: "—", newToday: "—" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.apiGet("existingUserList", "?page=1&limit=1")
      .then((res) => {
        const total = res?.data?.response?.pagination?.totalUsers || res?.data?.response?.totalUsers || "—";
        setStats((s) => ({ ...s, totalUsers: total }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "4px 0" }}>
      {/* Page title */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <div style={{ width: "4px", height: "28px", background: "linear-gradient(180deg, #1E8E3E, #4ade80)", borderRadius: "4px" }} />
          <h2 className="fw700 mb-0">
            <span style={{ color: "#111827" }}>DASH</span>
            <span style={{ color: "#1E8E3E" }}>BOARD</span>
          </h2>
        </div>
        <p style={{ color: "#999", marginBottom: 0, paddingLeft: "14px" }}>Welcome back — here's what's happening today.</p>
      </div>

      {/* Stat cards */}
      <div className="dash-stats-grid" style={{ marginBottom: "28px" }}>
        {statCards.map((card) => (
          <div
            key={card.key}
            style={{
              background: card.bg,
              border: `1px solid ${card.border}`,
              borderRadius: "16px",
              padding: "20px 22px",
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            className="dash-stat-card"
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
              <div
                style={{
                  width: "44px", height: "44px", borderRadius: "12px",
                  background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  color: card.color, boxShadow: `0 4px 12px ${card.border}`,
                  flexShrink: 0,
                }}
              >
                {card.icon}
              </div>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: card.color, opacity: 0.08,
                position: "absolute", top: "14px", right: "18px",
              }} />
              <div style={{
                width: "55px", height: "55px", borderRadius: "50%",
                background: card.color, opacity: 0.06,
                position: "absolute", top: "-10px", right: "-10px",
              }} />
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "#888", fontWeight: 500, marginBottom: "4px" }}>{card.label}</p>
            <h3 style={{ margin: 0, fontWeight: 800, color: card.color, fontSize: "28px" }}>
              {loading && card.key === "totalUsers" ? (
                <span style={{ display: "inline-block", width: "40px", height: "20px", background: "#ddd", borderRadius: "4px", animation: "pulse 1.4s ease infinite" }} />
              ) : (
                stats[card.key]
              )}
            </h3>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div style={{ marginBottom: "24px" }}>
        <h6 style={{ fontWeight: 700, color: "#555", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.8px", fontSize: "12px" }}>
          Quick Access
        </h6>
        <div className="dash-quick-grid">
          {quickLinks.map((link, i) => (
            <a
              key={i}
              href={link.href}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #f0ece7",
                  borderRadius: "14px",
                  padding: "18px 22px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
                className="dash-quick-card"
              >
                <div style={{
                  width: "42px", height: "42px", borderRadius: "10px",
                  background: `${link.color}15`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: link.color }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#1a1a1a" }}>{link.label}</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>{link.desc}</p>
                </div>
                <svg style={{ marginLeft: "auto", color: "#ccc" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>

      <style>{`
        .dash-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .dash-stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        .dash-quick-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .dash-quick-card:hover {
          border-color: #1E8E3E !important;
          box-shadow: 0 4px 16px rgba(30, 142, 62, 0.12);
          transform: translateY(-2px);
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 991px) {
          .dash-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .dash-quick-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 575px) {
          .dash-stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
