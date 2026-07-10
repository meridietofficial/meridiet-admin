import { useState, useEffect, useRef } from "react";
import { Table } from "react-bootstrap";
import { FaChevronDown, FaFilter } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { LuReceipt } from "react-icons/lu";
import GlobalPagination from "../common/GlobalPagination";
import couponService from "../../services/couponService";
import toast from "react-hot-toast";

const formatDate = (iso) => {
  if (!iso) return "N/A";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};

const formatDateTime = (iso) => {
  if (!iso) return "N/A";
  const d = new Date(iso);
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const TYPE_OPTIONS = [
  { key: "", label: "All Types", dot: "#6b7280" },
  { key: "diet_plan", label: "Diet Plan", dot: "#2563eb" },
  { key: "appointment", label: "Appointment", dot: "#9333ea" },
];

export default function CouponRedemptions() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [typeFilter, setTypeFilter] = useState("");
  const [couponFilter, setCouponFilter] = useState("");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCouponDropdown, setShowCouponDropdown] = useState(false);
  const [couponList, setCouponList] = useState([]);

  const typeRef = useRef(null);
  const couponRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (typeRef.current && !typeRef.current.contains(e.target)) setShowTypeDropdown(false);
      if (couponRef.current && !couponRef.current.contains(e.target)) setShowCouponDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    couponService.list(new URLSearchParams({ page: 1, limit: 100 }).toString())
      .then((res) => setCouponList(res?.data?.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchData(); }, [typeFilter, couponFilter, currentPage]);

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: currentPage, limit: 20 });
    if (typeFilter) params.append("applicable_type", typeFilter);
    if (couponFilter) params.append("coupon_id", couponFilter);
    couponService.allUsages(params.toString())
      .then((res) => {
        setData(res?.data?.data || []);
        const m = res?.data?.meta || {};
        setMeta({ page: m.page || 1, limit: m.limit || 20, total: m.total || 0, totalPages: m.totalPages || 1 });
      })
      .catch(() => toast.error("Failed to fetch redemptions."))
      .finally(() => setLoading(false));
  };

  const selectedCoupon = couponList.find((c) => String(c.id) === String(couponFilter));

  return (
    <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>

        {/* Type filter */}
        <div style={{ position: "relative" }} ref={typeRef}>
          <button onClick={() => setShowTypeDropdown(!showTypeDropdown)}
            style={{ height: "42px", border: `1px solid ${typeFilter ? "#9333ea" : "#e5e5e5"}`, borderRadius: "10px", padding: "0 14px", background: typeFilter ? "#fdf4ff" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", minWidth: "150px", fontWeight: 600, fontSize: "13px", color: typeFilter ? "#9333ea" : "#555" }}>
            <FaFilter style={{ fontSize: "12px", color: typeFilter ? "#9333ea" : "#aaa" }} />
            {TYPE_OPTIONS.find((o) => o.key === typeFilter)?.label || "All Types"}
            {typeFilter
              ? <MdClose style={{ marginLeft: "auto", fontSize: "14px", color: "#9333ea" }} onClick={(e) => { e.stopPropagation(); setTypeFilter(""); setCurrentPage(1); }} />
              : <FaChevronDown style={{ marginLeft: "auto", fontSize: "11px", color: "#aaa" }} />}
          </button>
          {showTypeDropdown && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#fff", border: "1px solid #edf1ee", borderRadius: "12px", minWidth: "170px", zIndex: 1000, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: "6px" }}>
              {TYPE_OPTIONS.map(({ key, label, dot }) => (
                <div key={key} onClick={() => { setTypeFilter(key); setShowTypeDropdown(false); setCurrentPage(1); }}
                  style={{ padding: "9px 14px", cursor: "pointer", borderRadius: "8px", fontSize: "13px", fontWeight: typeFilter === key ? 700 : 500, color: typeFilter === key ? "#9333ea" : "#444", background: typeFilter === key ? "#fdf4ff" : "transparent", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: dot, flexShrink: 0 }} />
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coupon filter */}
        <div style={{ position: "relative" }} ref={couponRef}>
          <button onClick={() => setShowCouponDropdown(!showCouponDropdown)}
            style={{ height: "42px", border: `1px solid ${couponFilter ? "#1E8E3E" : "#e5e5e5"}`, borderRadius: "10px", padding: "0 14px", background: couponFilter ? "#f0fdf4" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", minWidth: "170px", fontWeight: 600, fontSize: "13px", color: couponFilter ? "#1E8E3E" : "#555" }}>
            <LuReceipt style={{ fontSize: "14px", color: couponFilter ? "#1E8E3E" : "#aaa" }} />
            <span style={{ fontFamily: couponFilter ? "monospace" : "inherit", letterSpacing: couponFilter ? "1px" : 0 }}>
              {selectedCoupon ? selectedCoupon.code : "All Coupons"}
            </span>
            {couponFilter
              ? <MdClose style={{ marginLeft: "auto", fontSize: "14px", color: "#1E8E3E" }} onClick={(e) => { e.stopPropagation(); setCouponFilter(""); setCurrentPage(1); }} />
              : <FaChevronDown style={{ marginLeft: "auto", fontSize: "11px", color: "#aaa" }} />}
          </button>
          {showCouponDropdown && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#fff", border: "1px solid #edf1ee", borderRadius: "12px", minWidth: "200px", zIndex: 1000, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: "6px", maxHeight: "260px", overflowY: "auto" }}>
              <div onClick={() => { setCouponFilter(""); setShowCouponDropdown(false); setCurrentPage(1); }}
                style={{ padding: "9px 14px", cursor: "pointer", borderRadius: "8px", fontSize: "13px", fontWeight: !couponFilter ? 700 : 500, color: !couponFilter ? "#1E8E3E" : "#444", background: !couponFilter ? "#f0fdf4" : "transparent" }}>
                All Coupons
              </div>
              {couponList.map((c) => (
                <div key={c.id} onClick={() => { setCouponFilter(String(c.id)); setShowCouponDropdown(false); setCurrentPage(1); }}
                  style={{ padding: "9px 14px", cursor: "pointer", borderRadius: "8px", fontSize: "13px", fontWeight: String(couponFilter) === String(c.id) ? 700 : 500, color: String(couponFilter) === String(c.id) ? "#1E8E3E" : "#444", background: String(couponFilter) === String(c.id) ? "#f0fdf4" : "transparent", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 800, letterSpacing: "1px" }}>{c.code}</span>
                  <span style={{ fontSize: "11px", color: "#9ca3af", textTransform: "capitalize" }}>{c.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ background: "#f0fdf4", borderRadius: "10px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, color: "#1E8E3E" }}>
          {meta.total} redemption{meta.total !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div className="spinner-border" style={{ color: "#1E8E3E", width: "2.5rem", height: "2.5rem" }} role="status" />
          <p style={{ marginTop: "16px", color: "#999", fontSize: "14px", fontWeight: 500 }}>Loading redemptions...</p>
        </div>
      ) : data.length > 0 ? (
        <>
          <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #edf1ee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <Table className="table mb-0" style={{ borderCollapse: "collapse", minWidth: "900px" }}>
              <thead>
                <tr>
                  {["#", "Coupon", "User", "Type", "Amount", "Details", "Used At"].map((col) => (
                    <th key={col} style={{ background: "#1E8E3E", color: "#fff", fontWeight: 600, fontSize: "13px", padding: "14px 16px", whiteSpace: "nowrap", borderBottom: "2px solid #166C31", letterSpacing: "0.3px" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((u, i) => (
                  <tr key={u.id}
                    style={{ borderBottom: "1px solid #edf1ee", background: i % 2 === 0 ? "#fff" : "#fafcfa", transition: "background 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9f3")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafcfa")}>

                    <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 700, color: "#1E8E3E", verticalAlign: "middle" }}>
                      {(meta.page - 1) * meta.limit + i + 1}
                    </td>

                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "13px", color: "#111827", background: "#f8f9fa", padding: "4px 10px", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
                        {u.coupon_code}
                      </span>
                    </td>

                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#111827" }}>{u.user_name || `#${u.user_id}`}</p>
                      {u.user_email && <p style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>{u.user_email}</p>}
                      {u.user_phone && <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{u.user_phone}</p>}
                    </td>

                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      <span style={{
                        fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px",
                        background: u.applicable_type === "diet_plan" ? "#eff6ff" : "#fdf4ff",
                        color: u.applicable_type === "diet_plan" ? "#2563eb" : "#9333ea",
                      }}>
                        {u.applicable_type === "diet_plan" ? "Diet Plan" : "Appointment"}
                      </span>
                    </td>

                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af", textDecoration: "line-through" }}>₹{u.original_amount}</p>
                      <p style={{ margin: 0, fontSize: "12px", color: "#16a34a", fontWeight: 700 }}>-₹{u.discount_applied}</p>
                      <p style={{ margin: 0, fontSize: "13px", color: "#111827", fontWeight: 800 }}>₹{u.final_amount}</p>
                    </td>

                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      {u.applicable_type === "diet_plan" ? (
                        <>
                          {u.payment_plan && (
                            <span style={{ fontSize: "11px", fontWeight: 700, background: "#f0fdf4", color: "#15803d", padding: "2px 9px", borderRadius: "20px" }}>
                              {u.payment_plan.replace("_", " ")}
                            </span>
                          )}
                          {u.payment_order_id && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#9ca3af", fontFamily: "monospace" }}>{u.payment_order_id}</p>}
                        </>
                      ) : (
                        <>
                          {u.appointment_date && (
                            <p style={{ margin: 0, fontSize: "12px", color: "#374151", fontWeight: 600 }}>
                              {formatDate(u.appointment_date)}{u.appointment_slot ? `, ${u.appointment_slot}` : ""}
                            </p>
                          )}
                          {u.dietitian_name && <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#6b7280" }}>{u.dietitian_name}</p>}
                        </>
                      )}
                    </td>

                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "#888", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                      {formatDateTime(u.used_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px", fontSize: "13px", color: "#888", marginTop: "4px" }}>
            <span>Showing <strong style={{ color: "#111827" }}>{data.length}</strong> of <strong style={{ color: "#111827" }}>{meta.total}</strong> redemptions</span>
            <span style={{ background: "#f0f9f3", padding: "4px 14px", borderRadius: "20px", fontWeight: 500, color: "#1E8E3E" }}>Page {meta.page} of {meta.totalPages}</span>
          </div>
          {meta.totalPages > 1 && <GlobalPagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setCurrentPage} />}
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 20px", borderRadius: "12px", border: "1px solid #edf1ee" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
          <h5 style={{ fontWeight: 700, color: "#333", marginBottom: "8px" }}>No Redemptions Found</h5>
          <p style={{ fontSize: "14px", color: "#999" }}>
            {typeFilter || couponFilter ? "No redemptions match the selected filters." : "No coupons have been redeemed yet."}
          </p>
        </div>
      )}
    </div>
  );
}
