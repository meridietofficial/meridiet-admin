import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Modal, Button } from "react-bootstrap";
import { FaEye, FaSearch, FaTimes, FaFilter, FaFilePdf, FaPhone } from "react-icons/fa";
import { LuChevronDown, LuX, LuChevronRight, LuScrollText, LuFileText } from "react-icons/lu";
import GlobalPagination from "../common/GlobalPagination";
import offlineDietChartService from "../../services/offlineDietChartService";
import toast from "react-hot-toast";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};
const fmtLabel = (str) =>
  str ? str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";

const formatDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft:      { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb", dot: "#9ca3af", label: "Draft" },
  generating: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", dot: "#3b82f6", label: "Generating" },
  completed:  { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", dot: "#22c55e", label: "Completed" },
  failed:     { bg: "#fef2f2", color: "#ef4444", border: "#fecaca", dot: "#ef4444", label: "Failed" },
  sent:       { bg: "#f0fdfa", color: "#0d9488", border: "#99f6e4", dot: "#14b8a6", label: "Sent" },
};

// ── Badges ────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px", textTransform: "capitalize" }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.dot, flexShrink: 0, animation: status === "generating" ? "pulse 1.5s infinite" : "none" }} />
      {s.label}
    </span>
  );
}

// ── Reusable UI ───────────────────────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", minWidth: "240px", flex: "1 1 240px", maxWidth: "340px" }}>
      <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "12px" }} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ height: "40px", width: "100%", border: "1px solid #e5e5e5", borderRadius: "10px", padding: "0 36px 0 34px", fontSize: "13px", outline: "none", color: "#111827" }} />
      {value && <FaTimes onClick={() => onChange("")} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "12px", cursor: "pointer" }} />}
    </div>
  );
}

