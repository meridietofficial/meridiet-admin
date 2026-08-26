import { useState, useEffect, useRef } from "react";
import { Table } from "react-bootstrap";
import { FaSearch, FaTimes, FaFilter } from "react-icons/fa";
import { LuChevronDown, LuX, LuTrendingUp, LuUsers, LuCalendarDays, LuBookOpen, LuStethoscope } from "react-icons/lu";
import GlobalPagination from "../common/GlobalPagination";
import earningsService from "../../services/earningsService";
import toast from "react-hot-toast";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => (n == null ? "—" : `₹${Number(n).toLocaleString("en-IN")}`);
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};
const fmtDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${fmtDate(iso)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  paid:      { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  pending:   { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  failed:    { bg: "#fef2f2", color: "#ef4444", border: "#fecaca" },
  refunded:  { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
  completed: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
};
function StatusBadge({ status }) {
  const s = STATUS_COLOR[status] || { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, textTransform: "capitalize" }}>
      {status || "—"}
    </span>
  );
}

// ── Reusable table primitives ─────────────────────────────────────────────────
function TH({ children }) {
  return <th style={{ background: "#1E8E3E", color: "#fff", fontWeight: 600, fontSize: "13px", padding: "14px 16px", whiteSpace: "nowrap", borderBottom: "2px solid #166C31", letterSpacing: "0.3px" }}>{children}</th>;
}
function TD({ children, style }) {
  return <td style={{ padding: "12px 16px", verticalAlign: "middle", ...style }}>{children}</td>;
}
function TR({ children, index }) {
  return (
    <tr
      style={{ borderBottom: "1px solid #edf1ee", background: index % 2 === 0 ? "#fff" : "#fafcfa", transition: "background 0.2s" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9f3")}
      onMouseLeave={(e) => (e.currentTarget.style.background = index % 2 === 0 ? "#fff" : "#fafcfa")}
    >
      {children}
    </tr>
  );
}

// ── Search bar ────────────────────────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div style={{ position: "relative", minWidth: "220px", flex: "1 1 220px", maxWidth: "340px" }}>
      <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "12px" }} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ height: "40px", width: "100%", border: "1px solid #e5e5e5", borderRadius: "10px", padding: "0 36px 0 34px", fontSize: "13px", outline: "none", color: "#111827" }} />
      {value && <FaTimes onClick={() => onChange("")} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "12px", cursor: "pointer" }} />}
    </div>
  );
}

// ── Status filter dropdown ────────────────────────────────────────────────────
function FilterDropdown({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const selected = options.find((o) => o.value === value);
  const accent = "#1E8E3E";
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
              style={{ padding: "8px 14px", cursor: "pointer", borderRadius: "8px", fontSize: "13px", fontWeight: value === o.value ? 700 : 500, color: value === o.value ? accent : "#444", background: value === o.value ? `${accent}10` : "transparent" }}>
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Avatar / initials ─────────────────────────────────────────────────────────
function Avatar({ src, name, size = 32 }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  if (src) return <img src={src} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 700, fontSize: size * 0.38, color: "#1E8E3E" }}>
      {initial}
    </div>
  );
}

function UserCell({ name, email, avatar }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <Avatar src={avatar} name={name} />
      <div>
        <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: "#111827" }}>{name || "—"}</p>
        <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{email || ""}</p>
      </div>
    </div>
  );
}

// ── Loading / empty states ────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div className="spinner-border" style={{ color: "#1E8E3E", width: "2.5rem", height: "2.5rem" }} role="status" />
      <p style={{ marginTop: "16px", color: "#999", fontSize: "14px", fontWeight: 500 }}>Loading...</p>
    </div>
  );
}
function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", borderRadius: "12px", border: "1px solid #edf1ee" }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>💰</div>
      <h5 style={{ fontWeight: 700, color: "#333", marginBottom: "8px" }}>No Transactions Found</h5>
      <p style={{ fontSize: "14px", color: "#999" }}>Try adjusting your filters or search query.</p>
    </div>
  );
}

