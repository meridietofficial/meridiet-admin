import { LuReceipt } from "react-icons/lu";
import { HiOutlineTag } from "react-icons/hi";
import CouponRedemptionsTable from "../../components/coupons/CouponRedemptions";

const CouponRedemptions = () => {
  return (
    <div style={{ padding: "4px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div style={{ width: "4px", height: "28px", background: "linear-gradient(180deg, #1E8E3E, #4ade80)", borderRadius: "4px" }} />
            <h2 className="fw700 mb-0">
              <span style={{ color: "#111827" }}>COUPON</span>
              <span style={{ color: "#1E8E3E" }}> REDEMPTIONS</span>
            </h2>
          </div>
          <p style={{ color: "#999", marginBottom: 0, paddingLeft: "14px" }}>All coupon usages across diet plans and appointments.</p>
        </div>
      </div>
      <CouponRedemptionsTable />
    </div>
  );
};

export default CouponRedemptions;
