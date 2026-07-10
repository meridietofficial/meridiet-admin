import { useState, useEffect, useRef } from "react";
import { Table, Modal, Button, Form } from "react-bootstrap";
import { FaChevronDown, FaFilter, FaPlus, FaEye, FaEdit, FaPercent, FaRupeeSign, FaCalendarAlt, FaInfinity, FaUserAlt } from "react-icons/fa";
import { MdBlock, MdCheckCircle, MdClose, MdLocalOffer, MdStar } from "react-icons/md";
import { LuTicket, LuCalendarClock, LuShoppingBag, LuStethoscope, LuLayoutGrid } from "react-icons/lu";
import GlobalPagination from "../common/GlobalPagination";
import couponService from "../../services/couponService";
import toast from "react-hot-toast";

const getTodayMin = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 16);
};

const blockNegativeKeys = (e) => {
  if (["-", "e", "E", "+"].includes(e.key)) e.preventDefault();
};

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

const TYPE_FILTER_OPTIONS = [
  { key: "", label: "All Types", dot: "#6b7280" },
  { key: "discount", label: "Discount", dot: "#6366f1" },
  { key: "promotional", label: "Promotional", dot: "#f59e0b" },
];

const PLAN_OPTIONS = ["1_week", "1_month", "3_months"];
const PLAN_LABELS = { "1_week": "1 Week", "1_month": "1 Month", "3_months": "3 Months" };

const EMPTY_FORM = {
  code: "", type: "discount", discount_type: "percentage", discount_value: "",
  max_discount_amount: "", min_order_amount: "", applicable_on: "both",
  applicable_plans: [], max_uses: "", max_uses_per_user: 1,
  valid_from: "", valid_until: "", is_active: true,
  influencer_name: "", influencer_phone: "", campaign_name: "", description: "",
};

// ── Small reusable pieces ──────────────────────────────────────────────────
function BadgeType({ type }) {
  const isPromo = type === "promotional";
  return (
    <span style={{ background: isPromo ? "#fffbeb" : "#f5f3ff", color: isPromo ? "#d97706" : "#6366f1", border: `1px solid ${isPromo ? "#fde68a" : "#c4b5fd"}`, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, textTransform: "capitalize" }}>
      {type}
    </span>
  );
}
function BadgeDiscount({ discount_type, discount_value }) {
  return (
    <span style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>
      {discount_type === "percentage" ? `${discount_value}%` : `₹${discount_value}`}
    </span>
  );
}
function BadgeStatus({ is_active, is_expired }) {
  if (is_expired) return <span style={{ background: "#fee2e2", color: "#ef4444", borderRadius: "20px", padding: "4px 10px", fontSize: "11px", fontWeight: 700 }}>Expired</span>;
  return (
    <span style={{ background: is_active ? "#dcfce7" : "#f3f4f6", color: is_active ? "#16a34a" : "#6b7280", borderRadius: "20px", padding: "4px 10px", fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: is_active ? "#16a34a" : "#9ca3af" }} />
      {is_active ? "Active" : "Inactive"}
    </span>
  );
}
function ActionBtn({ title, bg, onClick, children }) {
  return (
    <div onClick={onClick} title={title}
      style={{ width: "32px", height: "32px", borderRadius: "8px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {children}
    </div>
  );
}

// ── Live Coupon Preview Card ───────────────────────────────────────────────
function CouponPreviewCard({ formData }) {
  const isPromo = formData.type === "promotional";
  const code = formData.code || "COUPON";
  const discountLabel = formData.discount_value
    ? (formData.discount_type === "percentage" ? `${formData.discount_value}% OFF` : `₹${formData.discount_value} OFF`)
    : "— OFF";

  return (
    <div style={{
      background: isPromo
        ? "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
        : "linear-gradient(135deg, #1E8E3E 0%, #166C31 50%, #0f4d24 100%)",
      borderRadius: "20px",
      padding: "24px 28px",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
      position: "relative",
      overflow: "hidden",
      marginBottom: "4px",
      boxShadow: isPromo ? "0 8px 32px rgba(245,158,11,0.35)" : "0 8px 32px rgba(30,142,62,0.35)",
    }}>
      {/* Decorative circles */}
      <div style={{ position: "absolute", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", top: "-60px", right: "160px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", bottom: "-40px", right: "60px", pointerEvents: "none" }} />

      {/* Left: Ticket icon + code */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: 0 }}>
        <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backdropFilter: "blur(4px)" }}>
          {isPromo ? <MdStar size={26} color="#fff" /> : <LuTicket size={26} color="#fff" />}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, opacity: 0.75, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "2px" }}>
            {isPromo ? "Promo Code" : "Discount Code"}
          </p>
          <p style={{ margin: 0, fontSize: "22px", fontWeight: 900, fontFamily: "monospace", letterSpacing: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {code}
          </p>
          {formData.min_order_amount && (
            <p style={{ margin: 0, fontSize: "11px", opacity: 0.7, marginTop: "2px" }}>
              Min. order ₹{formData.min_order_amount}
            </p>
          )}
        </div>
      </div>

      {/* Dashed divider */}
      <div style={{ width: "1px", alignSelf: "stretch", borderLeft: "2px dashed rgba(255,255,255,0.3)", flexShrink: 0, margin: "0 4px" }} />

      {/* Right: Discount */}
      <div style={{ textAlign: "center", flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: "30px", fontWeight: 900, lineHeight: 1, letterSpacing: "-1px" }}>{discountLabel}</p>
        {formData.max_discount_amount && (
          <p style={{ margin: 0, fontSize: "10px", opacity: 0.7, marginTop: "4px" }}>Max ₹{formData.max_discount_amount} off</p>
        )}
        <p style={{ margin: 0, fontSize: "10px", opacity: 0.65, marginTop: "6px", textTransform: "capitalize" }}>
          {formData.applicable_on === "both" ? "Diet Plan + Appointment" : formData.applicable_on?.replace("_", " ")}
        </p>
        {formData.valid_until && (
          <p style={{ margin: 0, fontSize: "10px", opacity: 0.6, marginTop: "2px" }}>
            Valid till {new Date(formData.valid_until).toLocaleDateString("en-IN")}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Form section wrapper ───────────────────────────────────────────────────
function Section({ title, icon, children }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
        <span style={{ fontSize: "16px" }}>{icon}</span>
        <span style={{ fontWeight: 800, fontSize: "12px", color: "#374151", textTransform: "uppercase", letterSpacing: "0.8px" }}>{title}</span>
        <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, #e5e7eb, transparent)", marginLeft: "4px" }} />
      </div>
      {children}
    </div>
  );
}

// ── Styled field label ─────────────────────────────────────────────────────
function FieldLabel({ label, required, hint }) {
  return (
    <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>
      {label}{required && <span style={{ color: "#ef4444", marginLeft: "3px" }}>*</span>}
      {hint && <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0, color: "#9ca3af", marginLeft: "6px" }}>({hint})</span>}
    </label>
  );
}

// ── Input with optional left icon ──────────────────────────────────────────
function IconInput({ icon, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      {icon && (
        <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: focused ? "#1E8E3E" : "#9ca3af", fontSize: "13px", pointerEvents: "none", transition: "color 0.2s" }}>
          {icon}
        </div>
      )}
      <input
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={{
          height: "42px", borderRadius: "10px", width: "100%", fontSize: "13px",
          padding: icon ? "0 12px 0 36px" : "0 12px",
          border: `1.5px solid ${focused ? "#1E8E3E" : "#e5e7eb"}`,
          outline: "none", background: "#fff", transition: "border-color 0.2s",
          boxShadow: focused ? "0 0 0 3px rgba(30,142,62,0.1)" : "none",
          color: "#111827",
          ...props.style,
        }}
      />
    </div>
  );
}

