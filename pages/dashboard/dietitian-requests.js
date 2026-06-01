import DietitianTable from "../../src/components/dietitian/DietitianTable";

const DietitianRequests = () => {
  return (
    <div style={{ padding: "4px 0" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <div style={{ width: "4px", height: "28px", background: "linear-gradient(180deg, #F59E0B, #FCD34D)", borderRadius: "4px" }} />
          <h2 className="fw700 mb-0">
            <span style={{ color: "#111827" }}>DIETITIAN</span>
            <span style={{ color: "#F59E0B" }}> REQUESTS</span>
          </h2>
        </div>
        <p style={{ color: "#999", marginBottom: 0, paddingLeft: "14px" }}>Review and verify pending dietitian applications.</p>
      </div>

      <DietitianTable apiKey="dietitianRequests" showVerify={true} />
    </div>
  );
};

export default DietitianRequests;
