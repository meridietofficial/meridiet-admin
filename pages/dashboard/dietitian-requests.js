import DietitianTable from "../../src/components/dietitian/DietitianTable";

const DietitianRequests = () => {
  return (
    <div style={{ padding: "4px 0" }}>
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
          <div style={{ width: "4px", height: "20px", background: "linear-gradient(180deg, #F59E0B, #FCD34D)", borderRadius: "4px" }} />
          <h4 className="fw700 mb-0" style={{ fontSize: "1.15rem" }}>
            <span style={{ color: "#111827" }}>DIETITIAN</span>
            <span style={{ color: "#F59E0B" }}> REQUESTS</span>
          </h4>
        </div>
        <p style={{ color: "#999", marginBottom: 0, paddingLeft: "14px", fontSize: "13px" }}>Review and verify pending dietitian applications.</p>
      </div>

      <DietitianTable apiKey="dietitianRequests" showVerify={true} />
    </div>
  );
};

export default DietitianRequests;
