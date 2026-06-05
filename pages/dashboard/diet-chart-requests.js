import DietRequestTable from "../../src/components/diet-requests/DietRequestTable";

const DietChartRequests = () => {
  return (
    <div style={{ padding: "4px 0" }}>
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
          <div style={{ width: "4px", height: "20px", background: "linear-gradient(180deg, #1E8E3E, #4ade80)", borderRadius: "4px" }} />
          <h4 className="fw700 mb-0" style={{ fontSize: "1.15rem" }}>
            <span style={{ color: "#111827" }}>DIET CHART</span>
            <span style={{ color: "#1E8E3E" }}> REQUESTS</span>
          </h4>
        </div>
        <p style={{ color: "#999", marginBottom: 0, paddingLeft: "14px", fontSize: "13px" }}>Review diet chart requests and the details users submitted.</p>
      </div>

      <DietRequestTable />
    </div>
  );
};

export default DietChartRequests;
