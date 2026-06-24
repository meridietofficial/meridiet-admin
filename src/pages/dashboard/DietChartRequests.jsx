import { useState } from "react";
import { LuSalad } from "react-icons/lu";
import { MdCheckCircle } from "react-icons/md";
import { HiChartBar } from "react-icons/hi";
import { FaLayerGroup } from "react-icons/fa";
import DietRequestTable from "../../components/diet-requests/DietRequestTable";

const StatBox = ({ label, value, icon, color, bg }) => (
  <div style={{ background: bg, borderRadius: "12px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px", border: `1px solid ${color}22`, minWidth: "110px" }}>
    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <p style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>
        {value ?? <span style={{ fontSize: "12px", color: "#aaa" }}>—</span>}
      </p>
      <p style={{ margin: 0, fontSize: "10px", color: "#6b7280", fontWeight: 500, marginTop: "1px", whiteSpace: "nowrap" }}>{label}</p>
    </div>
  </div>
);

const DietChartRequests = () => {
  const [stats, setStats]       = useState({ total: null, basic: null, standard: null, other: null });
  const [activeTab, setActiveTab] = useState("paid");

  const isPaid = activeTab === "paid";

  const labels = {
    total:    isPaid ? "Total Paid"      : "Total Requests",
    basic:    isPaid ? "Basic (Paid)"    : "Basic (Unpaid)",
    standard: isPaid ? "Standard (Paid)" : "Standard (Unpaid)",
    other:    isPaid ? "Advance (Paid)"  : "Advance (Unpaid)",
  };

  return (
    <div style={{ padding: "4px 0" }}>
      {/* Header row: title left, stat boxes right */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
        {/* Left: Title */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
            <div style={{ width: "4px", height: "20px", background: "linear-gradient(180deg, #1E8E3E, #4ade80)", borderRadius: "4px" }} />
            <h4 className="fw700 mb-0" style={{ fontSize: "1.15rem" }}>
              <span style={{ color: "#111827" }}>DIET CHART</span>
              <span style={{ color: "#1E8E3E" }}> REQUESTS</span>
            </h4>
          </div>
          <p style={{ color: "#999", marginBottom: 0, paddingLeft: "14px", fontSize: "13px" }}>Review diet chart requests and plan details submitted by users.</p>
        </div>

        {/* Right: Stat Boxes — labels change per active tab */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <StatBox label={labels.total}    value={stats.total}    icon={<HiChartBar style={{ color: "#6366f1", fontSize: "18px" }} />} color="#6366f1" bg="#f5f3ff" />
          <StatBox label={labels.basic}    value={stats.basic}    icon={<LuSalad size={16} color="#1E8E3E" />}                         color="#1E8E3E" bg="#f0fdf4" />
          <StatBox label={labels.standard} value={stats.standard} icon={<MdCheckCircle style={{ color: "#3b82f6", fontSize: "18px" }} />} color="#3b82f6" bg="#eff6ff" />
          <StatBox label={labels.other}    value={stats.other}    icon={<FaLayerGroup style={{ color: "#f59e0b", fontSize: "16px" }} />}  color="#f59e0b" bg="#fffbeb" />
        </div>
      </div>

      <DietRequestTable
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onStatsChange={setStats}
      />
    </div>
  );
};

export default DietChartRequests;