function FilterDropdown({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const accent = "#1E8E3E";
  const selected = options.find((o) => o.value === value);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((p) => !p)}
        style={{ height: "40px", border: `1px solid ${value ? accent : "#e5e5e5"}`, borderRadius: "10px", padding: "0 12px", background: value ? `${accent}12` : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", minWidth: "140px", fontWeight: 600, fontSize: "12.5px", color: value ? accent : "#6b7280", whiteSpace: "nowrap" }}>
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
function InfoBox({ label, value, mono }) {
  return (
    <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px" }}>
      <small style={{ color: "#aaa", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block" }}>{label}</small>
      <p style={{ margin: "2px 0 0", fontWeight: 600, color: value ? "#111827" : "#9ca3af", fontSize: "13px", fontFamily: mono ? "monospace" : "inherit", wordBreak: "break-word" }}>
        {value || "—"}
      </p>
    </div>
  );
}
function SectionHead({ title, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "18px 0 12px" }}>
      <span style={{ fontSize: "15px" }}>{icon}</span>
      <span style={{ fontWeight: 800, fontSize: "11px", color: "#374151", textTransform: "uppercase", letterSpacing: "0.8px" }}>{title}</span>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, #e5e7eb, transparent)", marginLeft: "4px" }} />
    </div>
  );
}
function MetricCard({ label, value, sub, color = "#1E8E3E" }) {
  return (
    <div style={{ background: "#f8f9fa", borderRadius: "12px", padding: "14px", textAlign: "center", border: `1px solid ${color}22` }}>
      <p style={{ margin: 0, fontSize: "10px", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
      <p style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: 800, color }}>{value ?? "—"}</p>
      {sub && <p style={{ margin: "2px 0 0", fontSize: "10.5px", color: "#9ca3af" }}>{sub}</p>}
    </div>
  );
}
function Tag({ text, color = "#1E8E3E" }) {
  if (!text) return null;
  return (
    <span style={{ display: "inline-block", background: `${color}14`, color, border: `1px solid ${color}33`, borderRadius: "20px", padding: "3px 10px", fontSize: "11.5px", fontWeight: 600, margin: "2px" }}>
      {text}
    </span>
  );
}

// ── Meal plan components ──────────────────────────────────────────────────────
const MEAL_LABELS = {
  breakfast:   "Breakfast",
  mid_morning: "Mid-Morning",
  lunch:       "Lunch",
  evening:     "Evening Snack",
  dinner:      "Dinner",
  snacks:      "Snacks",
};

function DayCard({ day }) {
  const [open, setOpen] = useState(false);
  const meals = day.meals || {};
  const mealKeys = Object.keys(meals);
  const totalCals = mealKeys.reduce((sum, k) => sum + (meals[k]?.calories || 0), 0);
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: "10px", marginBottom: "6px", overflow: "hidden" }}>
      <div onClick={() => setOpen((p) => !p)}
        style={{ padding: "10px 14px", background: open ? "#f0fdf4" : "#f9fafb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, fontSize: "13px", color: "#374151" }}>{day.day}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {totalCals > 0 && (
            <span style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a", borderRadius: "20px", padding: "2px 10px", fontSize: "11px", fontWeight: 700 }}>
              {totalCals} kcal total
            </span>
          )}
          <LuChevronRight size={14} style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", color: "#9ca3af" }} />
        </div>
      </div>
      {open && (
        <div style={{ padding: "12px 14px", background: "#fff" }}>
          {mealKeys.length === 0
            ? <p style={{ margin: 0, color: "#9ca3af", fontSize: "13px" }}>No meals specified.</p>
            : mealKeys.map((key) => {
                const meal = meals[key];
                const items = Array.isArray(meal?.items) ? meal.items : [];
                const cals  = meal?.calories;
                const label = MEAL_LABELS[key] || key.replace(/_/g, " ");
                return (
                  <div key={key} style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                      <span style={{ fontWeight: 700, fontSize: "12px", color: "#1E8E3E", textTransform: "capitalize" }}>{label}</span>
                      {cals > 0 && (
                        <span style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "20px", padding: "1px 8px", fontSize: "10px", fontWeight: 700 }}>
                          {cals} kcal
                        </span>
                      )}
                    </div>
                    {items.length > 0 && (
                      <ul style={{ margin: 0, paddingLeft: "18px" }}>
                        {items.map((item, i) => (
                          <li key={i} style={{ fontSize: "12.5px", color: "#374151", marginBottom: "3px" }}>
                            {typeof item === "string"
                              ? item
                              : [item.name, item.quantity && `(${item.quantity})`, item.calories && `— ${item.calories} kcal`].filter(Boolean).join(" ")}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
}

function WeekPanel({ week }) {
  const days = week?.days || [];
  if (days.length === 0) return <p style={{ color: "#9ca3af", fontSize: "13px" }}>No days specified for this week.</p>;
  return <div>{days.map((d, i) => <DayCard key={i} day={d} />)}</div>;
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
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
      <h5 style={{ fontWeight: 700, color: "#333", marginBottom: "8px" }}>No Records Found</h5>
      <p style={{ fontSize: "14px", color: "#999" }}>{msg || "Nothing to show here."}</p>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "",           label: "All Statuses" },
  { value: "draft",      label: "Draft",      dot: "#9ca3af" },
  { value: "generating", label: "Generating", dot: "#3b82f6" },
  { value: "completed",  label: "Completed",  dot: "#22c55e" },
  { value: "failed",     label: "Failed",     dot: "#ef4444" },
  { value: "sent",       label: "Sent",       dot: "#14b8a6" },
];

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function OfflineDietChartTable() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const searchTimer = useRef(null);

  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeWeek, setActiveWeek] = useState(0);

  // ── Fetch list ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit: 20 });
    if (statusFilter) p.append("status", statusFilter);
    if (search)       p.append("search", search);
    offlineDietChartService.list(p.toString())
      .then((res) => {
        const d = res?.data?.data || {};
        setPlans(d.plans || []);
        setPagination(d.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to load diet charts."))
      .finally(() => setLoading(false));
  }, [page, statusFilter, search]);

  // ── Open detail ─────────────────────────────────────────────────────────────
  const openDetail = (id) => {
    setShowDetail(true); setDetail(null); setLoadingDetail(true); setActiveWeek(0);
    offlineDietChartService.get(id)
      .then((res) => setDetail(res?.data?.data?.plan || null))
      .catch((err) => { toast.error(err?.response?.data?.message || "Failed to load."); setShowDetail(false); })
      .finally(() => setLoadingDetail(false));
  };

  // ── Debounced search ────────────────────────────────────────────────────────
  const handleSearch = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1); }, 500);
  };

  const clearFilters = () => { setStatusFilter(""); setSearch(""); setSearchInput(""); setPage(1); };
  const hasFilters = statusFilter || search;

  // ── Detail shorthands ───────────────────────────────────────────────────────
  const plan = detail || {};
  const form = plan.form || {};
  const weeks = plan.weeks || [];
  const dietitian = plan.dietitian || {};

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h5 style={{ margin: 0, fontWeight: 800, fontSize: "16px", color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
              <LuScrollText size={18} color="#1E8E3E" /> Offline Diet Charts
            </h5>
            <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "#9ca3af" }}>
              Diet plans created manually by dietitians for their offline clients
            </p>
          </div>
          {pagination.total > 0 && (
            <span style={{ background: "#f0f9f3", color: "#1E8E3E", border: "1px solid #bbf7d0", borderRadius: "20px", padding: "4px 14px", fontSize: "12.5px", fontWeight: 700 }}>
              {pagination.total} total
            </span>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <SearchBar value={searchInput} onChange={handleSearch} placeholder="Search patient or dietitian name / phone..." />
          <FilterDropdown value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={STATUS_OPTIONS} placeholder="Status" />
          {hasFilters && (
            <button onClick={clearFilters} style={{ height: "40px", border: "1px solid #fecaca", borderRadius: "10px", padding: "0 14px", background: "#fef2f2", cursor: "pointer", color: "#ef4444", fontWeight: 600, fontSize: "12.5px", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
              <LuX size={13} /> Clear
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? <LoadingState /> : plans.length === 0 ? (
          <EmptyState msg={hasFilters ? "No diet charts match the current filters." : "No offline diet charts yet."} />
        ) : (
          <>
            <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #edf1ee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <Table className="table mb-0" style={{ borderCollapse: "collapse", minWidth: "960px" }}>
                <thead>
                  <tr>{["S.No", "Patient", "Dietitian", "Primary Goal", "Diet Type", "Duration", "Status", "Created", "Action"].map((c) => <TH key={c}>{c}</TH>)}</tr>
                </thead>
                <tbody>
                  {plans.map((p, i) => (
                    <TR key={p.id} index={i}>
                      <TD style={{ fontWeight: 700, color: "#1E8E3E", fontSize: "13px" }}>
                        {(pagination.page - 1) * pagination.limit + i + 1}
                      </TD>

                      <TD>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#111827" }}>
                          {p.client_name || p.form_full_name || "—"}
                        </p>
                        {(p.form_age || p.form_gender) && (
                          <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>
                            {[p.form_age ? `${p.form_age} yrs` : null, p.form_gender].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </TD>

                      <TD>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: "#111827" }}>{p.dietitian_name || "—"}</p>
                        {p.dietitian_phone && (
                          <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af", display: "flex", alignItems: "center", gap: "4px" }}>
                            <FaPhone size={9} /> {p.dietitian_phone}
                          </p>
                        )}
                      </TD>

                      <TD style={{ fontSize: "13px", color: "#374151", fontWeight: 500, maxWidth: "160px" }}>
                        <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {fmtLabel(p.primary_goal)}
                        </span>
                      </TD>

                      <TD>
                        {p.diet_type ? (
                          <span style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap" }}>
                            {fmtLabel(p.diet_type)}
                          </span>
                        ) : <span style={{ color: "#9ca3af", fontSize: "13px" }}>—</span>}
                      </TD>

                      <TD style={{ fontSize: "12.5px", color: "#374151", fontWeight: 500, whiteSpace: "nowrap" }}>
                        {p.plan_duration || "—"}
                      </TD>

                      <TD><StatusBadge status={p.status} /></TD>

                      <TD style={{ fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap" }}>
                        {formatDate(p.created_at)}
                      </TD>

                      <TD>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <ActionBtn onClick={() => openDetail(p.id)} title="View Details" bg="#eff6ff">
                            <FaEye style={{ color: "#3b82f6", fontSize: "13px" }} />
                          </ActionBtn>
                          {(p.status === "completed" || p.status === "sent") && (
                            <ActionBtn onClick={() => navigate(`/dashboard/dietitian-plans/${p.id}/view`)} title="View Diet Plan" bg="#f0fdf4">
                              <LuFileText style={{ color: "#1E8E3E", fontSize: "14px" }} />
                            </ActionBtn>
                          )}
                        </div>
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px", fontSize: "13px", color: "#888", marginTop: "4px" }}>
              <span>Showing <strong style={{ color: "#111827" }}>{plans.length}</strong> of <strong style={{ color: "#111827" }}>{pagination.total}</strong></span>
              <span style={{ background: "#f0f9f3", padding: "4px 14px", borderRadius: "20px", fontWeight: 500, color: "#1E8E3E" }}>Page {pagination.page} of {pagination.pages}</span>
            </div>
            {pagination.pages > 1 && <GlobalPagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={setPage} />}
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
              <LuScrollText size={18} color="#fff" />
            </div>
            Offline Diet Chart
            {plan.id && <span style={{ background: "rgba(255,255,255,0.18)", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px" }}>#{plan.id}</span>}
            {plan.status && <StatusBadge status={plan.status} />}
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
              {/* Status / meta strip */}
              <div style={{ background: "#fff", borderRadius: "12px", padding: "14px 18px", marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <StatusBadge status={plan.status} />
                {plan.plan_duration && (
                  <span style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>
                    {plan.plan_duration}
                  </span>
                )}
                {plan.diet_type && (
                  <span style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>
                    {plan.diet_type}
                  </span>
                )}
                {plan.calorie_range && (
                  <span style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>
                    🔥 {plan.calorie_range}
                  </span>
                )}
                {plan.sent_at && (
                  <span style={{ marginLeft: "auto", fontSize: "12px", color: "#9ca3af" }}>Sent: {formatDateTime(plan.sent_at)}</span>
                )}
              </div>

              {/* PDF */}
              {plan.pdf_url && (
                <div style={{ background: "#fff", borderRadius: "12px", padding: "14px 18px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <FaFilePdf size={20} color="#ef4444" />
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#111827" }}>Diet Plan PDF</p>
                      <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>Generated PDF ready for download or sharing</p>
                    </div>
                  </div>
                  <a href={plan.pdf_url} target="_blank" rel="noreferrer"
                    style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: "8px", padding: "7px 16px", fontWeight: 700, fontSize: "13px", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
                    <FaFilePdf size={13} /> Download
                  </a>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* LEFT COLUMN — patient + form */}
                <div>
                  <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: "16px" }}>
                    <SectionHead title="Patient Info" icon="👤" />
                    <div className="row g-2">
                      <div className="col-12"><InfoBox label="Full Name" value={form.full_name || plan.client_name} /></div>
                      <div className="col-4"><InfoBox label="Age" value={form.age ? `${form.age} yrs` : null} /></div>
                      <div className="col-4"><InfoBox label="Gender" value={form.gender} /></div>
                      <div className="col-4"><InfoBox label="DOB" value={form.dob ? formatDate(form.dob) : null} /></div>
                      <div className="col-6"><InfoBox label="Height" value={form.height ? `${form.height} ${form.height_unit || "cm"}` : null} /></div>
                      <div className="col-6"><InfoBox label="Weight" value={form.weight ? `${form.weight} ${form.weight_unit || "kg"}` : null} /></div>
                      {form.activity_level && <div className="col-6"><InfoBox label="Activity Level" value={form.activity_level.replace(/_/g, " ")} /></div>}
                      {form.work_type     && <div className="col-6"><InfoBox label="Work Type"     value={form.work_type.replace(/_/g, " ")} /></div>}
                      {form.workout_type  && <div className="col-6"><InfoBox label="Workout Type"  value={form.workout_type.replace(/_/g, " ")} /></div>}
                      {form.smoke_alcohol && <div className="col-6"><InfoBox label="Smoke / Alcohol" value={form.smoke_alcohol} /></div>}
                    </div>

                    {/* Goals */}
                    {(form.goals?.length > 0 || plan.primary_goal) && (
                      <>
                        <SectionHead title="Goals" icon="🎯" />
                        <div style={{ display: "flex", flexWrap: "wrap" }}>
                          {plan.primary_goal && <Tag text={plan.primary_goal} color="#1E8E3E" />}
                          {(form.goals || []).filter((g) => g !== plan.primary_goal).map((g, i) => <Tag key={i} text={g} color="#6b7280" />)}
                        </div>
                      </>
                    )}

                    {/* Medical */}
                    {(form.medical_conditions?.length > 0 || form.other_condition || form.on_medication || form.medications) && (
                      <>
                        <SectionHead title="Health Conditions" icon="🩺" />
                        {form.medical_conditions?.length > 0 && (
                          <div style={{ marginBottom: "8px" }}>
                            <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Conditions</p>
                            <div style={{ display: "flex", flexWrap: "wrap" }}>
                              {form.medical_conditions.map((c, i) => <Tag key={i} text={c} color="#ef4444" />)}
                            </div>
                          </div>
                        )}
                        {form.other_condition && <div style={{ marginBottom: "8px" }}><InfoBox label="Other Condition" value={form.other_condition} /></div>}
                        {form.medications && <InfoBox label="Medications" value={form.medications} />}
                      </>
                    )}

                    {/* Diet preferences */}
                    {(form.diet_type || form.cuisine_preference?.length > 0 || form.food_allergies?.length > 0 || form.foods_dislike || form.favorite_foods) && (
                      <>
                        <SectionHead title="Diet Preferences" icon="🥗" />
                        {form.diet_type && <div style={{ marginBottom: "8px" }}><InfoBox label="Diet Type" value={form.diet_type} /></div>}
                        {form.cuisine_preference?.length > 0 && (
                          <div style={{ marginBottom: "8px" }}>
                            <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Cuisine Preferences</p>
                            <div style={{ display: "flex", flexWrap: "wrap" }}>
                              {form.cuisine_preference.map((c, i) => <Tag key={i} text={c} color="#2563eb" />)}
                            </div>
                          </div>
                        )}
                        {form.food_allergies?.length > 0 && (
                          <div style={{ marginBottom: "8px" }}>
                            <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Food Allergies</p>
                            <div style={{ display: "flex", flexWrap: "wrap" }}>
                              {form.food_allergies.map((a, i) => <Tag key={i} text={a} color="#d97706" />)}
                            </div>
                          </div>
                        )}
                        {form.foods_dislike  && <div style={{ marginBottom: "8px" }}><InfoBox label="Dislikes" value={form.foods_dislike} /></div>}
                        {form.favorite_foods && <InfoBox label="Favourite Foods" value={form.favorite_foods} />}
                      </>
                    )}

                    {/* Other notes */}
                    {(form.digestive_health || form.health_notes) && (
                      <>
                        <SectionHead title="Notes" icon="📝" />
                        {form.digestive_health && <div style={{ marginBottom: "8px" }}><InfoBox label="Digestive Health" value={form.digestive_health} /></div>}
                        {form.health_notes     && <InfoBox label="Health Notes" value={form.health_notes} />}
                      </>
                    )}
                  </div>

                  {/* Dietitian card */}
                  <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <SectionHead title="Dietitian" icon="🩺" />
                    <div className="row g-2">
                      <div className="col-12"><InfoBox label="Name" value={dietitian.name} /></div>
                      <div className="col-12">
                        <InfoBox label="Phone" value={dietitian.phone_number ? `${dietitian.phone_code || ""}${dietitian.phone_number}` : null} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN — plan metrics, tips, recipes */}
                <div>
                  {/* Metrics */}
                  {(plan.bmi || plan.bmr || plan.tdee) && (
                    <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: "16px" }}>
                      <SectionHead title="Plan Metrics" icon="📊" />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: plan.protein_target_g || plan.carbs_target_g || plan.fat_target_g ? "10px" : 0 }}>
                        {plan.bmi  != null && <MetricCard label="BMI"  value={plan.bmi}  sub={plan.bmi_category || "Body Mass Index"} color="#2563eb" />}
                        {plan.bmr  != null && <MetricCard label="BMR"  value={`${plan.bmr} kcal`}  sub="Basal Metabolic Rate"   color="#7c3aed" />}
                        {plan.tdee != null && <MetricCard label="TDEE" value={`${plan.tdee} kcal`} sub="Total Daily Energy"      color="#d97706" />}
                        {plan.calorie_range && <MetricCard label="Calorie Target" value={plan.calorie_range} sub="Daily range" color="#1E8E3E" />}
                      </div>
                      {(plan.protein_target_g || plan.carbs_target_g || plan.fat_target_g) && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                          {plan.protein_target_g != null && <MetricCard label="Protein" value={`${plan.protein_target_g}g`} color="#ef4444" />}
                          {plan.carbs_target_g   != null && <MetricCard label="Carbs"   value={`${plan.carbs_target_g}g`}   color="#d97706" />}
                          {plan.fat_target_g     != null && <MetricCard label="Fat"     value={`${plan.fat_target_g}g`}     color="#7c3aed" />}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hydration */}
                  {plan.hydration_guide && (
                    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "18px" }}>💧</span>
                      <div>
                        <p style={{ margin: "0 0 3px", fontSize: "11px", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>Hydration Guide</p>
                        <p style={{ margin: 0, fontSize: "13px", color: "#1e40af", lineHeight: 1.5 }}>{plan.hydration_guide}</p>
                      </div>
                    </div>
                  )}

                  {/* Plan notes */}
                  {plan.notes && (
                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "18px" }}>📌</span>
                      <div>
                        <p style={{ margin: "0 0 3px", fontSize: "11px", fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>Dietitian Notes</p>
                        <p style={{ margin: 0, fontSize: "13px", color: "#78350f", lineHeight: 1.5 }}>{plan.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* General Tips */}
                  {plan.general_tips?.length > 0 && (
                    <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: "16px" }}>
                      <SectionHead title="General Tips" icon="💡" />
                      <ul style={{ margin: 0, paddingLeft: "18px" }}>
                        {plan.general_tips.map((tip, i) => (
                          <li key={i} style={{ fontSize: "13px", color: "#374151", marginBottom: "6px", lineHeight: 1.5 }}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Featured Recipes */}
                  {plan.featured_recipes?.length > 0 && (
                    <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                      <SectionHead title="Featured Recipes" icon="🍽️" />
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {plan.featured_recipes.map((r, i) => (
                          <div key={i} style={{ background: "#f8f9fa", borderRadius: "10px", padding: "12px 14px" }}>
                            <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: "13px", color: "#111827" }}>{r.name}</p>
                            {r.ingredients?.length > 0 && (
                              <div style={{ marginBottom: "6px" }}>
                                <p style={{ margin: "0 0 3px", fontSize: "11px", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Ingredients</p>
                                <ul style={{ margin: 0, paddingLeft: "16px" }}>
                                  {r.ingredients.map((ing, j) => (
                                    <li key={j} style={{ fontSize: "12px", color: "#374151" }}>
                                      {typeof ing === "string" ? ing : `${ing.name || ""}${ing.quantity ? ` — ${ing.quantity}` : ""}`}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {r.instructions && (
                              <div>
                                <p style={{ margin: "0 0 3px", fontSize: "11px", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Instructions</p>
                                <p style={{ margin: 0, fontSize: "12.5px", color: "#374151", lineHeight: 1.5 }}>{r.instructions}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Meal Plan — full width */}
              {weeks.length > 0 && (
                <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginTop: "16px" }}>
                  <SectionHead title="Meal Plan" icon="🥗" />
                  <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
                    {weeks.map((w, i) => (
                      <button key={i} onClick={() => setActiveWeek(i)}
                        style={{ padding: "7px 18px", borderRadius: "20px", border: `1.5px solid ${activeWeek === i ? "#1E8E3E" : "#e5e7eb"}`, background: activeWeek === i ? "#f0fdf4" : "#fff", color: activeWeek === i ? "#1E8E3E" : "#6b7280", fontWeight: activeWeek === i ? 700 : 500, fontSize: "12.5px", cursor: "pointer", transition: "all 0.15s" }}>
                        Week {w.week || i + 1}
                      </button>
                    ))}
                  </div>
                  <WeekPanel week={weeks[activeWeek]} />
                </div>
              )}
            </div>
          ) : null}
        </Modal.Body>

        <Modal.Footer style={{ background: "#fff", borderTop: "1px solid #e5e7eb", padding: "14px 24px" }}>
          <Button variant="outline-secondary" onClick={() => setShowDetail(false)} style={{ borderRadius: "10px", fontWeight: 600 }}>Close</Button>
        </Modal.Footer>
      </Modal>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
