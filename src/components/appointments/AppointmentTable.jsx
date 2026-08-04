import { useState, useEffect, useRef } from "react";
import { Table, Modal, Button } from "react-bootstrap";
import { FaEye, FaSearch, FaTimes, FaVideo, FaMapMarkerAlt, FaStar, FaPhone, FaEnvelope, FaFilter, FaBan, FaCheck } from "react-icons/fa";
import { LuCalendarDays, LuClock, LuStethoscope, LuChevronDown, LuX } from "react-icons/lu";
import { MdPayment } from "react-icons/md";
import GlobalPagination from "../common/GlobalPagination";
import appointmentService from "../../services/appointmentService";
import toast from "react-hot-toast";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};
const formatDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const formatDuration = (sec) => {
  if (!sec) return "—";
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
};
const calcBreakdown = (fee, isNoShow, commissionPct = 20) => {
  const commission = Math.round((fee || 0) * commissionPct / 100);
  const afterCommission = (fee || 0) - commission;
  const amountCredited = isNoShow ? Math.round(afterCommission * 0.5) : afterCommission;
  return { commission, afterCommission, amountCredited };
};

// ── Styles ────────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  pending:   { bg: "#fffbeb", color: "#d97706", border: "#fde68a", dot: "#d97706" },
  confirmed: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", dot: "#2563eb" },
  completed: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", dot: "#16a34a" },
  cancelled: { bg: "#fef2f2", color: "#ef4444", border: "#fecaca", dot: "#ef4444" },
  missed:    { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe", dot: "#7c3aed" },
};
const PAYMENT_STYLES = {
  unpaid:   { bg: "#fef2f2", color: "#ef4444", border: "#fecaca" },
  paid:     { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  refunded: { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
};
const NO_SHOW_TYPE_STYLES = {
  patient_no_show:   { bg: "#fef2f2", color: "#ef4444", border: "#fecaca", label: "Patient No-Show" },
  dietitian_no_show: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", label: "Dietitian No-Show" },
  both_no_show:      { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe", label: "Both No-Show" },
};

// ── Badges ────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb", dot: "#9ca3af" };
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px", textTransform: "capitalize" }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}
function PaymentBadge({ status }) {
  const s = PAYMENT_STYLES[status] || { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };
  return <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, textTransform: "capitalize" }}>{status}</span>;
}
function SessionBadge({ type }) {
  const v = type === "video_call";
  return (
    <span style={{ background: v ? "#eff6ff" : "#f0fdf4", color: v ? "#2563eb" : "#16a34a", border: `1px solid ${v ? "#bfdbfe" : "#bbf7d0"}`, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
      {v ? <FaVideo size={10} /> : <FaMapMarkerAlt size={10} />}
      {v ? "Video" : "In Person"}
    </span>
  );
}
function NoShowBadge({ isNoShow }) {
  return isNoShow
    ? <span style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>No-Show</span>
    : <span style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>Attended</span>;
}
function SourceBadge({ source }) {
  const ns = source === "no_show_compensation";
  return (
    <span style={{ background: ns ? "#fff7ed" : "#f0fdf4", color: ns ? "#c2410c" : "#16a34a", border: `1px solid ${ns ? "#fed7aa" : "#bbf7d0"}`, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>
      {ns ? "No-Show" : "Completed"}
    </span>
  );
}
function NoShowTypeBadge({ type }) {
  const s = NO_SHOW_TYPE_STYLES[type] || { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb", label: type || "—" };
  return <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>{s.label}</span>;
}

// ── Reusable UI ───────────────────────────────────────────────────────────────
function FilterDropdown({ value, onChange, options, placeholder, accent = "#1E8E3E" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const selected = options.find((o) => o.value === value);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((p) => !p)}
        style={{ height: "40px", border: `1px solid ${value ? accent : "#e5e5e5"}`, borderRadius: "10px", padding: "0 12px", background: value ? `${accent}12` : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", minWidth: "130px", fontWeight: 600, fontSize: "12.5px", color: value ? accent : "#6b7280", whiteSpace: "nowrap" }}>
        <FaFilter style={{ fontSize: "11px", color: value ? accent : "#aaa" }} />
        {selected?.label || placeholder}
        {value
          ? <LuX style={{ marginLeft: "auto", fontSize: "13px" }} onClick={(e) => { e.stopPropagation(); onChange(""); }} />
          : <LuChevronDown style={{ marginLeft: "auto", fontSize: "12px", color: "#aaa" }} />}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#fff", border: "1px solid #edf1ee", borderRadius: "12px", minWidth: "160px", zIndex: 1000, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: "6px" }}>
          {options.map((o) => (
            <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
              style={{ padding: "8px 14px", cursor: "pointer", borderRadius: "8px", fontSize: "13px", fontWeight: value === o.value ? 700 : 500, color: value === o.value ? accent : "#444", background: value === o.value ? `${accent}10` : "transparent", display: "flex", alignItems: "center", gap: "8px" }}>
              {o.dot && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: o.dot, flexShrink: 0 }} />}
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div style={{ position: "relative", minWidth: "220px", flex: "1 1 220px", maxWidth: "320px" }}>
      <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "12px" }} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ height: "40px", width: "100%", border: "1px solid #e5e5e5", borderRadius: "10px", padding: "0 36px 0 34px", fontSize: "13px", outline: "none", color: "#111827" }} />
      {value && <FaTimes onClick={() => onChange("")} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "12px", cursor: "pointer" }} />}
    </div>
  );
}

function DateRange({ from, to, onFrom, onTo }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <input type="date" value={from} onChange={(e) => onFrom(e.target.value)}
        style={{ height: "40px", border: "1px solid #e5e5e5", borderRadius: "10px", padding: "0 10px", fontSize: "12.5px", color: "#374151", outline: "none" }} />
      <span style={{ color: "#9ca3af", fontSize: "12px" }}>to</span>
      <input type="date" value={to} onChange={(e) => onTo(e.target.value)}
        style={{ height: "40px", border: "1px solid #e5e5e5", borderRadius: "10px", padding: "0 10px", fontSize: "12.5px", color: "#374151", outline: "none" }} />
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px" }}>
      <small style={{ color: "#aaa", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block" }}>{label}</small>
      <p style={{ margin: "2px 0 0", fontWeight: 600, color: "#111827", fontSize: "13px", fontFamily: mono ? "monospace" : "inherit" }}>
        {value ?? <span style={{ color: "#9ca3af" }}>—</span>}
      </p>
    </div>
  );
}
function SectionHeader({ title, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "20px 0 12px" }}>
      <span style={{ fontSize: "15px" }}>{icon}</span>
      <span style={{ fontWeight: 800, fontSize: "11.5px", color: "#374151", textTransform: "uppercase", letterSpacing: "0.8px" }}>{title}</span>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, #e5e7eb, transparent)", marginLeft: "4px" }} />
    </div>
  );
}
function StarRating({ value }) {
  if (!value) return <span style={{ color: "#9ca3af", fontSize: "12px" }}>Not rated</span>;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
      {[1, 2, 3, 4, 5].map((i) => <FaStar key={i} size={13} color={i <= value ? "#f59e0b" : "#e5e7eb"} />)}
      <span style={{ marginLeft: "4px", fontSize: "12px", fontWeight: 700, color: "#374151" }}>{value}/5</span>
    </div>
  );
}
function TH({ children }) {
  return <th style={{ background: "#1E8E3E", color: "#fff", fontWeight: 600, fontSize: "13px", padding: "14px 16px", whiteSpace: "nowrap", borderBottom: "2px solid #166C31", letterSpacing: "0.3px" }}>{children}</th>;
}
function TD({ children, style }) {
  return <td style={{ padding: "12px 16px", verticalAlign: "middle", ...style }}>{children}</td>;
}
function TR({ children, index }) {
  return (
    <tr style={{ borderBottom: "1px solid #edf1ee", background: index % 2 === 0 ? "#fff" : "#fafcfa", transition: "background 0.2s" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9f3")}
      onMouseLeave={(e) => (e.currentTarget.style.background = index % 2 === 0 ? "#fff" : "#fafcfa")}>
      {children}
    </tr>
  );
}
function DietitianCell({ d }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {d?.photo
        ? <img src={d.photo} alt="" style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
        : <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><LuStethoscope size={14} color="#1E8E3E" /></div>
      }
      <div>
        <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: "#111827" }}>{d?.name || "—"}</p>
        <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{d?.phone || "—"}</p>
      </div>
    </div>
  );
}
function ActionBtn({ onClick, title, bg, children }) {
  return (
    <div onClick={onClick} title={title}
      style={{ width: "32px", height: "32px", borderRadius: "8px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform 0.2s" }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
      {children}
    </div>
  );
}
function Pagination({ pagination, onPageChange, count }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px", fontSize: "13px", color: "#888", marginTop: "4px" }}>
        <span>Showing <strong style={{ color: "#111827" }}>{count}</strong> of <strong style={{ color: "#111827" }}>{pagination.total}</strong></span>
        <span style={{ background: "#f0f9f3", padding: "4px 14px", borderRadius: "20px", fontWeight: 500, color: "#1E8E3E" }}>Page {pagination.page} of {pagination.pages}</span>
      </div>
      {pagination.pages > 1 && <GlobalPagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={onPageChange} />}
    </>
  );
}
function LoadingState() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div className="spinner-border" style={{ color: "#1E8E3E", width: "2.5rem", height: "2.5rem" }} role="status" />
      <p style={{ marginTop: "16px", color: "#999", fontSize: "14px", fontWeight: 500 }}>Loading...</p>
    </div>
  );
}
function EmptyState({ msg }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", borderRadius: "12px", border: "1px solid #edf1ee" }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>📅</div>
      <h5 style={{ fontWeight: 700, color: "#333", marginBottom: "8px" }}>No Records Found</h5>
      <p style={{ fontSize: "14px", color: "#999" }}>{msg || "Nothing to show here."}</p>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────
const MAIN_TABS = [
  { value: "action_required", label: "Action Required", color: "#d97706" },
  { value: "all",             label: "All Appointments", color: "#1E8E3E" },
  { value: "payment_history", label: "Payment History",  color: "#6b7280" },
];

const ACTION_TYPES = [
  { value: "pending_payment",    label: "Pending Payment",   color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  { value: "no_show_queue",      label: "No-Show Queue",     color: "#c2410c", bg: "#fef2f2", border: "#fecaca" },
  { value: "no_show_approval",   label: "No-Show Approval",  color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
];

const STATUS_OPTIONS = [
  { value: "",          label: "All Statuses" },
  { value: "pending",   label: "Pending",   dot: "#d97706" },
  { value: "confirmed", label: "Confirmed", dot: "#2563eb" },
  { value: "completed", label: "Completed", dot: "#16a34a" },
  { value: "cancelled", label: "Cancelled", dot: "#ef4444" },
  { value: "missed",    label: "Missed",    dot: "#7c3aed" },
];

const PAYMENT_OPTIONS = [
  { value: "",         label: "All Payment" },
  { value: "paid",     label: "Paid",     dot: "#16a34a" },
  { value: "unpaid",   label: "Unpaid",   dot: "#ef4444" },
  { value: "refunded", label: "Refunded", dot: "#7c3aed" },
];


// ═════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function AppointmentTable() {
  const [activeView, setActiveView] = useState("action_required");
  const [actionType, setActionType] = useState("pending_payment");
  const [refreshKey, setRefreshKey] = useState(0);

  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);

  // Commission / penalty (returned by some API responses)
  const [commissionPct, setCommissionPct] = useState(20);
  const [penaltyAmount, setPenaltyAmount] = useState(100);

  // Action Required filters
  const [arPage, setArPage] = useState(1);
  const [arSearch, setArSearch] = useState("");
  const [arSearchInput, setArSearchInput] = useState("");
  const arTimer = useRef(null);

  // All Appointments filters
  const [allPage, setAllPage] = useState(1);
  const [allSearch, setAllSearch] = useState("");
  const [allSearchInput, setAllSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const allTimer = useRef(null);

  // Payment History filters
  const [phPage, setPhPage] = useState(1);
  const [phSearch, setPhSearch] = useState("");
  const [phSearchInput, setPhSearchInput] = useState("");
  const [phDietitianId, setPhDietitianId] = useState("");
  const [phDateFrom, setPhDateFrom] = useState("");
  const [phDateTo, setPhDateTo] = useState("");
  const phTimer = useRef(null);

  // Detail modal
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvingPayment, setApprovingPayment] = useState(false);

  // Mark No-Show modal
  const [showMarkNoShowModal, setShowMarkNoShowModal] = useState(false);
  const [markNoShowAppt, setMarkNoShowAppt] = useState(null);
  const [missedType, setMissedType] = useState("patient_no_show");
  const [missedReason, setMissedReason] = useState("");
  const [markingNoShow, setMarkingNoShow] = useState(false);

  // Approve No-Show modal
  const [showApproveNoShowModal, setShowApproveNoShowModal] = useState(false);
  const [approveNoShowAppt, setApproveNoShowAppt] = useState(null);
  const [approvingNoShow, setApprovingNoShow] = useState(false);

  // Reset list on view/action-type change
  useEffect(() => {
    setAppointments([]);
    setPagination({ page: 1, limit: 20, total: 0, pages: 1 });
    setArPage(1); setArSearch(""); setArSearchInput("");
  }, [activeView, actionType]);

  // ── Fetch: Action Required ──────────────────────────────────────────────────
  useEffect(() => {
    if (activeView !== "action_required") return;
    setLoading(true);
    const p = new URLSearchParams({ page: arPage, limit: 20 });
    if (arSearch) p.append("search", arSearch);

    const call =
      actionType === "pending_payment"  ? appointmentService.pendingApproval(p.toString()) :
      actionType === "no_show_queue"    ? appointmentService.noShowQueue(p.toString()) :
                                          appointmentService.pendingNoShowApproval(p.toString());

    call
      .then((res) => {
        const d = res?.data?.data || {};
        setAppointments(d.appointments || []);
        setPagination(d.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
        if (d.commission_pct != null) setCommissionPct(d.commission_pct);
        if (d.penalty_amount != null) setPenaltyAmount(d.penalty_amount);
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to load."))
      .finally(() => setLoading(false));
  }, [activeView, actionType, arPage, arSearch, refreshKey]);

  // ── Fetch: All Appointments ─────────────────────────────────────────────────
  useEffect(() => {
    if (activeView !== "all") return;
    setLoading(true);
    const p = new URLSearchParams({ page: allPage, limit: 20 });
    if (statusFilter)  p.append("status", statusFilter);
    if (paymentFilter) p.append("payment_status", paymentFilter);
    if (dateFrom)      p.append("date_from", dateFrom);
    if (dateTo)        p.append("date_to", dateTo);
    if (allSearch)     p.append("search", allSearch);
    appointmentService.list(p.toString())
      .then((res) => {
        const d = res?.data?.data || {};
        setAppointments(d.appointments || []);
        setPagination(d.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to load appointments."))
      .finally(() => setLoading(false));
  }, [activeView, allPage, statusFilter, paymentFilter, dateFrom, dateTo, allSearch, refreshKey]);

  // ── Fetch: Payment History ──────────────────────────────────────────────────
  useEffect(() => {
    if (activeView !== "payment_history") return;
    setLoading(true);
    const p = new URLSearchParams({ page: phPage, limit: 20 });
    if (phSearch)      p.append("search", phSearch);
    if (phDietitianId) p.append("dietitian_id", phDietitianId);
    if (phDateFrom)    p.append("date_from", phDateFrom);
    if (phDateTo)      p.append("date_to", phDateTo);
    appointmentService.paymentHistory(p.toString())
      .then((res) => {
        const d = res?.data?.data || {};
        setAppointments(d.appointments || []);
        setPagination(d.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to load payment history."))
      .finally(() => setLoading(false));
  }, [activeView, phPage, phSearch, phDietitianId, phDateFrom, phDateTo, refreshKey]);

  // ── Detail modal ────────────────────────────────────────────────────────────
  const openDetail = (id) => {
    setShowDetail(true); setDetail(null); setLoadingDetail(true);
    appointmentService.get(id)
      .then((res) => setDetail(res?.data?.data || null))
      .catch((err) => { toast.error(err?.response?.data?.message || "Failed to load."); setShowDetail(false); })
      .finally(() => setLoadingDetail(false));
  };
  const refreshDetail = (id) => {
    setLoadingDetail(true);
    appointmentService.get(id).then((res) => setDetail(res?.data?.data || null)).catch(() => {}).finally(() => setLoadingDetail(false));
  };

  // ── Approve payment ─────────────────────────────────────────────────────────
  const handleApprove = () => {
    if (!detail) return;
    setApprovingPayment(true);
    appointmentService.approvePayment(detail.id)
      .then(() => { toast.success("Payment approved!"); setShowApproveModal(false); refreshDetail(detail.id); setRefreshKey((k) => k + 1); })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to approve."))
      .finally(() => setApprovingPayment(false));
  };

  // ── Mark No-Show ────────────────────────────────────────────────────────────
  const handleMarkNoShow = () => {
    if (!markNoShowAppt || !missedType) return;
    setMarkingNoShow(true);
    appointmentService.markNoShow(markNoShowAppt.id, { missed_type: missedType, missed_reason: missedReason })
      .then(() => { toast.success("No-show recorded."); setShowMarkNoShowModal(false); setMissedType("patient_no_show"); setMissedReason(""); setRefreshKey((k) => k + 1); })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed."))
      .finally(() => setMarkingNoShow(false));
  };

  // ── Approve No-Show ─────────────────────────────────────────────────────────
  const handleApproveNoShow = () => {
    if (!approveNoShowAppt) return;
    setApprovingNoShow(true);
    appointmentService.approveNoShow(approveNoShowAppt.id)
      .then((res) => {
        const d = res?.data?.data || {};
        const msg =
          d.action === "dietitian_credited" ? `Dietitian credited ₹${d.amount_credited}!`
          : d.action === "patient_refunded_and_dietitian_penalised" ? `Patient refunded ₹${d.refund_amount}. Dietitian penalized ₹${d.penalty_deducted}.`
          : `Dietitian penalized ₹${d.penalty_deducted}. No refund issued.`;
        toast.success(msg);
        setShowApproveNoShowModal(false);
        setRefreshKey((k) => k + 1);
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed."))
      .finally(() => setApprovingNoShow(false));
  };

  // ── Debounced search ────────────────────────────────────────────────────────
  const handleArSearch = (val) => {
    setArSearchInput(val);
    clearTimeout(arTimer.current);
    arTimer.current = setTimeout(() => { setArSearch(val); setArPage(1); }, 500);
  };
  const handleAllSearch = (val) => {
    setAllSearchInput(val);
    clearTimeout(allTimer.current);
    allTimer.current = setTimeout(() => { setAllSearch(val); setAllPage(1); }, 500);
  };
  const handlePhSearch = (val) => {
    setPhSearchInput(val);
    clearTimeout(phTimer.current);
    phTimer.current = setTimeout(() => { setPhSearch(val); setPhPage(1); }, 500);
  };

  const clearAllFilters = () => {
    setStatusFilter(""); setPaymentFilter("");
    setDateFrom(""); setDateTo(""); setAllSearch(""); setAllSearchInput(""); setAllPage(1);
  };
  const clearPhFilters = () => {
    setPhSearch(""); setPhSearchInput(""); setPhDietitianId(""); setPhDateFrom(""); setPhDateTo(""); setPhPage(1);
  };
  const hasAllFilters = statusFilter || paymentFilter || dateFrom || dateTo || allSearch;
  const hasPhFilters  = phSearch || phDietitianId || phDateFrom || phDateTo;

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

        {/* ── Main tabs ── */}
        <div style={{ display: "flex", borderBottom: "2px solid #f0f0f0", marginBottom: "20px", gap: "2px", flexWrap: "wrap" }}>
          {MAIN_TABS.map((tab) => {
            const active = activeView === tab.value;
            return (
              <button key={tab.value} onClick={() => setActiveView(tab.value)}
                style={{ padding: "10px 28px", border: "none", background: "none", cursor: "pointer", fontWeight: active ? 700 : 500, fontSize: "13.5px", color: active ? tab.color : "#6b7280", borderBottom: `2.5px solid ${active ? tab.color : "transparent"}`, marginBottom: "-2px", transition: "all 0.15s", whiteSpace: "nowrap" }}>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1 — ACTION REQUIRED
        ══════════════════════════════════════════════════════════════════ */}
        {activeView === "action_required" && (
          <>
            {/* Type selector */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
              {ACTION_TYPES.map((t) => {
                const active = actionType === t.value;
                return (
                  <button key={t.value} onClick={() => setActionType(t.value)}
                    style={{ padding: "7px 18px", borderRadius: "20px", border: `1.5px solid ${active ? t.color : "#e5e7eb"}`, background: active ? t.bg : "#fff", color: active ? t.color : "#6b7280", fontWeight: active ? 700 : 500, fontSize: "12.5px", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}>
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Context banner */}
            {actionType === "pending_payment" && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "10px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#92400e" }}>
                <MdPayment size={16} color="#d97706" />
                Completed appointments with collected payment waiting for your approval to credit the dietitian.
              </div>
            )}
            {actionType === "no_show_queue" && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#991b1b" }}>
                <FaBan size={14} color="#ef4444" />
                Confirmed appointments past their slot time (30 min grace). Review and mark who didn't show up.
              </div>
            )}
            {actionType === "no_show_approval" && (
              <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: "10px", padding: "10px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#5b21b6" }}>
                <MdPayment size={16} color="#7c3aed" />
                Missed appointments waiting for financial action — refund, credit, or penalty based on who didn't show.
              </div>
            )}

            {/* Search */}
            <div style={{ marginBottom: "16px" }}>
              <SearchBar value={arSearchInput} onChange={handleArSearch} placeholder="Search patient name, email, phone..." />
            </div>

            {/* ── Pending Payment table ── */}
            {actionType === "pending_payment" && (
              loading ? <LoadingState /> : appointments.length === 0 ? <EmptyState msg="No appointments pending payment approval." /> : (
                <>
                  <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #edf1ee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <Table className="table mb-0" style={{ borderCollapse: "collapse", minWidth: "980px" }}>
                      <thead>
                        <tr>{["S.No", "Patient", "Dietitian", "Date & Slot", "Session", "No-Show", "Fee", "To Be Credited", "Actions"].map((c) => <TH key={c}>{c}</TH>)}</tr>
                      </thead>
                      <tbody>
                        {appointments.map((a, i) => {
                          const { amountCredited } = calcBreakdown(a.fee, a.is_no_show, commissionPct);
                          return (
                            <TR key={a.id} index={i}>
                              <TD style={{ fontWeight: 700, color: "#d97706", fontSize: "13px" }}>{(pagination.page - 1) * pagination.limit + i + 1}</TD>
                              <TD>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#111827" }}>{a.patient?.name || "—"}</p>
                                <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{a.patient?.phone || ""}</p>
                              </TD>
                              <TD><DietitianCell d={a.dietitian} /></TD>
                              <TD style={{ whiteSpace: "nowrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12.5px", color: "#374151", fontWeight: 600 }}>
                                  <LuCalendarDays size={12} color="#d97706" /> {formatDate(a.appointment_date)}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11.5px", color: "#9ca3af", marginTop: "2px" }}>
                                  <LuClock size={11} /> {a.slot} · {a.duration}min
                                </div>
                              </TD>
                              <TD><SessionBadge type={a.session_type} /></TD>
                              <TD><NoShowBadge isNoShow={a.is_no_show} /></TD>
                              <TD style={{ fontWeight: 700, fontSize: "13px", color: "#111827" }}>
                                ₹{a.fee}<div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: 500 }}>{a.currency}</div>
                              </TD>
                              <TD>
                                <span style={{ fontWeight: 800, fontSize: "15px", color: "#1E8E3E" }}>₹{amountCredited}</span>
                                {a.is_no_show && <div style={{ fontSize: "10px", color: "#c2410c", fontWeight: 600 }}>50% (No-Show)</div>}
                              </TD>
                              <TD>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <ActionBtn onClick={() => openDetail(a.id)} title="View & Approve" bg="#fffbeb">
                                    <MdPayment style={{ color: "#d97706", fontSize: "15px" }} />
                                  </ActionBtn>
                                  <ActionBtn onClick={() => openDetail(a.id)} title="View Details" bg="#eff6ff">
                                    <FaEye style={{ color: "#3b82f6", fontSize: "13px" }} />
                                  </ActionBtn>
                                </div>
                              </TD>
                            </TR>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                  <Pagination pagination={pagination} onPageChange={setArPage} count={appointments.length} />
                </>
              )
            )}

            {/* ── No-Show Queue table ── */}
            {actionType === "no_show_queue" && (
              loading ? <LoadingState /> : appointments.length === 0 ? <EmptyState msg="No appointments in the no-show queue." /> : (
                <>
                  <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #edf1ee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <Table className="table mb-0" style={{ borderCollapse: "collapse", minWidth: "1050px" }}>
                      <thead>
                        <tr>{["S.No", "Patient", "Dietitian", "Date & Slot", "Session", "Patient Joined", "Dietitian Joined", "Fee", "Actions"].map((c) => <TH key={c}>{c}</TH>)}</tr>
                      </thead>
                      <tbody>
                        {appointments.map((a, i) => {
                          const ct = a.call_tracking || {};
                          const patJoined = !!ct.user_joined_at;
                          const dJoined   = !!ct.dietitian_joined_at;
                          const suggested =
                            ct.patient_no_show && ct.dietitian_no_show ? "both_no_show"
                            : ct.dietitian_no_show ? "dietitian_no_show"
                            : "patient_no_show";
                          return (
                            <TR key={a.id} index={i}>
                              <TD style={{ fontWeight: 700, color: "#c2410c", fontSize: "13px" }}>{(pagination.page - 1) * pagination.limit + i + 1}</TD>
                              <TD>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#111827" }}>{a.patient?.name || "—"}</p>
                                <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{a.patient?.phone || ""}</p>
                              </TD>
                              <TD><DietitianCell d={a.dietitian} /></TD>
                              <TD style={{ whiteSpace: "nowrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12.5px", color: "#374151", fontWeight: 600 }}>
                                  <LuCalendarDays size={12} color="#c2410c" /> {formatDate(a.appointment_date)}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11.5px", color: "#9ca3af", marginTop: "2px" }}>
                                  <LuClock size={11} /> {a.slot} · {a.duration}min
                                </div>
                              </TD>
                              <TD><SessionBadge type={a.session_type} /></TD>
                              <TD>
                                <span style={{ background: patJoined ? "#f0fdf4" : "#fef2f2", color: patJoined ? "#16a34a" : "#ef4444", border: `1px solid ${patJoined ? "#bbf7d0" : "#fecaca"}`, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>
                                  {patJoined ? "Joined" : "Didn't join"}
                                </span>
                                {ct.user_joined_at && <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "3px" }}>{formatDateTime(ct.user_joined_at)}</div>}
                              </TD>
                              <TD>
                                <span style={{ background: dJoined ? "#f0fdf4" : "#fef2f2", color: dJoined ? "#16a34a" : "#ef4444", border: `1px solid ${dJoined ? "#bbf7d0" : "#fecaca"}`, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>
                                  {dJoined ? "Joined" : "Didn't join"}
                                </span>
                                {ct.dietitian_joined_at && <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "3px" }}>{formatDateTime(ct.dietitian_joined_at)}</div>}
                              </TD>
                              <TD style={{ fontWeight: 700, fontSize: "13px", color: "#111827" }}>
                                ₹{a.fee}<div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: 500 }}>{a.currency}</div>
                              </TD>
                              <TD>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <ActionBtn onClick={() => openDetail(a.id)} title="View Details" bg="#eff6ff">
                                    <FaEye style={{ color: "#3b82f6", fontSize: "13px" }} />
                                  </ActionBtn>
                                  <ActionBtn onClick={() => { setMarkNoShowAppt(a); setMissedType(suggested); setMissedReason(""); setShowMarkNoShowModal(true); }} title="Mark No-Show" bg="#fef2f2">
                                    <FaBan style={{ color: "#ef4444", fontSize: "13px" }} />
                                  </ActionBtn>
                                </div>
                              </TD>
                            </TR>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                  <Pagination pagination={pagination} onPageChange={setArPage} count={appointments.length} />
                </>
              )
            )}

            {/* ── No-Show Approval table ── */}
            {actionType === "no_show_approval" && (
              loading ? <LoadingState /> : appointments.length === 0 ? <EmptyState msg="No appointments pending no-show approval." /> : (
                <>
                  <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #edf1ee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <Table className="table mb-0" style={{ borderCollapse: "collapse", minWidth: "1050px" }}>
                      <thead>
                        <tr>{["S.No", "Patient", "Dietitian", "Date & Slot", "No-Show Type", "Fee", "On Approval", "Actions"].map((c) => <TH key={c}>{c}</TH>)}</tr>
                      </thead>
                      <tbody>
                        {appointments.map((a, i) => {
                          const commission     = Math.round((a.fee || 0) * commissionPct / 100);
                          const afterCommission = (a.fee || 0) - commission;
                          const credited       = Math.round(afterCommission * 0.5);
                          const impactText =
                            a.missed_type === "patient_no_show"   ? `Credit ₹${credited} to dietitian`
                            : a.missed_type === "dietitian_no_show" ? `Refund ₹${a.fee} + ₹${penaltyAmount} penalty`
                            : `₹${penaltyAmount} penalty, no refund`;
                          const impactColor = a.missed_type === "patient_no_show" ? "#16a34a" : "#ef4444";
                          return (
                            <TR key={a.id} index={i}>
                              <TD style={{ fontWeight: 700, color: "#7c3aed", fontSize: "13px" }}>{(pagination.page - 1) * pagination.limit + i + 1}</TD>
                              <TD>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#111827" }}>{a.patient?.name || "—"}</p>
                                <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{a.patient?.phone || ""}</p>
                              </TD>
                              <TD><DietitianCell d={a.dietitian} /></TD>
                              <TD style={{ whiteSpace: "nowrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12.5px", color: "#374151", fontWeight: 600 }}>
                                  <LuCalendarDays size={12} color="#7c3aed" /> {formatDate(a.appointment_date)}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11.5px", color: "#9ca3af", marginTop: "2px" }}>
                                  <LuClock size={11} /> {a.slot}
                                </div>
                              </TD>
                              <TD><NoShowTypeBadge type={a.missed_type} /></TD>
                              <TD style={{ fontWeight: 700, fontSize: "13px", color: "#111827" }}>
                                ₹{a.fee}<div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: 500 }}>{a.currency}</div>
                              </TD>
                              <TD><span style={{ fontSize: "12.5px", fontWeight: 700, color: impactColor }}>{impactText}</span></TD>
                              <TD>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <ActionBtn onClick={() => openDetail(a.id)} title="View Details" bg="#eff6ff">
                                    <FaEye style={{ color: "#3b82f6", fontSize: "13px" }} />
                                  </ActionBtn>
                                  <ActionBtn onClick={() => { setApproveNoShowAppt(a); setShowApproveNoShowModal(true); }} title="Approve No-Show" bg="#f5f3ff">
                                    <FaCheck style={{ color: "#7c3aed", fontSize: "12px" }} />
                                  </ActionBtn>
                                </div>
                              </TD>
                            </TR>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                  <Pagination pagination={pagination} onPageChange={setArPage} count={appointments.length} />
                </>
              )
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2 — ALL APPOINTMENTS
        ══════════════════════════════════════════════════════════════════ */}
        {activeView === "all" && (
          <>
            {/* Single filter bar */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
              <SearchBar value={allSearchInput} onChange={handleAllSearch} placeholder="Search patient name, email, phone..." />
              <FilterDropdown value={statusFilter}  onChange={(v) => { setStatusFilter(v);  setAllPage(1); }} options={STATUS_OPTIONS}  placeholder="Status" />
              <FilterDropdown value={paymentFilter} onChange={(v) => { setPaymentFilter(v); setAllPage(1); }} options={PAYMENT_OPTIONS} placeholder="Payment" accent="#16a34a" />
              <DateRange
                from={dateFrom} to={dateTo}
                onFrom={(v) => { setDateFrom(v); setAllPage(1); }}
                onTo={(v)   => { setDateTo(v);   setAllPage(1); }}
              />
              {hasAllFilters && (
                <button onClick={clearAllFilters} style={{ height: "40px", border: "1px solid #fecaca", borderRadius: "10px", padding: "0 14px", background: "#fef2f2", cursor: "pointer", color: "#ef4444", fontWeight: 600, fontSize: "12.5px", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
                  <LuX size={13} /> Clear
                </button>
              )}
            </div>

            {loading ? <LoadingState /> : appointments.length === 0 ? (
              <EmptyState msg={hasAllFilters ? "No appointments match the current filters." : "No appointments yet."} />
            ) : (
              <>
                <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #edf1ee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <Table className="table mb-0" style={{ borderCollapse: "collapse", minWidth: "1050px" }}>
                    <thead>
                      <tr>{["S.No", "Patient", "Dietitian", "Date & Slot", "Session", "Status", "Payment", "Fee", "Created", "Actions"].map((c) => <TH key={c}>{c}</TH>)}</tr>
                    </thead>
                    <tbody>
                      {appointments.map((a, i) => {
                        const needsApproval = a.status === "completed" && a.payment_status === "paid" && !a.payment_approved_at;
                        return (
                          <TR key={a.id} index={i}>
                            <TD style={{ fontWeight: 700, color: "#1E8E3E", fontSize: "13px" }}>{(pagination.page - 1) * pagination.limit + i + 1}</TD>
                            <TD>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#111827" }}>{a.patient?.name || "—"}</p>
                              <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{a.patient?.phone || ""}</p>
                            </TD>
                            <TD><DietitianCell d={a.dietitian} /></TD>
                            <TD style={{ whiteSpace: "nowrap" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12.5px", color: "#374151", fontWeight: 600 }}>
                                <LuCalendarDays size={12} color="#1E8E3E" /> {formatDate(a.appointment_date)}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11.5px", color: "#9ca3af", marginTop: "2px" }}>
                                <LuClock size={11} /> {a.slot} · {a.duration}min
                              </div>
                            </TD>
                            <TD><SessionBadge type={a.session_type} /></TD>
                            <TD><StatusBadge status={a.status} /></TD>
                            <TD>
                              <PaymentBadge status={a.payment_status} />
                              {needsApproval && (
                                <div style={{ marginTop: "4px" }}>
                                  <span style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a", borderRadius: "20px", padding: "2px 8px", fontSize: "10px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                    <MdPayment size={9} /> Needs Approval
                                  </span>
                                </div>
                              )}
                            </TD>
                            <TD style={{ fontWeight: 700, fontSize: "13px", color: "#111827" }}>
                              ₹{a.fee}<div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: 500 }}>{a.currency}</div>
                            </TD>
                            <TD style={{ fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap" }}>{formatDate(a.created_at)}</TD>
                            <TD>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <ActionBtn onClick={() => openDetail(a.id)} title="View Details" bg="#eff6ff">
                                  <FaEye style={{ color: "#3b82f6", fontSize: "13px" }} />
                                </ActionBtn>
                                {needsApproval && (
                                  <ActionBtn onClick={() => openDetail(a.id)} title="Approve Payment" bg="#fffbeb">
                                    <MdPayment style={{ color: "#d97706", fontSize: "14px" }} />
                                  </ActionBtn>
                                )}
                              </div>
                            </TD>
                          </TR>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
                <Pagination pagination={pagination} onPageChange={setAllPage} count={appointments.length} />
              </>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3 — PAYMENT HISTORY
        ══════════════════════════════════════════════════════════════════ */}
        {activeView === "payment_history" && (
          <>
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
              <SearchBar value={phSearchInput} onChange={handlePhSearch} placeholder="Search patient name, email, phone..." />
              <input placeholder="Dietitian ID" value={phDietitianId} onChange={(e) => { setPhDietitianId(e.target.value); setPhPage(1); }}
                style={{ height: "40px", border: "1px solid #e5e5e5", borderRadius: "10px", padding: "0 12px", fontSize: "13px", outline: "none", width: "130px", color: "#374151" }} />
              <DateRange
                from={phDateFrom} to={phDateTo}
                onFrom={(v) => { setPhDateFrom(v); setPhPage(1); }}
                onTo={(v)   => { setPhDateTo(v);   setPhPage(1); }}
              />
              {hasPhFilters && (
                <button onClick={clearPhFilters} style={{ height: "40px", border: "1px solid #fecaca", borderRadius: "10px", padding: "0 14px", background: "#fef2f2", cursor: "pointer", color: "#ef4444", fontWeight: 600, fontSize: "12.5px", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
                  <LuX size={13} /> Clear
                </button>
              )}
            </div>

            {loading ? <LoadingState /> : appointments.length === 0 ? <EmptyState msg="No payment history found." /> : (
              <>
                <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #edf1ee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <Table className="table mb-0" style={{ borderCollapse: "collapse", minWidth: "1100px" }}>
                    <thead>
                      <tr>{["S.No", "Patient", "Dietitian", "Date & Slot", "Session", "Source", "Gross", "Commission", "Credited", "Approved By", "Approved At", "Action"].map((c) => <TH key={c}>{c}</TH>)}</tr>
                    </thead>
                    <tbody>
                      {appointments.map((a, i) => {
                        const pb = a.payment_breakdown || {};
                        return (
                          <TR key={a.id} index={i}>
                            <TD style={{ fontWeight: 700, color: "#6b7280", fontSize: "13px" }}>{(pagination.page - 1) * pagination.limit + i + 1}</TD>
                            <TD>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#111827" }}>{a.patient?.name || "—"}</p>
                              <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{a.patient?.phone || ""}</p>
                            </TD>
                            <TD><DietitianCell d={a.dietitian} /></TD>
                            <TD style={{ whiteSpace: "nowrap" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12.5px", color: "#374151", fontWeight: 600 }}>
                                <LuCalendarDays size={12} color="#6b7280" /> {formatDate(a.appointment_date)}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11.5px", color: "#9ca3af", marginTop: "2px" }}>
                                <LuClock size={11} /> {a.slot} · {a.duration}min
                              </div>
                            </TD>
                            <TD><SessionBadge type={a.session_type} /></TD>
                            <TD><SourceBadge source={pb.source} /></TD>
                            <TD style={{ fontWeight: 700, fontSize: "13px", color: "#111827" }}>₹{pb.gross_amount ?? a.fee}</TD>
                            <TD style={{ fontWeight: 600, fontSize: "13px", color: "#ef4444" }}>₹{pb.commission ?? "—"}</TD>
                            <TD><span style={{ fontWeight: 800, fontSize: "14px", color: "#16a34a" }}>₹{pb.amount_credited ?? "—"}</span></TD>
                            <TD style={{ fontSize: "12.5px", color: "#374151", fontWeight: 600 }}>{a.approved_by?.name || (a.approved_by?.id ? `#${a.approved_by.id}` : "—")}</TD>
                            <TD style={{ fontSize: "11.5px", color: "#6b7280", whiteSpace: "nowrap" }}>{formatDateTime(a.payment_approved_at)}</TD>
                            <TD>
                              <ActionBtn onClick={() => openDetail(a.id)} title="View Details" bg="#f5f3ff">
                                <FaEye style={{ color: "#7c3aed", fontSize: "13px" }} />
                              </ActionBtn>
                            </TD>
                          </TR>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
                <Pagination pagination={pagination} onPageChange={setPhPage} count={appointments.length} />
              </>
            )}
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          DETAIL MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="xl" centered scrollable>
        <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #1E8E3E 0%, #0f5c26 100%)", color: "#fff", borderBottom: "none", padding: "1.2rem 1.8rem" }}>
          <Modal.Title style={{ fontWeight: 800, fontSize: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LuCalendarDays size={18} color="#fff" />
            </div>
            Appointment Detail
            {detail && <span style={{ background: "rgba(255,255,255,0.18)", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px" }}>#{detail.id}</span>}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ background: "#f0f4f8", padding: "24px" }}>
          {loadingDetail ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <div className="spinner-border" style={{ color: "#1E8E3E", width: "2.5rem", height: "2.5rem" }} role="status" />
              <p style={{ marginTop: "16px", color: "#999" }}>Loading details...</p>
            </div>
          ) : detail ? (
            <div>
              {/* Status strip */}
              <div style={{ background: "#fff", borderRadius: "14px", padding: "16px 20px", marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <StatusBadge status={detail.status} />
                <PaymentBadge status={detail.payment_status} />
                <SessionBadge type={detail.session_type} />
                {detail.is_follow_up && <span style={{ background: "#fdf4ff", color: "#7c3aed", border: "1px solid #e9d5ff", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>Follow-up</span>}
                {detail.missed_type && <NoShowTypeBadge type={detail.missed_type} />}
                {detail.payment_approved_at && (
                  <span style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>✓ Payment Approved</span>
                )}
                <div style={{ marginLeft: "auto", fontSize: "12px", color: "#9ca3af" }}>Created: {formatDateTime(detail.created_at)}</div>
              </div>

              {/* Payment Approval card */}
              {detail.status === "completed" && detail.payment_status === "paid" && (() => {
                const isNoShow = detail.missed_type === "patient_no_show";
                const { commission, afterCommission, amountCredited } = calcBreakdown(detail.fee, isNoShow, commissionPct);
                const needsApproval = !detail.payment_approved_at;
                return (
                  <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: "16px" }}>
                    <SectionHeader title="Payment Approval" icon="💳" />
                    {isNoShow && (
                      <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "10px", padding: "10px 14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "16px" }}>⚠️</span>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#c2410c" }}>Patient No-Show</p>
                          <p style={{ margin: 0, fontSize: "12px", color: "#92400e" }}>Dietitian will receive 50% of post-commission earnings</p>
                        </div>
                      </div>
                    )}
                    <div style={{ border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden", marginBottom: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{ fontSize: "13px", color: "#6b7280" }}>Consultation Fee</span>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>₹{detail.fee}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderBottom: isNoShow ? "1px solid #e5e7eb" : "none" }}>
                        <span style={{ fontSize: "13px", color: "#6b7280" }}>MeriDiet Commission ({commissionPct}%)</span>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#ef4444" }}>−₹{commission}</span>
                      </div>
                      {isNoShow && (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #e5e7eb" }}>
                            <span style={{ fontSize: "13px", color: "#6b7280" }}>After Commission</span>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>₹{afterCommission}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px" }}>
                            <span style={{ fontSize: "13px", color: "#6b7280" }}>No-Show Deduction (50%)</span>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#ef4444" }}>−₹{afterCommission - amountCredited}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "12px 16px", marginBottom: "14px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#374151" }}>Amount to be Credited</span>
                      <span style={{ fontSize: "20px", fontWeight: 800, color: "#16a34a" }}>₹{amountCredited}</span>
                    </div>
                    {needsApproval ? (
                      <button onClick={() => setShowApproveModal(true)}
                        style={{ width: "100%", height: "44px", background: "linear-gradient(135deg, #1E8E3E 0%, #166C31 100%)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 12px rgba(30,142,62,0.3)" }}>
                        <MdPayment size={18} /> Approve &amp; Credit to Dietitian
                      </button>
                    ) : (
                      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "18px" }}>✓</div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#16a34a" }}>Payment Approved</p>
                          <p style={{ margin: 0, fontSize: "11.5px", color: "#6b7280" }}>
                            {formatDateTime(detail.payment_approved_at)}{detail.payment_approved_by ? ` · Admin #${detail.payment_approved_by}` : ""}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 2-col grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: "16px" }}>
                    <SectionHeader title="Appointment Info" icon="📋" />
                    <div className="row g-2">
                      <div className="col-6"><InfoRow label="Date" value={formatDate(detail.appointment_date)} /></div>
                      <div className="col-6"><InfoRow label="Time Slot" value={`${detail.slot} (${detail.duration} min)`} /></div>
                      <div className="col-6"><InfoRow label="Fee" value={`₹${detail.fee} ${detail.currency}`} /></div>
                      <div className="col-6"><InfoRow label="Follow-up Type" value={detail.follow_up_type || "—"} /></div>
                      {detail.parent_appointment_id && <div className="col-6"><InfoRow label="Parent Appointment" value={`#${detail.parent_appointment_id}`} /></div>}
                      {detail.payment_id && <div className="col-6"><InfoRow label="Payment ID" value={detail.payment_id} mono /></div>}
                      {detail.order_id && <div className="col-6"><InfoRow label="Order ID" value={detail.order_id} mono /></div>}
                    </div>
                    {detail.notes && (<><SectionHeader title="Patient Notes" icon="📝" /><div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "12px 14px", fontSize: "13px", color: "#374151", lineHeight: 1.6 }}>{detail.notes}</div></>)}
                    {detail.dietitian_notes && (<><SectionHeader title="Dietitian Notes" icon="🩺" /><div style={{ background: "#f0fdf4", borderRadius: "10px", padding: "12px 14px", fontSize: "13px", color: "#374151", lineHeight: 1.6, border: "1px solid #bbf7d0" }}>{detail.dietitian_notes}</div></>)}
                    {detail.missed_type && (
                      <><SectionHeader title="Missed Info" icon="⚠️" />
                      <div className="row g-2">
                        <div className="col-6"><InfoRow label="Missed Type" value={detail.missed_type?.replace(/_/g, " ")} /></div>
                        <div className="col-12"><InfoRow label="Missed Reason" value={detail.missed_reason} /></div>
                      </div></>
                    )}
                  </div>

                  {detail.session_type === "video_call" && (
                    <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: "16px" }}>
                      <SectionHeader title="Video Call" icon="🎥" />
                      <div className="row g-2">
                        <div className="col-6"><InfoRow label="Call Status" value={detail.video_call_status?.replace(/_/g, " ")} /></div>
                        <div className="col-6"><InfoRow label="Duration" value={formatDuration(detail.call_duration_seconds)} /></div>
                        <div className="col-6"><InfoRow label="Started At" value={formatDateTime(detail.call_started_at)} /></div>
                        <div className="col-6"><InfoRow label="Ended At" value={formatDateTime(detail.call_ended_at)} /></div>
                        <div className="col-6">
                          <div style={{ background: detail.call_tracking?.user_joined_at ? "#f8f9fa" : "#fef2f2", borderRadius: "10px", padding: "10px 14px" }}>
                            <small style={{ color: detail.call_tracking?.user_joined_at ? "#aaa" : "#ef4444", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", display: "block" }}>Patient Joined</small>
                            <p style={{ margin: "2px 0 0", fontWeight: 600, color: detail.call_tracking?.user_joined_at ? "#111827" : "#ef4444", fontSize: "13px" }}>
                              {detail.call_tracking?.user_joined_at ? formatDateTime(detail.call_tracking.user_joined_at) : "Never joined"}
                            </p>
                          </div>
                        </div>
                        <div className="col-6">
                          <div style={{ background: detail.call_tracking?.dietitian_joined_at ? "#f8f9fa" : "#fef2f2", borderRadius: "10px", padding: "10px 14px" }}>
                            <small style={{ color: detail.call_tracking?.dietitian_joined_at ? "#aaa" : "#ef4444", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", display: "block" }}>Dietitian Joined</small>
                            <p style={{ margin: "2px 0 0", fontWeight: 600, color: detail.call_tracking?.dietitian_joined_at ? "#111827" : "#ef4444", fontSize: "13px" }}>
                              {detail.call_tracking?.dietitian_joined_at ? formatDateTime(detail.call_tracking.dietitian_joined_at) : "Never joined"}
                            </p>
                          </div>
                        </div>
                        {detail.recording_url && (
                          <div className="col-12">
                            <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px" }}>
                              <small style={{ color: "#aaa", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Recording</small>
                              <a href={detail.recording_url} target="_blank" rel="noreferrer" style={{ fontSize: "13px", color: "#2563eb", fontWeight: 600 }}>View Recording</a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: "16px" }}>
                    <SectionHeader title="Patient" icon="👤" />
                    <div className="row g-2">
                      <div className="col-12"><InfoRow label="Name" value={detail.patient?.name} /></div>
                      <div className="col-12"><div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}><FaEnvelope size={12} color="#9ca3af" /><span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{detail.patient?.email || "—"}</span></div></div>
                      <div className="col-12"><div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}><FaPhone size={12} color="#9ca3af" /><span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{detail.patient?.phone || "—"}</span></div></div>
                    </div>
                  </div>

                  <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: "16px" }}>
                    <SectionHeader title="Dietitian" icon="🩺" />
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                      {detail.dietitian?.photo
                        ? <img src={detail.dietitian.photo} alt="" style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} />
                        : <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}><LuStethoscope size={22} color="#1E8E3E" /></div>
                      }
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#111827" }}>{detail.dietitian?.name || "—"}</p>
                        <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>#{detail.dietitian?.id}{detail.dietitian?.city ? ` · ${detail.dietitian.city}` : ""}{detail.dietitian?.state ? `, ${detail.dietitian.state}` : ""}</p>
                      </div>
                    </div>
                    <div className="row g-2">
                      <div className="col-12"><div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}><FaEnvelope size={12} color="#9ca3af" /><span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{detail.dietitian?.email || "—"}</span></div></div>
                      <div className="col-12"><div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}><FaPhone size={12} color="#9ca3af" /><span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{detail.dietitian?.phone || "—"}</span></div></div>
                    </div>
                  </div>

                  <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <SectionHeader title="Reviews" icon="⭐" />
                    <p style={{ margin: "0 0 6px", fontSize: "11.5px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Patient</p>
                    <StarRating value={detail.user_rating} />
                    {detail.user_review && <p style={{ margin: "6px 0 4px", fontSize: "13px", color: "#374151", fontStyle: "italic" }}>"{detail.user_review}"</p>}
                    {detail.user_reviewed_at && <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{formatDateTime(detail.user_reviewed_at)}</p>}
                    <div style={{ height: "1px", background: "#f3f4f6", margin: "14px 0" }} />
                    <p style={{ margin: "0 0 6px", fontSize: "11.5px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Dietitian</p>
                    <StarRating value={detail.dietitian_rating} />
                    {detail.dietitian_review && <p style={{ margin: "6px 0 4px", fontSize: "13px", color: "#374151", fontStyle: "italic" }}>"{detail.dietitian_review}"</p>}
                    {detail.dietitian_reviewed_at && <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{formatDateTime(detail.dietitian_reviewed_at)}</p>}
                  </div>
                </div>
              </div>

              {detail.follow_ups?.length > 0 && (
                <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginTop: "16px" }}>
                  <SectionHeader title="Follow-up Appointments" icon="🔁" />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {detail.follow_ups.map((f) => (
                      <div key={f.id} style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px", minWidth: "160px" }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "12px", color: "#111827" }}>#{f.id}</p>
                        <p style={{ margin: "3px 0 6px", fontSize: "12px", color: "#374151" }}>{formatDate(f.appointment_date)} · {f.slot}</p>
                        <StatusBadge status={f.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detail.reschedule_history?.length > 0 && (
                <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginTop: "16px" }}>
                  <SectionHeader title="Reschedule History" icon="🔄" />
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                      <thead>
                        <tr>{["#", "Rescheduled By", "Previous", "New", "Reason", "Date"].map((c) => <th key={c} style={{ padding: "10px 12px", background: "#f8f9fa", fontWeight: 700, color: "#6b7280", textAlign: "left", fontSize: "11px", textTransform: "uppercase", borderBottom: "1px solid #e5e7eb" }}>{c}</th>)}</tr>
                      </thead>
                      <tbody>
                        {detail.reschedule_history.map((r, i) => (
                          <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "10px 12px", fontWeight: 700, color: "#1E8E3E" }}>{i + 1}</td>
                            <td style={{ padding: "10px 12px", color: "#374151", fontWeight: 600 }}>{r.rescheduled_by_name || `#${r.rescheduled_by}`}</td>
                            <td style={{ padding: "10px 12px", color: "#6b7280" }}>{formatDate(r.previous_date)} {r.previous_slot}</td>
                            <td style={{ padding: "10px 12px", color: "#374151", fontWeight: 600 }}>{formatDate(r.new_date)} {r.new_slot}</td>
                            <td style={{ padding: "10px 12px", color: "#6b7280" }}>{r.reason || "—"}</td>
                            <td style={{ padding: "10px 12px", color: "#9ca3af", whiteSpace: "nowrap" }}>{formatDateTime(r.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </Modal.Body>

        <Modal.Footer style={{ background: "#fff", borderTop: "1px solid #e5e7eb", padding: "14px 24px" }}>
          <Button variant="outline-secondary" onClick={() => setShowDetail(false)} style={{ borderRadius: "10px", fontWeight: 600 }}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          APPROVE PAYMENT MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal show={showApproveModal} onHide={() => !approvingPayment && setShowApproveModal(false)} centered size="sm">
        <Modal.Header closeButton={!approvingPayment} style={{ borderBottom: "1px solid #f3f4f6", padding: "16px 20px" }}>
          <Modal.Title style={{ fontSize: "14px", fontWeight: 800, color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
            <MdPayment size={18} color="#1E8E3E" /> Approve Payment · #{detail?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "20px" }}>
          {detail && (() => {
            const isNoShow = detail.missed_type === "patient_no_show";
            const { commission, afterCommission, amountCredited } = calcBreakdown(detail.fee, isNoShow, commissionPct);
            return (
              <>
                <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "14px", marginBottom: "14px", display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", alignItems: "baseline" }}>
                  <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Patient</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{detail.patient?.name || "—"}</span>
                  <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Dietitian</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{detail.dietitian?.name || "—"}</span>
                  <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Date</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{formatDate(detail.appointment_date)} · {detail.slot}</span>
                </div>
                {isNoShow && (
                  <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "8px", padding: "10px 12px", marginBottom: "14px", fontSize: "12px", color: "#c2410c", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                    ⚠️ Patient No-Show — Dietitian receives 50% earnings
                  </div>
                )}
                <div style={{ border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #e5e7eb" }}>
                    <span style={{ fontSize: "12.5px", color: "#6b7280" }}>Consultation Fee</span>
                    <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#111827" }}>₹{detail.fee}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #e5e7eb" }}>
                    <span style={{ fontSize: "12.5px", color: "#6b7280" }}>Commission ({commissionPct}%)</span>
                    <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#ef4444" }}>−₹{commission}</span>
                  </div>
                  {isNoShow && (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{ fontSize: "12.5px", color: "#6b7280" }}>After Commission</span>
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#374151" }}>₹{afterCommission}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{ fontSize: "12.5px", color: "#6b7280" }}>No-Show (50%)</span>
                        <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#ef4444" }}>−₹{afterCommission - amountCredited}</span>
                      </div>
                    </>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", background: "#f0fdf4" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#374151" }}>Credited to Dietitian</span>
                    <span style={{ fontSize: "15px", fontWeight: 800, color: "#16a34a" }}>₹{amountCredited}</span>
                  </div>
                </div>
              </>
            );
          })()}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "1px solid #f3f4f6", padding: "12px 20px", gap: "8px" }}>
          <Button variant="outline-secondary" onClick={() => setShowApproveModal(false)} disabled={approvingPayment} style={{ borderRadius: "8px", fontWeight: 600, fontSize: "13px" }}>Cancel</Button>
          <Button onClick={handleApprove} disabled={approvingPayment}
            style={{ background: "linear-gradient(135deg, #1E8E3E 0%, #166C31 100%)", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
            {approvingPayment
              ? <><span className="spinner-border spinner-border-sm" role="status" /> Approving...</>
              : <><MdPayment size={15} /> Approve &amp; Credit</>}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MARK NO-SHOW MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal show={showMarkNoShowModal} onHide={() => !markingNoShow && setShowMarkNoShowModal(false)} centered size="sm">
        <Modal.Header closeButton={!markingNoShow} style={{ borderBottom: "1px solid #f3f4f6", padding: "16px 20px" }}>
          <Modal.Title style={{ fontSize: "14px", fontWeight: 800, color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaBan size={15} color="#ef4444" /> Mark No-Show · #{markNoShowAppt?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "20px" }}>
          {markNoShowAppt && (
            <>
              <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "14px", marginBottom: "16px", display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", alignItems: "baseline" }}>
                <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Patient</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{markNoShowAppt.patient?.name || "—"}</span>
                <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Dietitian</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{markNoShowAppt.dietitian?.name || "—"}</span>
                <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Date</span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{formatDate(markNoShowAppt.appointment_date)} · {markNoShowAppt.slot}</span>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#374151", display: "block", marginBottom: "8px" }}>Who didn't show? *</label>
                {[
                  { value: "patient_no_show",   label: "Patient didn't join" },
                  { value: "dietitian_no_show",  label: "Dietitian didn't join" },
                  { value: "both_no_show",       label: "Neither joined" },
                ].map((opt) => (
                  <label key={opt.value}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "8px", border: `1.5px solid ${missedType === opt.value ? "#ef4444" : "#e5e7eb"}`, background: missedType === opt.value ? "#fef2f2" : "#fff", cursor: "pointer", marginBottom: "6px", fontSize: "13px", fontWeight: missedType === opt.value ? 700 : 500, color: missedType === opt.value ? "#ef4444" : "#374151" }}>
                    <input type="radio" name="missed_type" value={opt.value} checked={missedType === opt.value} onChange={() => setMissedType(opt.value)} style={{ accentColor: "#ef4444" }} />
                    {opt.label}
                  </label>
                ))}
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#374151", display: "block", marginBottom: "6px" }}>Reason / Notes</label>
                <textarea value={missedReason} onChange={(e) => setMissedReason(e.target.value)} placeholder="e.g. Patient called and said they forgot..." rows={3}
                  style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", outline: "none", resize: "vertical", color: "#374151" }} />
              </div>
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", color: "#92400e" }}>
                ℹ️ Recording the no-show does not move money yet. A second approval step will handle the payment action.
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "1px solid #f3f4f6", padding: "12px 20px", gap: "8px" }}>
          <Button variant="outline-secondary" onClick={() => setShowMarkNoShowModal(false)} disabled={markingNoShow} style={{ borderRadius: "8px", fontWeight: 600, fontSize: "13px" }}>Cancel</Button>
          <Button onClick={handleMarkNoShow} disabled={markingNoShow || !missedType}
            style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
            {markingNoShow
              ? <><span className="spinner-border spinner-border-sm" role="status" /> Recording...</>
              : <><FaBan size={13} /> Record No-Show</>}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          APPROVE NO-SHOW MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal show={showApproveNoShowModal} onHide={() => !approvingNoShow && setShowApproveNoShowModal(false)} centered size="sm">
        <Modal.Header closeButton={!approvingNoShow} style={{ borderBottom: "1px solid #f3f4f6", padding: "16px 20px" }}>
          <Modal.Title style={{ fontSize: "14px", fontWeight: 800, color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaCheck size={13} color="#7c3aed" /> Approve No-Show · #{approveNoShowAppt?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "20px" }}>
          {approveNoShowAppt && (() => {
            const a = approveNoShowAppt;
            const commission     = Math.round((a.fee || 0) * commissionPct / 100);
            const afterCommission = (a.fee || 0) - commission;
            const credited       = Math.round(afterCommission * 0.5);
            return (
              <>
                <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "14px", marginBottom: "14px", display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", alignItems: "baseline" }}>
                  <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Patient</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{a.patient?.name || "—"}</span>
                  <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Dietitian</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{a.dietitian?.name || "—"}</span>
                  <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Date</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{formatDate(a.appointment_date)} · {a.slot}</span>
                </div>
                <div style={{ marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 600 }}>No-Show Type:</span>
                  <NoShowTypeBadge type={a.missed_type} />
                </div>
                {a.missed_type === "patient_no_show" && (
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden", marginBottom: "14px" }}>
                    {[
                      { label: "Consultation Fee",    value: `₹${a.fee}`,         color: "#111827" },
                      { label: `Commission (${commissionPct}%)`, value: `−₹${commission}`, color: "#ef4444" },
                      { label: "After Commission",    value: `₹${afterCommission}`, color: "#374151" },
                      { label: "No-Show (50%)",       value: `−₹${afterCommission - credited}`, color: "#ef4444" },
                    ].map((r, i, arr) => (
                      <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: i < arr.length - 1 ? "1px solid #e5e7eb" : "none" }}>
                        <span style={{ fontSize: "12.5px", color: "#6b7280" }}>{r.label}</span>
                        <span style={{ fontSize: "12.5px", fontWeight: 700, color: r.color }}>{r.value}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", background: "#f0fdf4" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#374151" }}>Credited to Dietitian</span>
                      <span style={{ fontSize: "15px", fontWeight: 800, color: "#16a34a" }}>₹{credited}</span>
                    </div>
                  </div>
                )}
                {a.missed_type === "dietitian_no_show" && (
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden", marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid #e5e7eb", background: "#fef2f2" }}>
                      <span style={{ fontSize: "12.5px", color: "#ef4444", fontWeight: 700 }}>Full Refund to Patient</span>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#ef4444" }}>₹{a.fee}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", background: "#fff7ed" }}>
                      <span style={{ fontSize: "12.5px", color: "#c2410c", fontWeight: 700 }}>Dietitian Penalty</span>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#c2410c" }}>₹{penaltyAmount}</span>
                    </div>
                  </div>
                )}
                {a.missed_type === "both_no_show" && (
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden", marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid #e5e7eb", background: "#f8f9fa" }}>
                      <span style={{ fontSize: "12.5px", color: "#6b7280", fontWeight: 600 }}>Refund to Patient</span>
                      <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#6b7280" }}>None</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", background: "#fff7ed" }}>
                      <span style={{ fontSize: "12.5px", color: "#c2410c", fontWeight: 700 }}>Dietitian Penalty</span>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#c2410c" }}>₹{penaltyAmount}</span>
                    </div>
                  </div>
                )}
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", color: "#991b1b", fontWeight: 600 }}>
                  ⚠️ This action is irreversible. Money moves immediately upon confirmation.
                </div>
              </>
            );
          })()}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "1px solid #f3f4f6", padding: "12px 20px", gap: "8px" }}>
          <Button variant="outline-secondary" onClick={() => setShowApproveNoShowModal(false)} disabled={approvingNoShow} style={{ borderRadius: "8px", fontWeight: 600, fontSize: "13px" }}>Cancel</Button>
          <Button onClick={handleApproveNoShow} disabled={approvingNoShow}
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
            {approvingNoShow
              ? <><span className="spinner-border spinner-border-sm" role="status" /> Approving...</>
              : <><FaCheck size={12} /> Confirm &amp; Approve</>}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
