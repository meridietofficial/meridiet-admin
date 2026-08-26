import { useState } from "react";
import { LuBrainCircuit, LuClock, LuCheckCircle, LuLoader, LuXCircle } from "react-icons/lu";
import { HiChartBar } from "react-icons/hi";
import AIDietPlanTable from "../../components/ai-diet-plans/AIDietPlanTable";

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

export default function AIDietPlans() {
  const [activeTab, setActiveTab] = useState("completed");
  const [counts, setCounts]       = useState({ completed: null, sent: null, failed: null, generating: null });

  return (
    <div style={{ padding: "4px 0" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
        {/* Title */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
            <div style={{ width: "4px", height: "20px", background: "linear-gradient(180deg, #1E8E3E, #4ade80)", borderRadius: "4px" }} />
            <h4 className="fw700 mb-0" style={{ fontSize: "1.15rem" }}>
              <span style={{ color: "#111827" }}>AI DIET</span>
              <span style={{ color: "#1E8E3E" }}> PLANS</span>
            </h4>
          </div>
          <p style={{ color: "#999", marginBottom: 0, paddingLeft: "14px", fontSize: "13px" }}>
            Review AI-generated diet plans and send them to users.
          </p>
        </div>

        {/* Stat boxes */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <StatBox label="Pending Review" value={counts.completed}  icon={<LuClock style={{ color: "#3b82f6", fontSize: "18px" }} />}      color="#3b82f6" bg="#eff6ff" />
          <StatBox label="Sent"           value={counts.sent}       icon={<LuCheckCircle style={{ color: "#10B981", fontSize: "18px" }} />} color="#10B981" bg="#ecfdf5" />
          <StatBox label="Generating"     value={counts.generating} icon={<LuLoader style={{ color: "#F59E0B", fontSize: "18px" }} />}      color="#F59E0B" bg="#FFF8E1" />
          <StatBox label="Failed"         value={counts.failed}     icon={<LuXCircle style={{ color: "#EF4444", fontSize: "18px" }} />}     color="#EF4444" bg="#FEF2F2" />
          <StatBox label="Total"          value={[counts.completed, counts.sent, counts.failed, counts.generating].every(v => v != null) ? counts.completed + counts.sent + counts.failed + counts.generating : null} icon={<HiChartBar style={{ color: "#6366f1", fontSize: "18px" }} />} color="#6366f1" bg="#f5f3ff" />
        </div>
      </div>

      <AIDietPlanTable activeTab={activeTab} onTabChange={setActiveTab} onCountsChange={setCounts} />
    </div>
  );
}