// ── Styled textarea ────────────────────────────────────────────────────────
function StyledTextarea(props) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      style={{
        borderRadius: "10px", width: "100%", fontSize: "13px", padding: "10px 12px",
        border: `1.5px solid ${focused ? "#1E8E3E" : "#e5e7eb"}`,
        outline: "none", background: "#fff", transition: "border-color 0.2s", resize: "vertical",
        boxShadow: focused ? "0 0 0 3px rgba(30,142,62,0.1)" : "none",
        color: "#111827",
        ...props.style,
      }}
    />
  );
}

// ── Type Selector Card ─────────────────────────────────────────────────────
function TypeCard({ value, current, onChange, icon, title, desc, accent }) {
  const active = current === value;
  return (
    <div onClick={() => onChange(value)} style={{
      flex: 1, padding: "16px", borderRadius: "14px", cursor: "pointer", transition: "all 0.2s",
      border: `2px solid ${active ? accent : "#e5e7eb"}`,
      background: active ? `${accent}0d` : "#fff",
      boxShadow: active ? `0 4px 16px ${accent}22` : "0 1px 4px rgba(0,0,0,0.04)",
      display: "flex", flexDirection: "column", gap: "8px",
    }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: active ? `${accent}18` : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
        <span style={{ fontSize: "20px" }}>{icon}</span>
      </div>
      <div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: active ? accent : "#374151" }}>{title}</p>
        <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af", marginTop: "2px", lineHeight: 1.4 }}>{desc}</p>
      </div>
      <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: `2px solid ${active ? accent : "#d1d5db"}`, background: active ? accent : "#fff", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", marginTop: "2px" }}>
        {active && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff" }} />}
      </div>
    </div>
  );
}

