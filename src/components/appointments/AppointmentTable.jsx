import { useState, useEffect, useRef, useCallback } from "react";
import { Table, Modal, Button } from "react-bootstrap";
import { FaFilter, FaEye, FaSearch, FaTimes, FaVideo, FaMapMarkerAlt, FaStar, FaPhone, FaEnvelope } from "react-icons/fa";
import { LuCalendarDays, LuClock, LuStethoscope, LuCalendarClock, LuChevronDown, LuX } from "react-icons/lu";
import { MdPayment, MdAccessTime } from "react-icons/md";
import GlobalPagination from "../common/GlobalPagination";
import appointmentService from "../../services/appointmentService";
import toast from "react-hot-toast";

// ── Helpers ────────────────────────────────────────────────────────────────
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

const formatDuration = (seconds) => {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

// ── Badge components ───────────────────────────────────────────────────────
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
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, textTransform: "capitalize" }}>
      {status}
    </span>
  );
}

function SessionBadge({ type }) {
  const isVideo = type === "video_call";
  return (
    <span style={{ background: isVideo ? "#eff6ff" : "#f0fdf4", color: isVideo ? "#2563eb" : "#16a34a", border: `1px solid ${isVideo ? "#bfdbfe" : "#bbf7d0"}`, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
      {isVideo ? <FaVideo size={10} /> : <FaMapMarkerAlt size={10} />}
      {isVideo ? "Video Call" : "In Person"}
    </span>
  );
}

// ── Filter Dropdown ────────────────────────────────────────────────────────
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
      <button
        onClick={() => setOpen((p) => !p)}
        style={{ height: "40px", border: `1px solid ${value ? accent : "#e5e5e5"}`, borderRadius: "10px", padding: "0 12px", background: value ? `${accent}12` : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", minWidth: "130px", fontWeight: 600, fontSize: "12.5px", color: value ? accent : "#6b7280", whiteSpace: "nowrap" }}
      >
        <FaFilter style={{ fontSize: "11px", color: value ? accent : "#aaa" }} />
        {selected?.label || placeholder}
        {value
          ? <LuX style={{ marginLeft: "auto", fontSize: "13px" }} onClick={(e) => { e.stopPropagation(); onChange(""); }} />
          : <LuChevronDown style={{ marginLeft: "auto", fontSize: "12px", color: "#aaa" }} />
        }
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

// ── Detail info row ────────────────────────────────────────────────────────
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
      {[1, 2, 3, 4, 5].map((i) => (
        <FaStar key={i} size={13} color={i <= value ? "#f59e0b" : "#e5e7eb"} />
      ))}
      <span style={{ marginLeft: "4px", fontSize: "12px", fontWeight: 700, color: "#374151" }}>{value}/5</span>
    </div>
  );
}

// ── Filter options ─────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending",   label: "Pending",   dot: "#d97706" },
  { value: "confirmed", label: "Confirmed", dot: "#2563eb" },
  { value: "completed", label: "Completed", dot: "#16a34a" },
  { value: "cancelled", label: "Cancelled", dot: "#ef4444" },
  { value: "missed",    label: "Missed",    dot: "#7c3aed" },
];

const PAYMENT_OPTIONS = [
  { value: "",         label: "All Payments" },
  { value: "unpaid",   label: "Unpaid",   dot: "#ef4444" },
  { value: "paid",     label: "Paid",     dot: "#16a34a" },
  { value: "refunded", label: "Refunded", dot: "#7c3aed" },
];

const SESSION_OPTIONS = [
  { value: "",            label: "All Sessions" },
  { value: "video_call",  label: "Video Call" },
  { value: "in_person",   label: "In Person" },
];

// ── Main component ─────────────────────────────────────────────────────────
export default function AppointmentTable() {
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // detail modal
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const searchTimer = useRef(null);

  const buildParams = useCallback((page = currentPage) => {
    const p = new URLSearchParams();
    p.append("page", page);
    p.append("limit", 20);
    if (statusFilter)  p.append("status", statusFilter);
    if (paymentFilter) p.append("payment_status", paymentFilter);
    if (sessionFilter) p.append("session_type", sessionFilter);
    if (dateFrom)      p.append("date_from", dateFrom);
    if (dateTo)        p.append("date_to", dateTo);
    if (search)        p.append("search", search);
    return p.toString();
  }, [currentPage, statusFilter, paymentFilter, sessionFilter, dateFrom, dateTo, search]);

  const fetchAppointments = useCallback((page = currentPage) => {
    setLoading(true);
    appointmentService.list(buildParams(page))
      .then((res) => {
        const data = res?.data?.data || {};
        setAppointments(data.appointments || []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to fetch appointments."))
      .finally(() => setLoading(false));
  }, [buildParams, currentPage]);

  useEffect(() => { fetchAppointments(1); setCurrentPage(1); }, [statusFilter, paymentFilter, sessionFilter, dateFrom, dateTo, search]);
  useEffect(() => { fetchAppointments(currentPage); }, [currentPage]);

  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(val); setCurrentPage(1); }, 500);
  };

  const clearFilters = () => {
    setStatusFilter(""); setPaymentFilter(""); setSessionFilter("");
    setDateFrom(""); setDateTo(""); setSearch(""); setSearchInput(""); setCurrentPage(1);
  };

  const hasFilters = statusFilter || paymentFilter || sessionFilter || dateFrom || dateTo || search;

  const openDetail = (id) => {
    setShowDetail(true);
    setDetail(null);
    setLoadingDetail(true);
    appointmentService.get(id)
      .then((res) => setDetail(res?.data?.data || null))
      .catch((err) => { toast.error(err?.response?.data?.message || "Failed to load appointment."); setShowDetail(false); })
      .finally(() => setLoadingDetail(false));
  };

  return (
    <div>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

        {/* Toolbar */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative", minWidth: "220px", flex: "1 1 220px", maxWidth: "320px" }}>
            <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "12px" }} />
            <input
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search patient name, email, phone..."
              style={{ height: "40px", width: "100%", border: "1px solid #e5e5e5", borderRadius: "10px", padding: "0 12px 0 34px", fontSize: "13px", outline: "none", color: "#111827" }}
            />
            {searchInput && (
              <FaTimes
                onClick={() => handleSearchInput("")}
                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "12px", cursor: "pointer" }}
              />
            )}
          </div>

          <FilterDropdown value={statusFilter}  onChange={(v) => { setStatusFilter(v);  setCurrentPage(1); }} options={STATUS_OPTIONS}  placeholder="Status"    accent="#2563eb" />
          <FilterDropdown value={paymentFilter} onChange={(v) => { setPaymentFilter(v); setCurrentPage(1); }} options={PAYMENT_OPTIONS} placeholder="Payment"   accent="#16a34a" />
          <FilterDropdown value={sessionFilter} onChange={(v) => { setSessionFilter(v); setCurrentPage(1); }} options={SESSION_OPTIONS} placeholder="Session"   accent="#7c3aed" />

          {/* Date range */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
              style={{ height: "40px", border: "1px solid #e5e5e5", borderRadius: "10px", padding: "0 10px", fontSize: "12.5px", color: "#374151", outline: "none" }} />
            <span style={{ color: "#9ca3af", fontSize: "12px" }}>to</span>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
              style={{ height: "40px", border: "1px solid #e5e5e5", borderRadius: "10px", padding: "0 10px", fontSize: "12.5px", color: "#374151", outline: "none" }} />
          </div>

          {hasFilters && (
            <button onClick={clearFilters} style={{ height: "40px", border: "1px solid #fecaca", borderRadius: "10px", padding: "0 14px", background: "#fef2f2", cursor: "pointer", color: "#ef4444", fontWeight: 600, fontSize: "12.5px", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
              <LuX size={13} /> Clear Filters
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div className="spinner-border" style={{ color: "#1E8E3E", width: "2.5rem", height: "2.5rem" }} role="status" />
            <p style={{ marginTop: "16px", color: "#999", fontSize: "14px", fontWeight: 500 }}>Loading appointments...</p>
          </div>
        ) : appointments.length > 0 ? (
          <>
            <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #edf1ee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <Table className="table mb-0" style={{ borderCollapse: "collapse", minWidth: "1000px" }}>
                <thead>
                  <tr>
                    {["S.No", "Patient", "Dietitian", "Date & Slot", "Session", "Status", "Payment", "Fee", "Created", "Actions"].map((col) => (
                      <th key={col} style={{ background: "#1E8E3E", color: "#fff", fontWeight: 600, fontSize: "13px", padding: "14px 16px", whiteSpace: "nowrap", borderBottom: "2px solid #166C31", letterSpacing: "0.3px" }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a, i) => (
                    <tr key={a.id}
                      style={{ borderBottom: "1px solid #edf1ee", background: i % 2 === 0 ? "#fff" : "#fafcfa", transition: "background 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9f3")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafcfa")}
                    >
                      <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 700, color: "#1E8E3E", verticalAlign: "middle" }}>
                        {(pagination.page - 1) * pagination.limit + i + 1}
                      </td>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#111827" }}>{a.patient?.name || "—"}</p>
                        <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{a.patient?.phone || ""}</p>
                      </td>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {a.dietitian?.photo
                            ? <img src={a.dietitian.photo} alt="" style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                            : <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><LuStethoscope size={14} color="#1E8E3E" /></div>
                          }
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: "#111827" }}>{a.dietitian?.name || "—"}</p>
                            <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>#{a.dietitian?.id}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12.5px", color: "#374151", fontWeight: 600 }}>
                          <LuCalendarDays size={12} color="#1E8E3E" />
                          {formatDate(a.appointment_date)}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11.5px", color: "#9ca3af", marginTop: "2px" }}>
                          <LuClock size={11} />
                          {a.slot} · {a.duration}min
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        <SessionBadge type={a.session_type} />
                        {a.is_follow_up && <div style={{ marginTop: "4px", fontSize: "10px", color: "#9ca3af", fontWeight: 600 }}>Follow-up</div>}
                      </td>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}><StatusBadge status={a.status} /></td>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}><PaymentBadge status={a.payment_status} /></td>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle", fontSize: "13px", fontWeight: 700, color: "#111827" }}>
                        ₹{a.fee}
                        <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: 500 }}>{a.currency}</div>
                      </td>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle", fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap" }}>
                        {formatDate(a.created_at)}
                      </td>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        <div
                          onClick={() => openDetail(a.id)}
                          title="View Details"
                          style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        >
                          <FaEye style={{ color: "#3b82f6", fontSize: "14px" }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px", fontSize: "13px", color: "#888", marginTop: "4px" }}>
              <span>Showing <strong style={{ color: "#111827" }}>{appointments.length}</strong> of <strong style={{ color: "#111827" }}>{pagination.total}</strong> appointments</span>
              <span style={{ background: "#f0f9f3", padding: "4px 14px", borderRadius: "20px", fontWeight: 500, color: "#1E8E3E" }}>Page {pagination.page} of {pagination.pages}</span>
            </div>
            {pagination.pages > 1 && <GlobalPagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={setCurrentPage} />}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", borderRadius: "12px", border: "1px solid #edf1ee" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📅</div>
            <h5 style={{ fontWeight: 700, color: "#333", marginBottom: "8px" }}>No Appointments Found</h5>
            <p style={{ fontSize: "14px", color: "#999" }}>
              {hasFilters ? "No appointments match the current filters." : "No appointments have been booked yet."}
            </p>
            {hasFilters && (
              <button onClick={clearFilters} style={{ marginTop: "8px", padding: "9px 20px", background: "#1E8E3E", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                Clear Filters
              </button>
            )}
          </div>
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
                <div style={{ marginLeft: "auto", fontSize: "12px", color: "#9ca3af" }}>Created: {formatDateTime(detail.created_at)}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

                {/* Left column */}
                <div>
                  {/* Appointment Info */}
                  <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: "16px" }}>
                    <SectionHeader title="Appointment Info" icon="📋" />
                    <div className="row g-2">
                      <div className="col-6"><InfoRow label="Date" value={formatDate(detail.appointment_date)} /></div>
                      <div className="col-6"><InfoRow label="Time Slot" value={`${detail.slot} (${detail.duration} min)`} /></div>
                      <div className="col-6"><InfoRow label="Fee" value={`₹${detail.fee} ${detail.currency}`} /></div>
                      <div className="col-6"><InfoRow label="Follow-up Type" value={detail.follow_up_type || "—"} /></div>
                      {detail.parent_appointment_id && (
                        <div className="col-6"><InfoRow label="Parent Appointment" value={`#${detail.parent_appointment_id}`} /></div>
                      )}
                      {detail.payment_id && (
                        <div className="col-6"><InfoRow label="Payment ID" value={detail.payment_id} mono /></div>
                      )}
                      {detail.order_id && (
                        <div className="col-6"><InfoRow label="Order ID" value={detail.order_id} mono /></div>
                      )}
                    </div>

                    {detail.notes && (
                      <>
                        <SectionHeader title="Patient Notes" icon="📝" />
                        <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "12px 14px", fontSize: "13px", color: "#374151", lineHeight: 1.6 }}>{detail.notes}</div>
                      </>
                    )}

                    {detail.dietitian_notes && (
                      <>
                        <SectionHeader title="Dietitian Notes" icon="🩺" />
                        <div style={{ background: "#f0fdf4", borderRadius: "10px", padding: "12px 14px", fontSize: "13px", color: "#374151", lineHeight: 1.6, border: "1px solid #bbf7d0" }}>{detail.dietitian_notes}</div>
                      </>
                    )}

                    {detail.status === "missed" && (
                      <>
                        <SectionHeader title="Missed Info" icon="⚠️" />
                        <div className="row g-2">
                          <div className="col-6"><InfoRow label="Missed Type" value={detail.missed_type?.replace(/_/g, " ")} /></div>
                          <div className="col-12"><InfoRow label="Missed Reason" value={detail.missed_reason} /></div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Video Call Info (if applicable) */}
                  {detail.session_type === "video_call" && (
                    <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: "16px" }}>
                      <SectionHeader title="Video Call" icon="🎥" />
                      <div className="row g-2">
                        <div className="col-6">
                          <InfoRow label="Call Status" value={detail.video_call_status?.replace(/_/g, " ")} />
                        </div>
                        <div className="col-6">
                          <InfoRow label="Duration" value={formatDuration(detail.call_duration_seconds)} />
                        </div>
                        <div className="col-6">
                          <InfoRow label="Started At" value={formatDateTime(detail.call_started_at)} />
                        </div>
                        <div className="col-6">
                          <InfoRow label="Ended At" value={formatDateTime(detail.call_ended_at)} />
                        </div>
                        {detail.recording_url && (
                          <div className="col-12">
                            <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px" }}>
                              <small style={{ color: "#aaa", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Recording</small>
                              <a href={detail.recording_url} target="_blank" rel="noreferrer" style={{ fontSize: "13px", color: "#2563eb", fontWeight: 600, wordBreak: "break-all" }}>
                                View Recording
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right column */}
                <div>
                  {/* Patient */}
                  <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: "16px" }}>
                    <SectionHeader title="Patient" icon="👤" />
                    <div className="row g-2">
                      <div className="col-12"><InfoRow label="Name" value={detail.patient?.name} /></div>
                      <div className="col-12">
                        <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <FaEnvelope size={12} color="#9ca3af" />
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{detail.patient?.email || "—"}</span>
                        </div>
                      </div>
                      <div className="col-12">
                        <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <FaPhone size={12} color="#9ca3af" />
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{detail.patient?.phone || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dietitian */}
                  <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: "16px" }}>
                    <SectionHeader title="Dietitian" icon="🩺" />
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                      {detail.dietitian?.photo
                        ? <img src={detail.dietitian.photo} alt="" style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} />
                        : <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}><LuStethoscope size={22} color="#1E8E3E" /></div>
                      }
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#111827" }}>{detail.dietitian?.name || "—"}</p>
                        <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>#{detail.dietitian?.id} · {detail.dietitian?.city || ""}{detail.dietitian?.city && detail.dietitian?.state ? ", " : ""}{detail.dietitian?.state || ""}</p>
                      </div>
                    </div>
                    <div className="row g-2">
                      <div className="col-12">
                        <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <FaEnvelope size={12} color="#9ca3af" />
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{detail.dietitian?.email || "—"}</span>
                        </div>
                      </div>
                      <div className="col-12">
                        <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <FaPhone size={12} color="#9ca3af" />
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{detail.dietitian?.phone || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reviews */}
                  <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: "16px" }}>
                    <SectionHeader title="Reviews" icon="⭐" />

                    <div style={{ marginBottom: "14px" }}>
                      <p style={{ margin: "0 0 6px", fontSize: "11.5px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Patient Review</p>
                      <StarRating value={detail.user_rating} />
                      {detail.user_review && <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#374151", fontStyle: "italic", lineHeight: 1.5 }}>"{detail.user_review}"</p>}
                      {detail.user_reviewed_at && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#9ca3af" }}>{formatDateTime(detail.user_reviewed_at)}</p>}
                    </div>

                    <div style={{ height: "1px", background: "#f3f4f6", margin: "14px 0" }} />

                    <div>
                      <p style={{ margin: "0 0 6px", fontSize: "11.5px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Dietitian Review</p>
                      <StarRating value={detail.dietitian_rating} />
                      {detail.dietitian_review && <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#374151", fontStyle: "italic", lineHeight: 1.5 }}>"{detail.dietitian_review}"</p>}
                      {detail.dietitian_reviewed_at && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#9ca3af" }}>{formatDateTime(detail.dietitian_reviewed_at)}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Follow-ups */}
              {detail.follow_ups?.length > 0 && (
                <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: "16px" }}>
                  <SectionHeader title="Follow-up Appointments" icon="🔁" />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {detail.follow_ups.map((f) => (
                      <div key={f.id} style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px", minWidth: "160px" }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "12px", color: "#111827" }}>#{f.id}</p>
                        <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#374151" }}>{formatDate(f.appointment_date)} · {f.slot}</p>
                        <div style={{ marginTop: "6px" }}><StatusBadge status={f.status} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reschedule History */}
              {detail.reschedule_history?.length > 0 && (
                <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <SectionHeader title="Reschedule History" icon="🔄" />
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                      <thead>
                        <tr>
                          {["#", "Rescheduled By", "Previous", "New", "Reason", "Date"].map((col) => (
                            <th key={col} style={{ padding: "10px 12px", background: "#f8f9fa", fontWeight: 700, color: "#6b7280", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.4px", borderBottom: "1px solid #e5e7eb" }}>{col}</th>
                          ))}
                        </tr>
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
    </div>
  );
}
