import { useState, useEffect, useRef } from "react";
import { Table, Modal, Button } from "react-bootstrap";
import {
  FaEye, FaSearch, FaTimes, FaVideo, FaMapMarkerAlt,
  FaPhone, FaEnvelope, FaFilter, FaBan, FaCheck,
} from "react-icons/fa";
import {
  LuCalendarDays, LuClock, LuStethoscope, LuChevronDown, LuX, LuInfo,
} from "react-icons/lu";
import GlobalPagination from "../common/GlobalPagination";
import offlineAppointmentService from "../../services/offlineAppointmentService";
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

// ── Styles ────────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  pending:   { bg: "#fffbeb", color: "#d97706", border: "#fde68a", dot: "#d97706" },
  confirmed: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", dot: "#2563eb" },
  completed: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", dot: "#16a34a" },
  cancelled: { bg: "#fef2f2", color: "#ef4444", border: "#fecaca", dot: "#ef4444" },
  missed:    { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe", dot: "#7c3aed" },
};

const OFFLINE_MISSED_TYPES = {
  technical_issue: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", label: "Technical Issue" },
  network_issue:   { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", label: "Network Issue" },
  other:           { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb", label: "Other" },
};

const TECHNICAL_TYPES = ["technical_issue", "network_issue", "other"];

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
function SessionBadge({ type }) {
  const v = type === "video_call";
  return (
    <span style={{ background: v ? "#eff6ff" : "#f0fdf4", color: v ? "#2563eb" : "#16a34a", border: `1px solid ${v ? "#bfdbfe" : "#bbf7d0"}`, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
      {v ? <FaVideo size={10} /> : <FaMapMarkerAlt size={10} />}
      {v ? "Video" : "In Person"}
    </span>
  );
}
function PaymentCollectedBadge({ collected, method }) {
  return (
    <div>
      <span style={{ background: collected ? "#f0fdf4" : "#fff7ed", color: collected ? "#16a34a" : "#c2410c", border: `1px solid ${collected ? "#bbf7d0" : "#fed7aa"}`, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>
        {collected ? "Collected" : "Pending"}
      </span>
      {method && (
        <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "3px", textTransform: "capitalize" }}>{method}</div>
      )}
    </div>
  );
}
function MissedTypeBadge({ type }) {
  const s = OFFLINE_MISSED_TYPES[type] || { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb", label: type || "—" };
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

function InfoRow({ label, value }) {
  return (
    <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px" }}>
      <small style={{ color: "#aaa", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block" }}>{label}</small>
      <p style={{ margin: "2px 0 0", fontWeight: 600, color: "#111827", fontSize: "13px" }}>
        {value ?? <span style={{ color: "#9ca3af" }}>—</span>}
      </p>
    </div>
  );
}

function ModalSectionHeader({ title, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "20px 0 12px" }}>
      <span style={{ fontSize: "15px" }}>{icon}</span>
      <span style={{ fontWeight: 800, fontSize: "11.5px", color: "#374151", textTransform: "uppercase", letterSpacing: "0.8px" }}>{title}</span>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, #e5e7eb, transparent)", marginLeft: "4px" }} />
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
        <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>#{d?.id}</p>
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

function PaginationBar({ pagination, onPageChange, count }) {
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
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏥</div>
      <h5 style={{ fontWeight: 700, color: "#333", marginBottom: "8px" }}>No Records Found</h5>
      <p style={{ fontSize: "14px", color: "#999" }}>{msg || "Nothing to show here."}</p>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────
const VIEW_TABS = [
  { value: "all",    label: "All Offline Appointments", color: "#1E8E3E" },
  { value: "missed", label: "Missed / Pending Closure",  color: "#7c3aed" },
];

const STATUS_OPTIONS = [
  { value: "",          label: "All Statuses" },
  { value: "pending",   label: "Pending",   dot: "#d97706" },
  { value: "confirmed", label: "Confirmed", dot: "#2563eb" },
  { value: "completed", label: "Completed", dot: "#16a34a" },
  { value: "cancelled", label: "Cancelled", dot: "#ef4444" },
  { value: "missed",    label: "Missed",    dot: "#7c3aed" },
];

const SESSION_OPTIONS = [
  { value: "",           label: "All Sessions" },
  { value: "in_person",  label: "In Person" },
  { value: "video_call", label: "Video Call" },
];

const PAYMENT_OPTIONS = [
  { value: "",      label: "All Payment" },
  { value: "true",  label: "Collected" },
  { value: "false", label: "Pending" },
];

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function OfflineAppointmentTable() {
  const [activeView, setActiveView] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);

  // All tab filters
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const allTimer = useRef(null);

  // Missed tab filters
  const [missedPage, setMissedPage] = useState(1);
  const [missedSearch, setMissedSearch] = useState("");
  const [missedSearchInput, setMissedSearchInput] = useState("");
  const missedTimer = useRef(null);

  // Modals
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [showMarkNoShowModal, setShowMarkNoShowModal] = useState(false);
  const [markNoShowAppt, setMarkNoShowAppt] = useState(null);
  const [missedType, setMissedType] = useState("technical_issue");
  const [missedReason, setMissedReason] = useState("");
  const [markingNoShow, setMarkingNoShow] = useState(false);

  const [showApproveNoShowModal, setShowApproveNoShowModal] = useState(false);
  const [approveNoShowAppt, setApproveNoShowAppt] = useState(null);
  const [approvingNoShow, setApprovingNoShow] = useState(false);

  useEffect(() => {
    setAppointments([]);
    setPagination({ page: 1, limit: 20, total: 0, pages: 1 });
  }, [activeView]);

  // ── Fetch: All ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeView !== "all") return;
    setLoading(true);
    const p = new URLSearchParams({ page: currentPage, limit: 20 });
    if (statusFilter)  p.append("status", statusFilter);
    if (sessionFilter) p.append("session_type", sessionFilter);
    if (paymentFilter) p.append("payment_collected", paymentFilter);
    if (dateFrom)      p.append("date_from", dateFrom);
    if (dateTo)        p.append("date_to", dateTo);
    if (search)        p.append("search", search);
    offlineAppointmentService.list(p.toString())
      .then((res) => {
        const d = res?.data?.data || {};
        setAppointments(d.appointments || []);
        setPagination(d.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to load offline appointments."))
      .finally(() => setLoading(false));
  }, [activeView, currentPage, statusFilter, sessionFilter, paymentFilter, dateFrom, dateTo, search, refreshKey]);

  // ── Fetch: Missed ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeView !== "missed") return;
    setLoading(true);
    const p = new URLSearchParams({ page: missedPage, limit: 20, status: "missed" });
    if (missedSearch) p.append("search", missedSearch);
    offlineAppointmentService.list(p.toString())
      .then((res) => {
        const d = res?.data?.data || {};
        setAppointments(d.appointments || []);
        setPagination(d.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to load missed appointments."))
      .finally(() => setLoading(false));
  }, [activeView, missedPage, missedSearch, refreshKey]);

  // ── Detail modal ────────────────────────────────────────────────────────────
  const openDetail = (id) => {
    setShowDetail(true);
    setDetail(null);
    setLoadingDetail(true);
    offlineAppointmentService.get(id)
      .then((res) => setDetail(res?.data?.data || null))
      .catch((err) => { toast.error(err?.response?.data?.message || "Failed to load appointment."); setShowDetail(false); })
      .finally(() => setLoadingDetail(false));
  };

  // ── Mark No-Show ────────────────────────────────────────────────────────────
  const handleMarkNoShow = () => {
    if (!markNoShowAppt || !missedType) return;
    setMarkingNoShow(true);
    offlineAppointmentService.markNoShow(markNoShowAppt.id, { missed_type: missedType, missed_reason: missedReason })
      .then(() => {
        toast.success("No-show recorded. Appointment moved to Missed / Pending Closure.");
        setShowMarkNoShowModal(false);
        setMissedType("technical_issue");
        setMissedReason("");
        setRefreshKey((k) => k + 1);
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to mark no-show."))
      .finally(() => setMarkingNoShow(false));
  };

  // ── Approve No-Show (technical close — no financial action) ─────────────────
  const handleApproveNoShow = () => {
    if (!approveNoShowAppt) return;
    setApprovingNoShow(true);
    offlineAppointmentService.approveNoShow(approveNoShowAppt.id)
      .then(() => {
        toast.success("Appointment closed. No financial action taken.");
        setShowApproveNoShowModal(false);
        setRefreshKey((k) => k + 1);
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to close appointment."))
      .finally(() => setApprovingNoShow(false));
  };

  // ── Debounced search ────────────────────────────────────────────────────────
  const handleAllSearch = (val) => {
    setSearchInput(val);
    clearTimeout(allTimer.current);
    allTimer.current = setTimeout(() => { setSearch(val); setCurrentPage(1); }, 500);
  };
  const handleMissedSearch = (val) => {
    setMissedSearchInput(val);
    clearTimeout(missedTimer.current);
    missedTimer.current = setTimeout(() => { setMissedSearch(val); setMissedPage(1); }, 500);
  };

  const clearAllFilters = () => {
    setStatusFilter(""); setSessionFilter(""); setPaymentFilter("");
    setDateFrom(""); setDateTo(""); setSearch(""); setSearchInput(""); setCurrentPage(1);
  };
  const hasAllFilters = statusFilter || sessionFilter || paymentFilter || dateFrom || dateTo || search;

  const DateRange = ({ from, to, onFrom, onTo }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <input type="date" value={from} onChange={(e) => onFrom(e.target.value)}
        style={{ height: "40px", border: "1px solid #e5e5e5", borderRadius: "10px", padding: "0 10px", fontSize: "12.5px", color: "#374151", outline: "none" }} />
      <span style={{ color: "#9ca3af", fontSize: "12px" }}>to</span>
      <input type="date" value={to} onChange={(e) => onTo(e.target.value)}
        style={{ height: "40px", border: "1px solid #e5e5e5", borderRadius: "10px", padding: "0 10px", fontSize: "12.5px", color: "#374151", outline: "none" }} />
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div>
      {/* Info banner */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "12px 18px", marginBottom: "18px", display: "flex", alignItems: "flex-start", gap: "12px", fontSize: "13px", color: "#1d4ed8" }}>
        <LuInfo size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
        <div>
          <strong>Offline / White-Label Appointments</strong> — These are walk-in, phone, or existing-patient appointments created directly by the dietitian. Admin role is <strong>read-only for payment</strong>. No platform commission is collected and no Razorpay is involved. Payment is managed entirely between the dietitian and their patient.
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid #f0f0f0", marginBottom: "20px", gap: "2px", flexWrap: "wrap" }}>
          {VIEW_TABS.map((tab) => {
            const active = activeView === tab.value;
            return (
              <button key={tab.value} onClick={() => setActiveView(tab.value)}
                style={{ padding: "10px 24px", border: "none", background: "none", cursor: "pointer", fontWeight: active ? 700 : 500, fontSize: "13.5px", color: active ? tab.color : "#6b7280", borderBottom: `2.5px solid ${active ? tab.color : "transparent"}`, marginBottom: "-2px", transition: "all 0.15s", whiteSpace: "nowrap" }}>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            VIEW 1 — ALL OFFLINE
        ══════════════════════════════════════════════════════════════════ */}
        {activeView === "all" && (
          <>
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
              <SearchBar value={searchInput} onChange={handleAllSearch} placeholder="Search name, phone, email..." />
              <FilterDropdown value={statusFilter} onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }} options={STATUS_OPTIONS} placeholder="Status" />
              <FilterDropdown value={sessionFilter} onChange={(v) => { setSessionFilter(v); setCurrentPage(1); }} options={SESSION_OPTIONS} placeholder="Session" />
              <FilterDropdown value={paymentFilter} onChange={(v) => { setPaymentFilter(v); setCurrentPage(1); }} options={PAYMENT_OPTIONS} placeholder="Payment" accent="#16a34a" />
              <DateRange
                from={dateFrom} to={dateTo}
                onFrom={(v) => { setDateFrom(v); setCurrentPage(1); }}
                onTo={(v) => { setDateTo(v); setCurrentPage(1); }}
              />
              {hasAllFilters && (
                <button onClick={clearAllFilters} style={{ height: "40px", border: "1px solid #fecaca", borderRadius: "10px", padding: "0 14px", background: "#fef2f2", cursor: "pointer", color: "#ef4444", fontWeight: 600, fontSize: "12.5px", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
                  <LuX size={13} /> Clear
                </button>
              )}
            </div>

            {loading ? <LoadingState /> : appointments.length === 0 ? (
              <EmptyState msg={hasAllFilters ? "No appointments match the current filters." : "No offline appointments found."} />
            ) : (
              <>
                <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #edf1ee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <Table className="table mb-0" style={{ borderCollapse: "collapse", minWidth: "1100px" }}>
                    <thead>
                      <tr>
                        {["S.No", "Patient", "Dietitian", "Date & Slot", "Session", "Status", "Payment", "Fee", "Created", "Actions"].map((c) => <TH key={c}>{c}</TH>)}
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((a, i) => (
                        <TR key={a.id} index={i}>
                          <TD style={{ fontWeight: 700, color: "#1E8E3E", fontSize: "13px" }}>{(pagination.page - 1) * pagination.limit + i + 1}</TD>
                          <TD>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#111827" }}>{a.patient?.name || "—"}</p>
                            <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{a.patient?.phone || a.patient?.email || ""}</p>
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
                          <TD><PaymentCollectedBadge collected={a.payment_collected} method={a.payment_method} /></TD>
                          <TD style={{ fontWeight: 700, fontSize: "13px", color: "#111827" }}>
                            {a.fee > 0 ? `₹${a.fee}` : <span style={{ color: "#9ca3af" }}>Free</span>}
                          </TD>
                          <TD style={{ fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap" }}>{formatDate(a.created_at)}</TD>
                          <TD>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <ActionBtn onClick={() => openDetail(a.id)} title="View Details" bg="#eff6ff">
                                <FaEye style={{ color: "#3b82f6", fontSize: "13px" }} />
                              </ActionBtn>
                              {a.status === "confirmed" && (
                                <ActionBtn
                                  onClick={() => { setMarkNoShowAppt(a); setMissedType("technical_issue"); setMissedReason(""); setShowMarkNoShowModal(true); }}
                                  title="Mark No-Show"
                                  bg="#fef2f2">
                                  <FaBan style={{ color: "#ef4444", fontSize: "13px" }} />
                                </ActionBtn>
                              )}
                            </div>
                          </TD>
                        </TR>
                      ))}
                    </tbody>
                  </Table>
                </div>
                <PaginationBar pagination={pagination} onPageChange={setCurrentPage} count={appointments.length} />
              </>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW 2 — MISSED / PENDING CLOSURE
        ══════════════════════════════════════════════════════════════════ */}
        {activeView === "missed" && (
          <>
            <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: "10px", padding: "10px 16px", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "#5b21b6" }}>
              <FaBan size={14} color="#7c3aed" style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>
                Missed offline appointments. For <strong>Technical Issue / Network Issue / Other</strong> types, use the close button — <strong>no financial action will be taken</strong>. Do not use for patient or dietitian no-show types as that would incorrectly affect platform wallets.
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "center", flexWrap: "wrap" }}>
              <SearchBar value={missedSearchInput} onChange={handleMissedSearch} placeholder="Search name, phone, email..." />
            </div>

            {loading ? <LoadingState /> : appointments.length === 0 ? (
              <EmptyState msg="No missed offline appointments." />
            ) : (
              <>
                <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #edf1ee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <Table className="table mb-0" style={{ borderCollapse: "collapse", minWidth: "900px" }}>
                    <thead>
                      <tr>
                        {["S.No", "Patient", "Dietitian", "Date & Slot", "Missed Type", "Payment", "Fee", "Actions"].map((c) => <TH key={c}>{c}</TH>)}
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((a, i) => {
                        const canClose = TECHNICAL_TYPES.includes(a.missed_type);
                        return (
                          <TR key={a.id} index={i}>
                            <TD style={{ fontWeight: 700, color: "#7c3aed", fontSize: "13px" }}>{(pagination.page - 1) * pagination.limit + i + 1}</TD>
                            <TD>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#111827" }}>{a.patient?.name || "—"}</p>
                              <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{a.patient?.phone || a.patient?.email || ""}</p>
                            </TD>
                            <TD><DietitianCell d={a.dietitian} /></TD>
                            <TD style={{ whiteSpace: "nowrap" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12.5px", color: "#374151", fontWeight: 600 }}>
                                <LuCalendarDays size={12} color="#7c3aed" /> {formatDate(a.appointment_date)}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11.5px", color: "#9ca3af", marginTop: "2px" }}>
                                <LuClock size={11} /> {a.slot} · {a.duration}min
                              </div>
                            </TD>
                            <TD>
                              <MissedTypeBadge type={a.missed_type} />
                              {a.missed_reason && (
                                <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "3px", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.missed_reason}</div>
                              )}
                            </TD>
                            <TD><PaymentCollectedBadge collected={a.payment_collected} method={a.payment_method} /></TD>
                            <TD style={{ fontWeight: 700, fontSize: "13px", color: "#111827" }}>
                              {a.fee > 0 ? `₹${a.fee}` : <span style={{ color: "#9ca3af" }}>Free</span>}
                            </TD>
                            <TD>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <ActionBtn onClick={() => openDetail(a.id)} title="View Details" bg="#eff6ff">
                                  <FaEye style={{ color: "#3b82f6", fontSize: "13px" }} />
                                </ActionBtn>
                                {canClose && (
                                  <ActionBtn
                                    onClick={() => { setApproveNoShowAppt(a); setShowApproveNoShowModal(true); }}
                                    title="Close Appointment (No Financial Action)"
                                    bg="#f5f3ff">
                                    <FaCheck style={{ color: "#7c3aed", fontSize: "12px" }} />
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
                <PaginationBar pagination={pagination} onPageChange={setMissedPage} count={appointments.length} />
              </>
            )}
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          DETAIL MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="xl" centered scrollable>
        <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", color: "#fff", borderBottom: "none", padding: "1.2rem 1.8rem" }}>
          <Modal.Title style={{ fontWeight: 800, fontSize: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LuCalendarDays size={18} color="#fff" />
            </div>
            Offline Appointment Detail
            {detail && <span style={{ background: "rgba(255,255,255,0.18)", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px" }}>#{detail.id}</span>}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ background: "#f0f4f8", padding: "24px" }}>
          {loadingDetail ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <div className="spinner-border" style={{ color: "#2563eb", width: "2.5rem", height: "2.5rem" }} role="status" />
              <p style={{ marginTop: "16px", color: "#999" }}>Loading details...</p>
            </div>
          ) : detail ? (
            <div>
              {/* Status strip */}
              <div style={{ background: "#fff", borderRadius: "14px", padding: "16px 20px", marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <StatusBadge status={detail.status} />
                <SessionBadge type={detail.session_type} />
                <span style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>
                  🏥 Offline · Dietitian Created
                </span>
                {detail.missed_type && <MissedTypeBadge type={detail.missed_type} />}
                <div style={{ marginLeft: "auto", fontSize: "12px", color: "#9ca3af" }}>
                  Created: {formatDateTime(detail.created_at)}
                </div>
              </div>

              {/* Offline info card */}
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "14px 18px", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "12px", fontSize: "13px", color: "#1d4ed8" }}>
                <LuInfo size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
                <div>
                  <strong>No Platform Payment Involvement</strong> — Payment is managed entirely by the dietitian (cash / UPI / card / other). No commission was deducted. No Razorpay transaction exists. Admin cannot approve or refund payment for offline appointments.
                </div>
              </div>

              {/* 2-column grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Left column */}
                <div>
                  {/* Appointment info */}
                  <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: "16px" }}>
                    <ModalSectionHeader title="Appointment Info" icon="📋" />
                    <div className="row g-2">
                      <div className="col-6"><InfoRow label="Date" value={formatDate(detail.appointment_date)} /></div>
                      <div className="col-6"><InfoRow label="Time Slot" value={`${detail.slot} (${detail.duration} min)`} /></div>
                      <div className="col-6"><InfoRow label="Session Type" value={detail.session_type?.replace(/_/g, " ")} /></div>
                      <div className="col-6"><InfoRow label="Source" value="Dietitian (Offline)" /></div>
                    </div>
                    {detail.notes && (
                      <>
                        <ModalSectionHeader title="Notes" icon="📝" />
                        <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "12px 14px", fontSize: "13px", color: "#374151", lineHeight: 1.6 }}>{detail.notes}</div>
                      </>
                    )}
                    {detail.missed_type && (
                      <>
                        <ModalSectionHeader title="Missed Info" icon="⚠️" />
                        <div className="row g-2">
                          <div className="col-6">
                            <InfoRow label="Missed Type" value={OFFLINE_MISSED_TYPES[detail.missed_type]?.label || detail.missed_type.replace(/_/g, " ")} />
                          </div>
                          <div className="col-12"><InfoRow label="Reason" value={detail.missed_reason} /></div>
                        </div>
                        {TECHNICAL_TYPES.includes(detail.missed_type) && (
                          <button
                            onClick={() => { setApproveNoShowAppt(detail); setShowDetail(false); setShowApproveNoShowModal(true); }}
                            style={{ width: "100%", height: "42px", background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "12px" }}>
                            <FaCheck size={13} /> Close This Appointment (No Financial Action)
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Payment info */}
                  <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <ModalSectionHeader title="Payment (Offline)" icon="💵" />
                    <div className="row g-2">
                      <div className="col-6"><InfoRow label="Fee" value={detail.fee > 0 ? `₹${detail.fee}` : "Free"} /></div>
                      <div className="col-6"><InfoRow label="Method" value={detail.payment_method ? detail.payment_method.toUpperCase() : "—"} /></div>
                      <div className="col-12">
                        <div style={{ background: detail.payment_collected ? "#f0fdf4" : "#fff7ed", border: `1px solid ${detail.payment_collected ? "#bbf7d0" : "#fed7aa"}`, borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "18px" }}>{detail.payment_collected ? "✅" : "⏳"}</span>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: detail.payment_collected ? "#16a34a" : "#c2410c" }}>
                              {detail.payment_collected ? "Payment Collected by Dietitian" : "Payment Not Yet Collected"}
                            </p>
                            <p style={{ margin: 0, fontSize: "11.5px", color: "#6b7280" }}>
                              {detail.payment_collected
                                ? "Dietitian has received the fee directly from the patient."
                                : "Patient has not yet paid. Dietitian manages collection."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ background: "#f8f9fa", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "10px 14px", marginTop: "10px", fontSize: "12px", color: "#6b7280", display: "flex", alignItems: "center", gap: "8px" }}>
                      <LuInfo size={13} />
                      No platform commission collected. Admin cannot approve or refund this payment.
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div>
                  {/* Patient info */}
                  <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: "16px" }}>
                    <ModalSectionHeader title="Patient" icon="👤" />
                    <div className="row g-2">
                      <div className="col-12"><InfoRow label="Name" value={detail.patient?.name} /></div>
                      {detail.patient?.email && (
                        <div className="col-12">
                          <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <FaEnvelope size={12} color="#9ca3af" />
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{detail.patient.email}</span>
                          </div>
                        </div>
                      )}
                      {detail.patient?.phone && (
                        <div className="col-12">
                          <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <FaPhone size={12} color="#9ca3af" />
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{detail.patient.phone}</span>
                          </div>
                        </div>
                      )}
                      <div className="col-12">
                        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "8px 14px", fontSize: "12px", color: "#1d4ed8", display: "flex", alignItems: "center", gap: "6px" }}>
                          <LuInfo size={12} /> No platform account — offline / walk-in patient
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dietitian info */}
                  <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <ModalSectionHeader title="Dietitian" icon="🩺" />
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                      {detail.dietitian?.photo
                        ? <img src={detail.dietitian.photo} alt="" style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} />
                        : <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}><LuStethoscope size={22} color="#1E8E3E" /></div>
                      }
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#111827" }}>{detail.dietitian?.name || "—"}</p>
                        <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>
                          #{detail.dietitian?.id}{detail.dietitian?.city ? ` · ${detail.dietitian.city}` : ""}{detail.dietitian?.state ? `, ${detail.dietitian.state}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="row g-2">
                      {detail.dietitian?.email && (
                        <div className="col-12">
                          <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <FaEnvelope size={12} color="#9ca3af" />
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{detail.dietitian.email}</span>
                          </div>
                        </div>
                      )}
                      {detail.dietitian?.phone && (
                        <div className="col-12">
                          <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <FaPhone size={12} color="#9ca3af" />
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{detail.dietitian.phone}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reschedule History */}
              {detail.reschedule_history?.length > 0 && (
                <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginTop: "16px" }}>
                  <ModalSectionHeader title="Reschedule History" icon="🔄" />
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                      <thead>
                        <tr>
                          {["#", "By", "Previous", "New", "Reason", "Date"].map((c) => (
                            <th key={c} style={{ padding: "10px 12px", background: "#f8f9fa", fontWeight: 700, color: "#6b7280", textAlign: "left", fontSize: "11px", textTransform: "uppercase", borderBottom: "1px solid #e5e7eb" }}>{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {detail.reschedule_history.map((r, i) => (
                          <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "10px 12px", fontWeight: 700, color: "#2563eb" }}>{i + 1}</td>
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
          {detail?.status === "confirmed" && (
            <Button
              onClick={() => {
                setMarkNoShowAppt(detail);
                setMissedType("technical_issue");
                setMissedReason("");
                setShowDetail(false);
                setShowMarkNoShowModal(true);
              }}
              style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", borderRadius: "10px", fontWeight: 600, fontSize: "13px", marginRight: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
              <FaBan size={12} /> Mark No-Show
            </Button>
          )}
          <Button variant="outline-secondary" onClick={() => setShowDetail(false)} style={{ borderRadius: "10px", fontWeight: 600 }}>Close</Button>
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

              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "10px 12px", marginBottom: "14px", fontSize: "12px", color: "#1d4ed8", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <LuInfo size={13} style={{ flexShrink: 0, marginTop: "1px" }} />
                Offline appointments: only technical / network / other types are available. Patient and dietitian no-show types are not applicable — no platform payment is involved.
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#374151", display: "block", marginBottom: "8px" }}>Reason Type *</label>
                {[
                  { value: "technical_issue", label: "Technical Issue" },
                  { value: "network_issue",   label: "Network Issue" },
                  { value: "other",           label: "Other" },
                ].map((opt) => (
                  <label key={opt.value}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "8px", border: `1.5px solid ${missedType === opt.value ? "#2563eb" : "#e5e7eb"}`, background: missedType === opt.value ? "#eff6ff" : "#fff", cursor: "pointer", marginBottom: "6px", fontSize: "13px", fontWeight: missedType === opt.value ? 700 : 500, color: missedType === opt.value ? "#1d4ed8" : "#374151" }}>
                    <input type="radio" name="offline_missed_type" value={opt.value} checked={missedType === opt.value} onChange={() => setMissedType(opt.value)} style={{ accentColor: "#2563eb" }} />
                    {opt.label}
                  </label>
                ))}
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#374151", display: "block", marginBottom: "6px" }}>Notes / Details</label>
                <textarea
                  value={missedReason}
                  onChange={(e) => setMissedReason(e.target.value)}
                  placeholder="e.g. Patient's phone was unreachable, video call failed..."
                  rows={3}
                  style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", outline: "none", resize: "vertical", color: "#374151" }}
                />
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "1px solid #f3f4f6", padding: "12px 20px", gap: "8px" }}>
          <Button variant="outline-secondary" onClick={() => setShowMarkNoShowModal(false)} disabled={markingNoShow} style={{ borderRadius: "8px", fontWeight: 600, fontSize: "13px" }}>Cancel</Button>
          <Button onClick={handleMarkNoShow} disabled={markingNoShow}
            style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
            {markingNoShow
              ? <><span className="spinner-border spinner-border-sm" role="status" /> Recording...</>
              : <><FaBan size={13} /> Record No-Show</>}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          CLOSE APPOINTMENT MODAL (approve-no-show, no financial action)
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal show={showApproveNoShowModal} onHide={() => !approvingNoShow && setShowApproveNoShowModal(false)} centered size="sm">
        <Modal.Header closeButton={!approvingNoShow} style={{ borderBottom: "1px solid #f3f4f6", padding: "16px 20px" }}>
          <Modal.Title style={{ fontSize: "14px", fontWeight: 800, color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaCheck size={13} color="#7c3aed" /> Close Appointment · #{approveNoShowAppt?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "20px" }}>
          {approveNoShowAppt && (
            <>
              <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "14px", marginBottom: "14px", display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", alignItems: "baseline" }}>
                <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Patient</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{approveNoShowAppt.patient?.name || "—"}</span>
                <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Dietitian</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{approveNoShowAppt.dietitian?.name || "—"}</span>
                <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Date</span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{formatDate(approveNoShowAppt.appointment_date)} · {approveNoShowAppt.slot}</span>
                <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Type</span>
                <MissedTypeBadge type={approveNoShowAppt.missed_type} />
              </div>

              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "14px", marginBottom: "14px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>✅</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#16a34a" }}>No Financial Action</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#374151", marginTop: "4px" }}>
                    This is an offline appointment. Closing it will simply mark the record as resolved — no money will move, no refund will be issued, and no platform wallet will be affected.
                  </p>
                </div>
              </div>

              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", color: "#991b1b", fontWeight: 600 }}>
                ⚠️ This action is irreversible. The appointment will be permanently closed.
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "1px solid #f3f4f6", padding: "12px 20px", gap: "8px" }}>
          <Button variant="outline-secondary" onClick={() => setShowApproveNoShowModal(false)} disabled={approvingNoShow} style={{ borderRadius: "8px", fontWeight: 600, fontSize: "13px" }}>Cancel</Button>
          <Button onClick={handleApproveNoShow} disabled={approvingNoShow}
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
            {approvingNoShow
              ? <><span className="spinner-border spinner-border-sm" role="status" /> Closing...</>
              : <><FaCheck size={12} /> Confirm &amp; Close</>}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