// ── Discount Type Selector ────────────────────────────────────────────────
function DiscountTypeSelector({ value, onChange }) {
  const options = [
    {
      value: "percentage",
      symbol: "%",
      label: "Percentage",
      example: "e.g. 20% off the order",
      symbolBg: "#f0fdf4",
      symbolColor: "#16a34a",
      activeBorder: "#16a34a",
      activeBg: "#f0fdf4",
      activeShadow: "0 4px 14px rgba(22,163,74,0.18)",
    },
    {
      value: "flat",
      symbol: "₹",
      label: "Flat Amount",
      example: "e.g. ₹100 off the order",
      symbolBg: "#eff6ff",
      symbolColor: "#2563eb",
      activeBorder: "#2563eb",
      activeBg: "#eff6ff",
      activeShadow: "0 4px 14px rgba(37,99,235,0.18)",
    },
  ];

  return (
    <div style={{ display: "flex", gap: "10px" }}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <div key={opt.value} onClick={() => onChange(opt.value)} style={{
            flex: 1, display: "flex", alignItems: "center", gap: "12px",
            padding: "12px 14px", borderRadius: "12px", cursor: "pointer",
            border: `2px solid ${active ? opt.activeBorder : "#e5e7eb"}`,
            background: active ? opt.activeBg : "#fff",
            boxShadow: active ? opt.activeShadow : "0 1px 3px rgba(0,0,0,0.05)",
            transition: "all 0.2s",
          }}>
            {/* Symbol circle */}
            <div style={{
              width: "42px", height: "42px", borderRadius: "50%", flexShrink: 0,
              background: active ? opt.symbolBg : "#f3f4f6",
              border: `2px solid ${active ? opt.activeBorder + "44" : "#e5e7eb"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}>
              <span style={{
                fontSize: "18px", fontWeight: 900,
                color: active ? opt.symbolColor : "#9ca3af",
                lineHeight: 1,
              }}>{opt.symbol}</span>
            </div>
            {/* Text */}
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: active ? opt.symbolColor : "#374151", transition: "color 0.2s" }}>
                {opt.label}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: active ? opt.symbolColor + "aa" : "#9ca3af", marginTop: "1px" }}>
                {opt.example}
              </p>
            </div>
            {/* Radio dot */}
            <div style={{ marginLeft: "auto", width: "18px", height: "18px", borderRadius: "50%", border: `2px solid ${active ? opt.activeBorder : "#d1d5db"}`, background: active ? opt.activeBorder : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
              {active && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff" }} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Applicable On cards ───────────────────────────────────────────────────
function ApplicableCard({ value, current, onChange, icon, label }) {
  const active = current === value;
  return (
    <div onClick={() => onChange(value)} style={{
      flex: 1, padding: "12px 10px", borderRadius: "12px", cursor: "pointer", transition: "all 0.18s",
      border: `2px solid ${active ? "#1E8E3E" : "#e5e7eb"}`,
      background: active ? "#f0fdf4" : "#fff",
      display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", textAlign: "center",
      boxShadow: active ? "0 3px 12px rgba(30,142,62,0.15)" : "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <span style={{ fontSize: "22px" }}>{icon}</span>
      <span style={{ fontSize: "11px", fontWeight: 700, color: active ? "#1E8E3E" : "#6b7280", lineHeight: 1.3 }}>{label}</span>
    </div>
  );
}

// ── Status Toggle ─────────────────────────────────────────────────────────
function StatusToggle({ value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div onClick={() => onChange(!value)} style={{
        width: "52px", height: "28px", borderRadius: "14px", cursor: "pointer", transition: "all 0.25s",
        background: value ? "#1E8E3E" : "#d1d5db", position: "relative", flexShrink: 0,
        boxShadow: value ? "0 2px 8px rgba(30,142,62,0.4)" : "none",
      }}>
        <div style={{
          width: "22px", height: "22px", borderRadius: "50%", background: "#fff", position: "absolute",
          top: "3px", left: value ? "27px" : "3px", transition: "left 0.25s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }} />
      </div>
      <div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: value ? "#1E8E3E" : "#6b7280" }}>
          {value ? "Active" : "Inactive"}
        </p>
        <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>
          {value ? "Coupon is live and can be used" : "Coupon is disabled"}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
export default function CouponTable({ onStatsChange }) {
  const [coupons, setCoupons] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const typeRef = useRef(null);

  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [showDetail, setShowDetail] = useState(false);
  const [detailCoupon, setDetailCoupon] = useState(null);

  const [showUsages, setShowUsages] = useState(false);
  const [usagesData, setUsagesData] = useState([]);
  const [usagesMeta, setUsagesMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [usagesPage, setUsagesPage] = useState(1);
  const [loadingUsages, setLoadingUsages] = useState(false);
  const [usagesCoupon, setUsagesCoupon] = useState(null);

  const [showDeactivate, setShowDeactivate] = useState(false);
  const [deactivateCoupon, setDeactivateCoupon] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (typeRef.current && !typeRef.current.contains(e.target)) setShowTypeDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { fetchCoupons(); }, [typeFilter, currentPage]);

  const buildParams = (overrides = {}) => {
    const p = new URLSearchParams();
    p.append("page", overrides.page ?? currentPage);
    p.append("limit", overrides.limit ?? pagination.limit);
    const tp = overrides.type !== undefined ? overrides.type : typeFilter;
    if (tp) p.append("type", tp);
    return p.toString();
  };

  const fetchCoupons = () => {
    setLoading(true);
    couponService.list(buildParams())
      .then((res) => {
        const data = res?.data?.data || [];
        setCoupons(data);
        const meta = res?.data?.meta || {};
        setPagination({ page: meta.page || 1, limit: meta.limit || 20, total: meta.total || 0, totalPages: meta.totalPages || 1 });
        if (onStatsChange) {
          const active = data.filter((c) => c.is_active && !c.is_expired).length;
          onStatsChange({ total: meta.total || 0, active });
        }
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to fetch coupons."))
      .finally(() => setLoading(false));
  };

  const openCreate = () => { setEditingCoupon(null); setFormData(EMPTY_FORM); setShowForm(true); };

  const openEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || "", type: coupon.type || "discount",
      discount_type: coupon.discount_type || "percentage", discount_value: coupon.discount_value ?? "",
      max_discount_amount: coupon.max_discount_amount ?? "", min_order_amount: coupon.min_order_amount ?? "",
      applicable_on: coupon.applicable_on || "both",
      applicable_plans: coupon.applicable_plans ? coupon.applicable_plans.split(",").map((s) => s.trim()) : [],
      max_uses: coupon.max_uses ?? "", max_uses_per_user: coupon.max_uses_per_user ?? 1,
      valid_from: coupon.valid_from ? coupon.valid_from.slice(0, 16) : "",
      valid_until: coupon.valid_until ? coupon.valid_until.slice(0, 16) : "",
      is_active: !!coupon.is_active, influencer_name: coupon.influencer_name || "",
      influencer_phone: coupon.influencer_phone || "", campaign_name: coupon.campaign_name || "",
      description: coupon.description || "",
    });
    setShowForm(true);
  };

  const setField = (key, val) => setFormData((p) => ({ ...p, [key]: val }));

  const togglePlan = (plan) => {
    setFormData((p) => ({
      ...p,
      applicable_plans: p.applicable_plans.includes(plan)
        ? p.applicable_plans.filter((x) => x !== plan)
        : [...p.applicable_plans, plan],
    }));
  };

  const buildPayload = () => {
    const d = { ...formData };
    d.discount_value = d.discount_value === "" ? undefined : Number(d.discount_value);
    d.max_discount_amount = d.max_discount_amount === "" ? null : Number(d.max_discount_amount);
    d.min_order_amount = d.min_order_amount === "" ? null : Number(d.min_order_amount);
    d.max_uses = d.max_uses === "" ? null : Number(d.max_uses);
    d.max_uses_per_user = d.max_uses_per_user === "" ? 1 : Number(d.max_uses_per_user);
    d.applicable_plans = d.applicable_plans.length ? d.applicable_plans.join(",") : null;
    d.valid_from = d.valid_from || null;
    d.valid_until = d.valid_until || null;
    if (d.type !== "promotional") { delete d.influencer_name; delete d.influencer_phone; delete d.campaign_name; }
    return d;
  };

  const handleSave = () => {
    if (!formData.code.trim()) { toast.error("Coupon code is required."); return; }
    if (!formData.discount_value) { toast.error("Discount value is required."); return; }
    if (formData.type === "promotional" && !formData.influencer_name.trim()) {
      toast.error("Influencer name is required for promotional coupons."); return;
    }
    setSaving(true);
    const payload = buildPayload();
    const call = editingCoupon ? couponService.update(editingCoupon.id, payload) : couponService.create(payload);
    call
      .then(() => { toast.success(editingCoupon ? "Coupon updated!" : "Coupon created!"); setShowForm(false); fetchCoupons(); })
      .catch((err) => toast.error(err?.response?.data?.message || "Operation failed."))
      .finally(() => setSaving(false));
  };

  const handleDeactivate = () => {
    if (!deactivateCoupon) return;
    setDeactivating(true);
    couponService.deactivate(deactivateCoupon.id)
      .then(() => { toast.success("Coupon deactivated."); setShowDeactivate(false); setDeactivateCoupon(null); fetchCoupons(); })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed."))
      .finally(() => setDeactivating(false));
  };

  const openUsages = (coupon) => { setUsagesCoupon(coupon); setUsagesPage(1); setShowUsages(true); fetchUsages(coupon.id, 1); };

  const fetchUsages = (couponId, page) => {
    setLoadingUsages(true);
    couponService.usages(couponId, new URLSearchParams({ page, limit: 20 }).toString())
      .then((res) => {
        setUsagesData(res?.data?.data || []);
        const meta = res?.data?.meta || {};
        setUsagesMeta({ page: meta.page || 1, limit: meta.limit || 20, total: meta.total || 0, totalPages: meta.totalPages || 1 });
      })
      .catch(() => toast.error("Failed to fetch usages."))
      .finally(() => setLoadingUsages(false));
  };

  const handleUsagesPageChange = (page) => { setUsagesPage(page); fetchUsages(usagesCoupon.id, page); };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }} ref={typeRef}>
            <button onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              style={{ height: "42px", border: `1px solid ${typeFilter ? "#f59e0b" : "#e5e5e5"}`, borderRadius: "10px", padding: "0 14px", background: typeFilter ? "#fffbeb" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", minWidth: "140px", fontWeight: 600, fontSize: "13px", color: typeFilter ? "#d97706" : "#555" }}>
              <FaFilter style={{ fontSize: "12px", color: typeFilter ? "#d97706" : "#aaa" }} />
              {TYPE_FILTER_OPTIONS.find((o) => o.key === typeFilter)?.label || "All Types"}
              {typeFilter
                ? <MdClose style={{ marginLeft: "auto", fontSize: "14px", color: "#d97706" }} onClick={(e) => { e.stopPropagation(); setTypeFilter(""); setCurrentPage(1); }} />
                : <FaChevronDown style={{ marginLeft: "auto", fontSize: "11px", color: "#aaa" }} />}
            </button>
            {showTypeDropdown && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#fff", border: "1px solid #edf1ee", borderRadius: "12px", minWidth: "160px", zIndex: 1000, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: "6px" }}>
                {TYPE_FILTER_OPTIONS.map(({ key, label, dot }) => (
                  <div key={key} onClick={() => { setTypeFilter(key); setShowTypeDropdown(false); setCurrentPage(1); }}
                    style={{ padding: "9px 14px", cursor: "pointer", borderRadius: "8px", fontSize: "13px", fontWeight: typeFilter === key ? 700 : 500, color: typeFilter === key ? "#d97706" : "#444", background: typeFilter === key ? "#fffbeb" : "transparent", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: dot, flexShrink: 0 }} />
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={openCreate}
            style={{ height: "42px", border: "none", borderRadius: "10px", padding: "0 18px", background: "#1E8E3E", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "13px", color: "#fff", whiteSpace: "nowrap" }}>
            <FaPlus style={{ fontSize: "13px" }} /> New Coupon
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div className="spinner-border" style={{ color: "#1E8E3E", width: "2.5rem", height: "2.5rem" }} role="status" />
            <p style={{ marginTop: "16px", color: "#999", fontSize: "14px", fontWeight: 500 }}>Loading coupons...</p>
          </div>
        ) : coupons.length > 0 ? (
          <>
            <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #edf1ee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <Table className="table mb-0" style={{ borderCollapse: "collapse", minWidth: "900px" }}>
                <thead>
                  <tr>
                    {["S.No", "Code", "Type", "Discount", "Applicable On", "Uses", "Valid From", "Valid Until", "Status", "Actions"].map((col) => (
                      <th key={col} style={{ background: "#1E8E3E", color: "#fff", fontWeight: 600, fontSize: "13px", padding: "14px 16px", whiteSpace: "nowrap", borderBottom: "2px solid #166C31", letterSpacing: "0.3px" }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c, i) => (
                    <tr key={c.id}
                      style={{ borderBottom: "1px solid #edf1ee", background: i % 2 === 0 ? "#fff" : "#fafcfa", transition: "background 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9f3")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafcfa")}>
                      <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 700, color: "#1E8E3E", verticalAlign: "middle" }}>
                        {(pagination.page - 1) * pagination.limit + i + 1}
                      </td>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "13px", color: "#111827", background: "#f8f9fa", padding: "4px 10px", borderRadius: "6px", border: "1px solid #e5e7eb" }}>{c.code}</span>
                      </td>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}><BadgeType type={c.type} /></td>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        <BadgeDiscount discount_type={c.discount_type} discount_value={c.discount_value} />
                        {c.max_discount_amount && <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "3px" }}>Max ₹{c.max_discount_amount}</div>}
                      </td>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle", fontSize: "12px", color: "#374151" }}>
                        <span style={{ textTransform: "capitalize" }}>{c.applicable_on?.replace("_", " ")}</span>
                        {c.applicable_plans && <div style={{ fontSize: "11px", color: "#9ca3af" }}>{c.applicable_plans}</div>}
                      </td>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle", fontSize: "13px", color: "#374151" }}>
                        {c.total_uses ?? 0}{c.max_uses && <span style={{ color: "#9ca3af" }}> / {c.max_uses}</span>}
                      </td>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle", fontSize: "12px", color: "#555", whiteSpace: "nowrap" }}>
                        {c.valid_from ? formatDate(c.valid_from) : <span style={{ color: "#9ca3af" }}>Immediately</span>}
                      </td>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle", fontSize: "12px", color: "#555", whiteSpace: "nowrap" }}>
                        {c.valid_until ? formatDate(c.valid_until) : <span style={{ color: "#9ca3af" }}>Never</span>}
                      </td>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}><BadgeStatus is_active={c.is_active} is_expired={c.is_expired} /></td>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <ActionBtn title="View Details" bg="#EFF6FF" onClick={() => { setDetailCoupon(c); setShowDetail(true); }}>
                            <FaEye style={{ color: "#3b82f6", fontSize: "14px" }} />
                          </ActionBtn>
                          <ActionBtn title="Edit Coupon" bg="#f0f9f3" onClick={() => openEdit(c)}>
                            <FaEdit style={{ color: "#1E8E3E", fontSize: "14px" }} />
                          </ActionBtn>
                          <ActionBtn title="View Usages" bg="#fdf4ff" onClick={() => openUsages(c)}>
                            <LuTicket style={{ color: "#9333ea", fontSize: "14px" }} />
                          </ActionBtn>
                          {c.is_active && !c.is_expired && (
                            <ActionBtn title="Deactivate" bg="#fef2f2" onClick={() => { setDeactivateCoupon(c); setShowDeactivate(true); }}>
                              <MdBlock style={{ color: "#ef4444", fontSize: "16px" }} />
                            </ActionBtn>
                          )}
                          {!c.is_active && (
                            <ActionBtn title="Re-activate via Edit" bg="#dcfce7" onClick={() => openEdit(c)}>
                              <MdCheckCircle style={{ color: "#16a34a", fontSize: "16px" }} />
                            </ActionBtn>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px", fontSize: "13px", color: "#888", marginTop: "4px" }}>
              <span>Showing <strong style={{ color: "#111827" }}>{coupons.length}</strong> of <strong style={{ color: "#111827" }}>{pagination.total}</strong> coupons</span>
              <span style={{ background: "#f0f9f3", padding: "4px 14px", borderRadius: "20px", fontWeight: 500, color: "#1E8E3E" }}>Page {pagination.page} of {pagination.totalPages}</span>
            </div>
            {pagination.totalPages > 1 && <GlobalPagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setCurrentPage} />}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", borderRadius: "12px", border: "1px solid #edf1ee" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎟️</div>
            <h5 style={{ fontWeight: 700, color: "#333", marginBottom: "8px" }}>No Coupons Found</h5>
            <p style={{ fontSize: "14px", color: "#999" }}>{typeFilter ? `No ${typeFilter} coupons found.` : "No coupons have been created yet."}</p>
            <button onClick={openCreate} style={{ marginTop: "8px", padding: "10px 20px", background: "#1E8E3E", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
              Create First Coupon
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          CREATE / EDIT MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal show={showForm} onHide={() => !saving && setShowForm(false)} size="xl" centered scrollable>
        {/* Header */}
        <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #1E8E3E 0%, #0f5c26 100%)", color: "#fff", borderBottom: "none", padding: "1.2rem 1.8rem" }}>
          <Modal.Title style={{ fontWeight: 800, fontSize: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LuTicket size={18} color="#fff" />
            </div>
            {editingCoupon ? `Edit Coupon · ${editingCoupon.code}` : "Create New Coupon"}
            {!editingCoupon && (
              <span style={{ background: "rgba(255,255,255,0.18)", fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "20px", letterSpacing: "0.5px" }}>NEW</span>
            )}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ background: "#f0f4f8", padding: 0 }}>
          <div style={{ padding: "20px 24px 0" }}>
            {/* Live Preview */}
            <CouponPreviewCard formData={formData} />
          </div>

          <div style={{ padding: "20px 24px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 28px" }}>

            {/* ── SECTION: Coupon Type ── */}
            <div style={{ gridColumn: "1 / -1" }}>
              <Section title="Coupon Type" icon="🏷️">
                <div style={{ display: "flex", gap: "14px" }}>
                  <TypeCard value="discount" current={formData.type} onChange={(v) => setField("type", v)}
                    icon="💸" title="Discount Coupon" desc="General discount for all users" accent="#6366f1" />
                  <TypeCard value="promotional" current={formData.type} onChange={(v) => setField("type", v)}
                    icon="🌟" title="Promotional Coupon" desc="Influencer / campaign-specific code" accent="#f59e0b" />
                </div>
              </Section>
            </div>

            {/* ── SECTION: Discount Details ── */}
            <div style={{ gridColumn: "1 / -1" }}>
              <Section title="Discount Details" icon="💰">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
                  <div>
                    <FieldLabel label="Coupon Code" required />
                    <IconInput icon={<MdLocalOffer />} placeholder="e.g. SAVE20" value={formData.code}
                      onChange={(e) => setField("code", e.target.value.toUpperCase())}
                      style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "15px", letterSpacing: "2px" }} />
                    <p style={{ margin: "4px 0 0 2px", fontSize: "10.5px", color: "#9ca3af" }}>Auto-uppercased · letters, numbers, -, _</p>
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <FieldLabel label="Discount Type" required />
                    <DiscountTypeSelector value={formData.discount_type} onChange={(v) => setField("discount_type", v)} />
                  </div>

                  <div>
                    <FieldLabel label="Discount Value" required />
                    <IconInput
                      icon={formData.discount_type === "percentage" ? <FaPercent /> : <FaRupeeSign />}
                      type="number" placeholder={formData.discount_type === "percentage" ? "e.g. 20" : "e.g. 100"}
                      min="1" max={formData.discount_type === "percentage" ? 100 : undefined}
                      onKeyDown={blockNegativeKeys}
                      value={formData.discount_value}
                      onChange={(e) => { const v = e.target.value; if (v === "" || Number(v) > 0) setField("discount_value", v); }} />
                  </div>

                  {formData.discount_type === "percentage" && (
                    <div>
                      <FieldLabel label="Max Discount Cap" hint="₹ — optional" />
                      <IconInput icon={<FaRupeeSign />} type="number" placeholder="e.g. 500 (leave blank = no cap)"
                        min="1" onKeyDown={blockNegativeKeys}
                        value={formData.max_discount_amount}
                        onChange={(e) => { const v = e.target.value; if (v === "" || Number(v) > 0) setField("max_discount_amount", v); }} />
                    </div>
                  )}

                  <div>
                    <FieldLabel label="Min Order Amount" hint="₹ — optional" />
                    <IconInput icon={<FaRupeeSign />} type="number" placeholder="e.g. 299 (leave blank = no min)"
                      min="1" onKeyDown={blockNegativeKeys}
                      value={formData.min_order_amount}
                      onChange={(e) => { const v = e.target.value; if (v === "" || Number(v) > 0) setField("min_order_amount", v); }} />
                  </div>
                </div>
              </Section>
            </div>

            {/* ── SECTION: Applicable On ── */}
            <div style={{ gridColumn: "1 / -1" }}>
              <Section title="Applicable On" icon="🎯">
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "20px", alignItems: "start" }}>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <ApplicableCard value="diet_plan" current={formData.applicable_on} onChange={(v) => setField("applicable_on", v)} icon={<LuShoppingBag size={22} />} label={"Diet\nPlan"} />
                    <ApplicableCard value="appointment" current={formData.applicable_on} onChange={(v) => setField("applicable_on", v)} icon={<LuStethoscope size={22} />} label={"Appointment"} />
                    <ApplicableCard value="both" current={formData.applicable_on} onChange={(v) => setField("applicable_on", v)} icon={<LuLayoutGrid size={22} />} label={"Both"} />
                  </div>
                  <div>
                    <FieldLabel label="Restrict to Specific Plans" hint="leave unselected = all plans" />
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {PLAN_OPTIONS.map((plan) => {
                        const checked = formData.applicable_plans.includes(plan);
                        return (
                          <div key={plan} onClick={() => togglePlan(plan)} style={{
                            padding: "7px 16px", borderRadius: "20px", cursor: "pointer", transition: "all 0.15s",
                            border: `2px solid ${checked ? "#1E8E3E" : "#e5e7eb"}`,
                            background: checked ? "#f0fdf4" : "#fff",
                            color: checked ? "#1E8E3E" : "#6b7280",
                            fontSize: "12px", fontWeight: 700,
                            boxShadow: checked ? "0 2px 8px rgba(30,142,62,0.15)" : "none",
                            display: "flex", alignItems: "center", gap: "6px",
                          }}>
                            {checked && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1E8E3E", flexShrink: 0 }} />}
                            {PLAN_LABELS[plan]}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Section>
            </div>

            {/* ── SECTION: Validity & Limits ── */}
            <div style={{ gridColumn: "1 / -1" }}>
              <Section title="Validity & Limits" icon="📅">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "14px" }}>
                  <div>
                    <FieldLabel label="Valid From" hint="leave blank = now" />
                    <IconInput icon={<FaCalendarAlt />} type="datetime-local" value={formData.valid_from}
                      min={getTodayMin()}
                      onChange={(e) => setField("valid_from", e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel label="Valid Until" hint="leave blank = never" />
                    <IconInput icon={<LuCalendarClock />} type="datetime-local" value={formData.valid_until}
                      min={formData.valid_from || getTodayMin()}
                      onChange={(e) => setField("valid_until", e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel label="Total Uses" hint="optional" />
                    <IconInput icon={<FaInfinity />} type="number" placeholder="Leave blank = unlimited"
                      min="1" value={formData.max_uses} onChange={(e) => setField("max_uses", e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel label="Uses Per User" />
                    <IconInput icon={<FaUserAlt />} type="number" min="1" value={formData.max_uses_per_user}
                      onChange={(e) => setField("max_uses_per_user", e.target.value)} />
                  </div>
                </div>
              </Section>
            </div>

            {/* ── SECTION: Influencer (conditional) ── */}
            {formData.type === "promotional" && (
              <div style={{ gridColumn: "1 / -1" }}>
                <Section title="Influencer Details" icon="🌟">
                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
                      <div>
                        <FieldLabel label="Influencer Name" required />
                        <IconInput icon="👤" placeholder="e.g. Shubham Sharma" value={formData.influencer_name}
                          onChange={(e) => setField("influencer_name", e.target.value)} />
                      </div>
                      <div>
                        <FieldLabel label="Influencer Phone" hint="optional" />
                        <IconInput icon="📱" placeholder="+919876543210" value={formData.influencer_phone}
                          onChange={(e) => setField("influencer_phone", e.target.value)} />
                      </div>
                      <div>
                        <FieldLabel label="Campaign Name" hint="optional" />
                        <IconInput icon="📢" placeholder="e.g. YouTube June 2026" value={formData.campaign_name}
                          onChange={(e) => setField("campaign_name", e.target.value)} />
                      </div>
                    </div>
                  </div>
                </Section>
              </div>
            )}

            {/* ── SECTION: Notes & Status ── */}
            <div style={{ gridColumn: "1 / -1" }}>
              <Section title="Notes & Status" icon="📝">
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "20px", alignItems: "start" }}>
                  <div>
                    <FieldLabel label="Internal Description" hint="not shown to users" />
                    <StyledTextarea rows={3} placeholder="e.g. Summer sale campaign for returning users..."
                      value={formData.description} onChange={(e) => setField("description", e.target.value)} />
                  </div>
                  <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "16px 20px", minWidth: "220px" }}>
                    <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: "12px", color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>Coupon Status</p>
                    <StatusToggle value={formData.is_active} onChange={(v) => setField("is_active", v)} />
                  </div>
                </div>
              </Section>
            </div>

          </div>
        </Modal.Body>

        <Modal.Footer style={{ background: "#fff", borderTop: "1px solid #e5e7eb", padding: "14px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>
              Fields marked <span style={{ color: "#ef4444" }}>*</span> are required
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <Button variant="outline-secondary" onClick={() => setShowForm(false)} disabled={saving}
                style={{ borderRadius: "10px", fontWeight: 600, padding: "9px 20px", fontSize: "13px" }}>
                Cancel
              </Button>
              <button onClick={handleSave} disabled={saving} style={{
                padding: "9px 24px", borderRadius: "10px", border: "none", fontWeight: 700, fontSize: "13px",
                background: saving ? "#9ca3af" : "linear-gradient(135deg, #1E8E3E, #166C31)",
                color: "#fff", cursor: saving ? "not-allowed" : "pointer",
                boxShadow: saving ? "none" : "0 4px 14px rgba(30,142,62,0.4)",
                display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s",
              }}>
                {saving ? (
                  <><span className="spinner-border spinner-border-sm" role="status" style={{ width: "14px", height: "14px", borderWidth: "2px" }} /> Saving...</>
                ) : (
                  <><LuTicket size={15} /> {editingCoupon ? "Update Coupon" : "Create Coupon"}</>
                )}
              </button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          DETAIL MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal show={showDetail} onHide={() => { setShowDetail(false); setDetailCoupon(null); }} size="md" centered scrollable>
        <Modal.Header closeButton style={{ background: "#1E8E3E", color: "#fff", borderBottom: "none", padding: "1.1rem 1.5rem" }}>
          <Modal.Title style={{ fontWeight: 700, fontSize: "1rem" }}>Coupon — {detailCoupon?.code}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: "#f8f9fa", padding: "1.25rem" }}>
          {detailCoupon && (
            <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #edf1ee" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#f0f9f3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <LuTicket style={{ color: "#1E8E3E", fontSize: "22px" }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: "18px", fontFamily: "monospace", color: "#111827" }}>{detailCoupon.code}</p>
                  <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                    <BadgeType type={detailCoupon.type} />
                    <BadgeStatus is_active={detailCoupon.is_active} is_expired={detailCoupon.is_expired} />
                  </div>
                </div>
              </div>
              <div className="row g-3">
                {[
                  { label: "Discount", value: detailCoupon.discount_type === "percentage" ? `${detailCoupon.discount_value}%` : `₹${detailCoupon.discount_value}` },
                  { label: "Max Discount Cap", value: detailCoupon.max_discount_amount ? `₹${detailCoupon.max_discount_amount}` : "No cap" },
                  { label: "Min Order", value: detailCoupon.min_order_amount ? `₹${detailCoupon.min_order_amount}` : "No minimum" },
                  { label: "Applicable On", value: detailCoupon.applicable_on?.replace("_", " ") },
                  { label: "Applicable Plans", value: detailCoupon.applicable_plans || "All plans" },
                  { label: "Total Uses", value: `${detailCoupon.total_uses ?? 0}${detailCoupon.max_uses ? ` / ${detailCoupon.max_uses}` : ""}` },
                  { label: "Max Per User", value: detailCoupon.max_uses_per_user ?? 1 },
                  { label: "Valid From", value: detailCoupon.valid_from ? formatDateTime(detailCoupon.valid_from) : "Immediately" },
                  { label: "Valid Until", value: detailCoupon.valid_until ? formatDateTime(detailCoupon.valid_until) : "Never expires" },
                  { label: "Created", value: formatDateTime(detailCoupon.created_at) },
                  ...(detailCoupon.type === "promotional" ? [
                    { label: "Influencer", value: detailCoupon.influencer_name },
                    { label: "Phone", value: detailCoupon.influencer_phone || "—" },
                    { label: "Campaign", value: detailCoupon.campaign_name || "—" },
                  ] : []),
                  ...(detailCoupon.description ? [{ label: "Description", value: detailCoupon.description }] : []),
                ].map(({ label, value }) => (
                  <div className="col-6" key={label}>
                    <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px" }}>
                      <small style={{ color: "#aaa", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</small>
                      <p style={{ margin: 0, fontWeight: 600, color: "#111827", fontSize: "13px", marginTop: "2px", textTransform: "capitalize" }}>{value ?? "N/A"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ background: "#f8f9fa", borderTop: "1px solid #edf1ee" }}>
          <Button variant="outline-secondary" onClick={() => { setShowDetail(false); setDetailCoupon(null); }} style={{ borderRadius: "8px", fontWeight: 600 }}>Close</Button>
          <Button onClick={() => { setShowDetail(false); openEdit(detailCoupon); }} style={{ borderRadius: "8px", fontWeight: 600, background: "#1E8E3E", border: "none" }}>Edit Coupon</Button>
        </Modal.Footer>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          DEACTIVATE CONFIRM
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal show={showDeactivate} onHide={() => !deactivating && setShowDeactivate(false)} size="sm" centered>
        <Modal.Body style={{ padding: "32px 24px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <MdBlock style={{ color: "#ef4444", fontSize: "28px" }} />
          </div>
          <h5 style={{ fontWeight: 700, marginBottom: "8px" }}>Deactivate Coupon?</h5>
          <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "4px" }}>
            Coupon <strong style={{ fontFamily: "monospace" }}>{deactivateCoupon?.code}</strong> will be deactivated.
          </p>
          <p style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "24px" }}>You can re-enable it anytime via Edit.</p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <Button variant="outline-secondary" onClick={() => setShowDeactivate(false)} disabled={deactivating} style={{ minWidth: "100px", fontWeight: 600 }}>Cancel</Button>
            <Button onClick={handleDeactivate} disabled={deactivating} style={{ minWidth: "120px", fontWeight: 600, background: "#ef4444", border: "none" }}>
              {deactivating ? "Deactivating..." : "Deactivate"}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          USAGES MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal show={showUsages} onHide={() => { setShowUsages(false); setUsagesData([]); }} size="lg" centered scrollable>
        <Modal.Header closeButton style={{ background: "#1E8E3E", color: "#fff", borderBottom: "none", padding: "1.1rem 1.5rem" }}>
          <Modal.Title style={{ fontWeight: 700, fontSize: "1rem" }}>Usage History — {usagesCoupon?.code}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: "#f8f9fa", padding: "1.25rem" }}>
          {loadingUsages ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div className="spinner-border" style={{ color: "#1E8E3E" }} role="status" />
              <p style={{ marginTop: "12px", color: "#999" }}>Loading usages...</p>
            </div>
          ) : usagesData.length > 0 ? (
            <>
              <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #edf1ee" }}>
                <Table className="table mb-0" style={{ borderCollapse: "collapse", minWidth: "800px" }}>
                  <thead>
                    <tr>
                      {["#", "User", "Type", "Amount", "Details", "Used At"].map((col) => (
                        <th key={col} style={{ background: "#1E8E3E", color: "#fff", fontWeight: 600, fontSize: "12px", padding: "12px 14px", whiteSpace: "nowrap", borderBottom: "2px solid #166C31" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {usagesData.map((u, i) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid #edf1ee", background: i % 2 === 0 ? "#fff" : "#fafcfa" }}>
                        <td style={{ padding: "10px 14px", fontSize: "13px", fontWeight: 700, color: "#1E8E3E", verticalAlign: "middle" }}>{(usagesMeta.page - 1) * usagesMeta.limit + i + 1}</td>
                        <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#111827" }}>{u.user_name || `#${u.user_id}`}</p>
                          {u.user_email && <p style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>{u.user_email}</p>}
                          {u.user_phone && <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{u.user_phone}</p>}
                        </td>
                        <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                          <span style={{
                            fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "20px",
                            background: u.applicable_type === "diet_plan" ? "#eff6ff" : "#fdf4ff",
                            color: u.applicable_type === "diet_plan" ? "#2563eb" : "#9333ea",
                          }}>
                            {u.applicable_type === "diet_plan" ? "Diet Plan" : "Appointment"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                          <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af", textDecoration: "line-through" }}>₹{u.original_amount}</p>
                          <p style={{ margin: 0, fontSize: "12px", color: "#16a34a", fontWeight: 700 }}>-₹{u.discount_applied}</p>
                          <p style={{ margin: 0, fontSize: "13px", color: "#111827", fontWeight: 800 }}>₹{u.final_amount}</p>
                        </td>
                        <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                          {u.applicable_type === "diet_plan" ? (
                            <>
                              {u.payment_plan && (
                                <span style={{ fontSize: "11px", fontWeight: 700, background: "#f0fdf4", color: "#15803d", padding: "2px 8px", borderRadius: "20px" }}>
                                  {u.payment_plan.replace("_", " ")}
                                </span>
                              )}
                              {u.payment_order_id && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#9ca3af", fontFamily: "monospace" }}>{u.payment_order_id}</p>}
                            </>
                          ) : (
                            <>
                              {u.appointment_date && <p style={{ margin: 0, fontSize: "12px", color: "#374151", fontWeight: 600 }}>{formatDate(u.appointment_date)}{u.appointment_slot ? `, ${u.appointment_slot}` : ""}</p>}
                              {u.dietitian_name && <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#6b7280" }}>{u.dietitian_name}</p>}
                            </>
                          )}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: "12px", color: "#888", verticalAlign: "middle", whiteSpace: "nowrap" }}>{formatDateTime(u.used_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 2px", fontSize: "13px", color: "#888", marginTop: "4px" }}>
                <span>Total: <strong style={{ color: "#111827" }}>{usagesMeta.total}</strong> uses</span>
                <span style={{ background: "#f0f9f3", padding: "3px 12px", borderRadius: "20px", fontWeight: 500, color: "#1E8E3E" }}>Page {usagesMeta.page} of {usagesMeta.totalPages}</span>
              </div>
              {usagesMeta.totalPages > 1 && <GlobalPagination currentPage={usagesPage} totalPages={usagesMeta.totalPages} onPageChange={handleUsagesPageChange} />}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
              <p style={{ fontWeight: 600 }}>No usages recorded yet for this coupon.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ background: "#f8f9fa", borderTop: "1px solid #edf1ee" }}>
          <Button variant="secondary" onClick={() => { setShowUsages(false); setUsagesData([]); }} style={{ borderRadius: "8px", fontWeight: 600 }}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
