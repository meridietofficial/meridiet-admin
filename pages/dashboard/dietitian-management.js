import DietitianTable from "../../src/components/dietitian/DietitianTable";

const DietitianManagement = () => {
  return (
    <div style={{ padding: "4px 0" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <div style={{ width: "4px", height: "28px", background: "linear-gradient(180deg, #1E8E3E, #4ade80)", borderRadius: "4px" }} />
          <h2 className="fw700 mb-0">
            <span style={{ color: "#111827" }}>DIETITIAN</span>
            <span style={{ color: "#1E8E3E" }}> MANAGEMENT</span>
          </h2>
        </div>
        <p style={{ color: "#999", marginBottom: 0, paddingLeft: "14px" }}>View and manage all approved and active dietitians.</p>
      </div>

      <DietitianTable apiKey="dietitianList" showVerify={false} />
    </div>
  );
};

export default DietitianManagement;
