import React, { useState } from "react";
import { MdCheckCircle, MdPersonOff } from "react-icons/md";
import { HiUsers } from "react-icons/hi";
import ExistingUserTable from "./ExistingUserTable";

const StatBox = ({ label, value, icon, color, bg }) => (
  <div style={{ background: bg, borderRadius: "12px", padding: "12px 18px", display: "flex", alignItems: "center", gap: "12px", border: `1px solid ${color}22`, minWidth: "130px" }}>
    <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <p style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>
        {value ?? <span style={{ fontSize: "13px", color: "#aaa" }}>—</span>}
      </p>
      <p style={{ margin: 0, fontSize: "11px", color: "#6b7280", fontWeight: 500, marginTop: "1px", whiteSpace: "nowrap" }}>{label}</p>
    </div>
  </div>
);

export default function Index() {
  const [stats, setStats] = useState({ total: null, active: null, blocked: null });

  return (
    <div style={{ padding: "4px 0" }}>
      {/* Page Title + Stat Boxes */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        {/* Left: Title */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div style={{ width: "4px", height: "28px", background: "linear-gradient(180deg, #1E8E3E, #4ade80)", borderRadius: "4px" }} />
            <h2 className="fw700 mb-0">
              <span style={{ color: "#111827" }}>USER</span>
              <span style={{ color: "#1E8E3E" }}> MANAGEMENT</span>
            </h2>
          </div>
          <p style={{ color: "#999", marginBottom: 0, paddingLeft: "14px" }}>View, manage and monitor all registered users.</p>
        </div>

        {/* Right: Stat Boxes */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <StatBox
            label="Total Users"
            value={stats.total}
            icon={<HiUsers style={{ color: "#6366f1", fontSize: "20px" }} />}
            color="#6366f1"
            bg="#f5f3ff"
          />
          <StatBox
            label="Active Users"
            value={stats.active}
            icon={<MdCheckCircle style={{ color: "#16a34a", fontSize: "20px" }} />}
            color="#16a34a"
            bg="#f0fdf4"
          />
          <StatBox
            label="Blocked Users"
            value={stats.blocked}
            icon={<MdPersonOff style={{ color: "#ef4444", fontSize: "20px" }} />}
            color="#ef4444"
            bg="#fef2f2"
          />
        </div>
      </div>

      <ExistingUserTable onStatsChange={setStats} />
    </div>
  );
}