// ── Summary card ──────────────────────────────────────────────────────────────
function SummaryCard({ label, value, color = "#1E8E3E", sub }) {
  return (
    <div style={{ flex: "1 1 160px", background: "#fff", border: "1px solid #edf1ee", borderRadius: "14px", padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <p style={{ margin: "0 0 4px", fontSize: "11.5px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
      <p style={{ margin: 0, fontSize: "22px", fontWeight: 800, color }}>{value}</p>
      {sub && <p style={{ margin: "3px 0 0", fontSize: "11px", color: "#9ca3af" }}>{sub}</p>}
    </div>
  );
}

// ── Mode config ───────────────────────────────────────────────────────────────
const MODES = [
  { value: "diet_plans",     label: "Diet Plans",     icon: LuTrendingUp,  color: "#1E8E3E" },
  { value: "appointments",   label: "Appointments",   icon: LuCalendarDays, color: "#2563eb" },
  { value: "registrations",  label: "Registrations",  icon: LuStethoscope, color: "#d97706" },
  { value: "courses",        label: "Courses",        icon: LuBookOpen,    color: "#7c3aed" },
];

const STATUS_OPTIONS_BASE = [
  { value: "",        label: "All Status" },
  { value: "paid",    label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "failed",  label: "Failed" },
];
const STATUS_OPTIONS_APT = [
  { value: "",         label: "All Status" },
  { value: "paid",     label: "Paid" },
  { value: "pending",  label: "Pending" },
  { value: "failed",   label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

// ── Main component ────────────────────────────────────────────────────────────
export default function EarningsTable() {
  const [mode, setMode] = useState("diet_plans");
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);

  const LIMIT = 10;
  const totalPages = Math.ceil(total / LIMIT);

  const searchTimer = useRef(null);

  // Reset filters when mode changes
  useEffect(() => {
    setStatus("");
    setSearch("");
    setSearchInput("");
    setPage(1);
  }, [mode]);

  // Fetch data
  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams({ mode, page, limit: LIMIT });
    if (status) p.append("status", status);
    if (search) p.append("search", search);
    earningsService.list(p.toString())
      .then((res) => {
        const d = res?.data?.data || res?.data || {};
        setSummary(d.summary || null);
        setTransactions(d.transactions || []);
        setTotal(d.total || 0);
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to load earnings."))
      .finally(() => setLoading(false));
  }, [mode, status, search, page]);

  const handleSearch = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1); }, 500);
  };

  const activeMode = MODES.find((m) => m.value === mode);
  const statusOptions = mode === "appointments" ? STATUS_OPTIONS_APT : STATUS_OPTIONS_BASE;

  // ── Summary cards ─────────────────────────────────────────────────────────
  const renderSummary = () => {
    if (!summary) return null;
    if (mode === "diet_plans") return (
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
        <SummaryCard label="Total Revenue" value={fmt(summary.total_revenue)} color="#1E8E3E" />
        <SummaryCard label="Paid" value={summary.paid_count ?? "—"} color="#16a34a" sub="transactions" />
        <SummaryCard label="Pending" value={summary.pending_count ?? "—"} color="#d97706" sub="transactions" />
        <SummaryCard label="Failed" value={summary.failed_count ?? "—"} color="#ef4444" sub="transactions" />
      </div>
    );
    if (mode === "appointments") return (
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
        <SummaryCard label="Gross Revenue" value={fmt(summary.total_gross_revenue)} color="#2563eb" />
        <SummaryCard label="Platform Commission" value={fmt(summary.platform_commission)} color="#1E8E3E" sub={`${summary.platform_commission_pct ?? 20}% rate`} />
        <SummaryCard label="Dietitian Payouts" value={fmt(summary.dietitian_payouts)} color="#7c3aed" />
        <SummaryCard label="Paid" value={summary.paid_count ?? "—"} color="#16a34a" sub="sessions" />
        <SummaryCard label="Pending" value={summary.pending_count ?? "—"} color="#d97706" sub="sessions" />
        <SummaryCard label="Refunded" value={summary.refunded_count ?? "—"} color="#ef4444" sub="sessions" />
      </div>
    );
    if (mode === "registrations") return (
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
        <SummaryCard label="Total Revenue" value={fmt(summary.total_revenue)} color="#d97706" />
        <SummaryCard label="Paid" value={summary.paid_count ?? "—"} color="#16a34a" sub="dietitians" />
        <SummaryCard label="Pending" value={summary.pending_count ?? "—"} color="#d97706" sub="dietitians" />
        <SummaryCard label="Failed" value={summary.failed_count ?? "—"} color="#ef4444" sub="dietitians" />
      </div>
    );
    if (mode === "courses") return (
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
        <SummaryCard label="Total Revenue" value={fmt(summary.total_revenue)} color="#7c3aed" />
        <SummaryCard label="Paid" value={summary.paid_count ?? "—"} color="#16a34a" sub="enrollments" />
        <SummaryCard label="Pending" value={summary.pending_count ?? "—"} color="#d97706" sub="enrollments" />
        <SummaryCard label="Failed" value={summary.failed_count ?? "—"} color="#ef4444" sub="enrollments" />
      </div>
    );
    return null;
  };

  // ── Table columns per mode ────────────────────────────────────────────────
  const renderTableHead = () => {
    if (mode === "diet_plans") return ["S.No", "User", "Plan", "Amount", "Discount", "Final", "Per Month", "Status", "Order ID", "Date"].map((c) => <TH key={c}>{c}</TH>);
    if (mode === "appointments") return ["S.No", "Client", "Dietitian", "Appt Date", "Gross Fee", "Final", "Commission", "Dietitian Earn", "Status", "Payment ID", "Date"].map((c) => <TH key={c}>{c}</TH>);
    if (mode === "registrations") return ["S.No", "Dietitian", "Phone", "Amount", "Status", "Order ID", "Payment ID", "Verified At", "Date"].map((c) => <TH key={c}>{c}</TH>);
    if (mode === "courses") return ["S.No", "Name", "Email", "Phone", "Course Fee", "Status", "Order ID", "Payment ID", "Verified At", "Date"].map((c) => <TH key={c}>{c}</TH>);
    return null;
  };

  const renderRow = (t, i) => {
    const sno = (page - 1) * LIMIT + i + 1;
    if (mode === "diet_plans") return (
      <TR key={t.id} index={i}>
        <TD style={{ fontWeight: 700, color: "#1E8E3E", fontSize: "13px" }}>{sno}</TD>
        <TD><UserCell name={t.user_name} email={t.user_email} avatar={t.user_avatar} /></TD>
        <TD><span style={{ background: "#f0fdf4", color: "#1E8E3E", border: "1px solid #bbf7d0", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, textTransform: "capitalize" }}>{(t.plan || "—").replace(/_/g, " ")}</span></TD>
        <TD style={{ fontWeight: 600, color: "#374151" }}>{fmt(t.amount)}</TD>
        <TD style={{ color: t.discount_applied ? "#ef4444" : "#9ca3af", fontWeight: 600 }}>{t.discount_applied ? `-${fmt(t.discount_applied)}` : "—"}</TD>
        <TD style={{ fontWeight: 800, color: "#1E8E3E", fontSize: "14px" }}>{fmt(t.final_amount)}</TD>
        <TD style={{ fontSize: "12px", color: "#6b7280" }}>{fmt(t.per_month_amount)}<span style={{ fontSize: "10px" }}>/mo</span></TD>
        <TD><StatusBadge status={t.status} /></TD>
        <TD style={{ fontFamily: "monospace", fontSize: "11px", color: "#6b7280" }}>{t.razorpay_order_id || "—"}</TD>
        <TD style={{ fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap" }}>{fmtDate(t.created_at)}</TD>
      </TR>
    );
    if (mode === "appointments") return (
      <TR key={t.id} index={i}>
        <TD style={{ fontWeight: 700, color: "#2563eb", fontSize: "13px" }}>{sno}</TD>
        <TD><UserCell name={t.client_name} email={t.client_email} avatar={t.client_avatar} /></TD>
        <TD>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <LuStethoscope size={13} color="#2563eb" />
            </div>
            <span style={{ fontWeight: 600, fontSize: "13px", color: "#111827" }}>{t.dietitian_name || "—"}</span>
          </div>
        </TD>
        <TD style={{ fontSize: "12.5px", color: "#374151", fontWeight: 600, whiteSpace: "nowrap" }}>{fmtDate(t.appointment_date)}</TD>
        <TD style={{ fontWeight: 600, color: "#374151" }}>{fmt(t.fee)}</TD>
        <TD style={{ fontWeight: 800, color: "#2563eb", fontSize: "14px" }}>{fmt(t.final_amount)}</TD>
        <TD style={{ fontWeight: 700, color: "#ef4444" }}>
          {fmt(t.platform_commission)}
          <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: 500 }}>{t.platform_commission_pct ?? 20}%</div>
        </TD>
        <TD style={{ fontWeight: 800, color: "#16a34a", fontSize: "14px" }}>{fmt(t.dietitian_earnings)}</TD>
        <TD><StatusBadge status={t.payment_status || t.status} /></TD>
        <TD style={{ fontFamily: "monospace", fontSize: "11px", color: "#6b7280" }}>{t.payment_id || "—"}</TD>
        <TD style={{ fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap" }}>{fmtDate(t.created_at)}</TD>
      </TR>
    );
    if (mode === "registrations") return (
      <TR key={t.id} index={i}>
        <TD style={{ fontWeight: 700, color: "#d97706", fontSize: "13px" }}>{sno}</TD>
        <TD><UserCell name={t.name} email={t.email} /></TD>
        <TD style={{ fontSize: "12px", color: "#374151", fontWeight: 500 }}>{t.phone || "—"}</TD>
        <TD style={{ fontWeight: 800, color: "#d97706", fontSize: "14px" }}>{fmt(t.amount)}</TD>
        <TD><StatusBadge status={t.status} /></TD>
        <TD style={{ fontFamily: "monospace", fontSize: "11px", color: "#6b7280" }}>{t.razorpay_order_id || "—"}</TD>
        <TD style={{ fontFamily: "monospace", fontSize: "11px", color: "#6b7280" }}>{t.razorpay_payment_id || "—"}</TD>
        <TD style={{ fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap" }}>{fmtDateTime(t.payment_verified_at)}</TD>
        <TD style={{ fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap" }}>{fmtDate(t.created_at)}</TD>
      </TR>
    );
    if (mode === "courses") return (
      <TR key={t.id} index={i}>
        <TD style={{ fontWeight: 700, color: "#7c3aed", fontSize: "13px" }}>{sno}</TD>
        <TD style={{ fontWeight: 600, fontSize: "13px", color: "#111827" }}>{t.name || "—"}</TD>
        <TD style={{ fontSize: "12px", color: "#6b7280" }}>{t.email || "—"}</TD>
        <TD style={{ fontSize: "12px", color: "#6b7280" }}>{t.phone || "—"}</TD>
        <TD style={{ fontWeight: 800, color: "#7c3aed", fontSize: "14px" }}>{fmt(t.course_fee)}</TD>
        <TD><StatusBadge status={t.payment_status} /></TD>
        <TD style={{ fontFamily: "monospace", fontSize: "11px", color: "#6b7280" }}>{t.razorpay_order_id || "—"}</TD>
        <TD style={{ fontFamily: "monospace", fontSize: "11px", color: "#6b7280" }}>{t.razorpay_payment_id || "—"}</TD>
        <TD style={{ fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap" }}>{fmtDateTime(t.payment_verified_at)}</TD>
        <TD style={{ fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap" }}>{fmtDate(t.created_at)}</TD>
      </TR>
    );
    return null;
  };

  const minTableWidth = { diet_plans: "1000px", appointments: "1200px", registrations: "1050px", courses: "1000px" }[mode] || "900px";

  return (
    <div>
      {/* ── Page header ── */}
      <div style={{ marginBottom: "24px" }}>
        <h4 style={{ fontWeight: 800, color: "#111827", margin: 0 }}>Earnings & Revenue</h4>
        <p style={{ margin: "4px 0 0", color: "#9ca3af", fontSize: "13.5px" }}>All platform revenue across every stream</p>
      </div>

      {/* ── Mode tabs ── */}
      <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", borderBottom: "2px solid #f0f0f0", marginBottom: "24px", gap: "2px", flexWrap: "wrap" }}>
          {MODES.map((m) => {
            const active = mode === m.value;
            const Icon = m.icon;
            return (
              <button key={m.value} onClick={() => setMode(m.value)}
                style={{ padding: "10px 22px", border: "none", background: "none", cursor: "pointer", fontWeight: active ? 700 : 500, fontSize: "13.5px", color: active ? m.color : "#6b7280", borderBottom: `2.5px solid ${active ? m.color : "transparent"}`, marginBottom: "-2px", transition: "all 0.15s", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "7px" }}>
                <Icon size={15} />
                {m.label}
              </button>
            );
          })}
        </div>

        {/* ── Summary cards ── */}
        {renderSummary()}

        {/* ── Filters ── */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <SearchBar value={searchInput} onChange={handleSearch} placeholder="Search name, email, order ID..." />
          <FilterDropdown value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={statusOptions} placeholder="All Status" />
          {(search || status) && (
            <button onClick={() => { setSearch(""); setSearchInput(""); setStatus(""); setPage(1); }}
              style={{ height: "40px", border: "1px solid #fecaca", borderRadius: "10px", padding: "0 14px", background: "#fef2f2", cursor: "pointer", color: "#ef4444", fontWeight: 600, fontSize: "12.5px", display: "flex", alignItems: "center", gap: "6px" }}>
              <LuX size={13} /> Clear
            </button>
          )}
        </div>

        {/* ── Table ── */}
        {loading ? <LoadingState /> : transactions.length === 0 ? <EmptyState /> : (
          <>
            <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #edf1ee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <Table className="table mb-0" style={{ borderCollapse: "collapse", minWidth: minTableWidth }}>
                <thead><tr>{renderTableHead()}</tr></thead>
                <tbody>{transactions.map((t, i) => renderRow(t, i))}</tbody>
              </Table>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px", fontSize: "13px", color: "#888", marginTop: "4px" }}>
              <span>Showing <strong style={{ color: "#111827" }}>{transactions.length}</strong> of <strong style={{ color: "#111827" }}>{total}</strong></span>
              <span style={{ background: "#f0f9f3", padding: "4px 14px", borderRadius: "20px", fontWeight: 500, color: activeMode?.color || "#1E8E3E" }}>Page {page} of {totalPages || 1}</span>
            </div>
            {totalPages > 1 && <GlobalPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
          </>
        )}
      </div>
    </div>
  );
}
