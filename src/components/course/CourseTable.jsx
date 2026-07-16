import { useState, useEffect, useRef } from "react";
import { Table, Modal } from "react-bootstrap";
import { FaEye, FaSearch, FaTimes, FaFilter } from "react-icons/fa";
import { LuBookOpen, LuChevronDown, LuX, LuMail, LuPhone, LuIndianRupee, LuUsers, LuMessageSquare, LuTrendingUp, LuCheckCircle, LuClock, LuXCircle, LuArrowRight } from "react-icons/lu";
import GlobalPagination from "../common/GlobalPagination";
import courseService from "../../services/courseService";
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
const fmtRupees = (n) => n == null ? "—" : "₹" + Number(n).toLocaleString("en-IN");

// ── Styles ────────────────────────────────────────────────────────────────────
const ENQUIRY_STATUS_STYLES = {
  new:       { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", dot: "#2563eb" },
  contacted: { bg: "#fffbeb", color: "#d97706", border: "#fde68a", dot: "#d97706" },
  closed:    { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", dot: "#16a34a" },
};
const PAYMENT_STATUS_STYLES = {
  pending: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  paid:    { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  failed:  { bg: "#fef2f2", color: "#ef4444", border: "#fecaca" },
};

// ── Badge components ──────────────────────────────────────────────────────────
function EnquiryStatusBadge({ status }) {
  const s = ENQUIRY_STATUS_STYLES[status] || { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb", dot: "#9ca3af" };
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px", textTransform: "capitalize" }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}
function PaymentStatusBadge({ status }) {
  const s = PAYMENT_STATUS_STYLES[status] || { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };
  return <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, textTransform: "capitalize" }}>{status}</span>;
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
              style={{ padding: "8px 14px", cursor: "pointer", borderRadius: "8px", fontSize: "13px", fontWeight: value === o.value ? 700 : 500, color: value === o.value ? accent : "#444", background: value === o.value ? `${accent}10` : "transparent" }}>
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

function InfoRow({ label, value, mono }) {
  return (
    <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px" }}>
      <small style={{ color: "#aaa", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block" }}>{label}</small>
      <p style={{ margin: "2px 0 0", fontWeight: 600, color: "#111827", fontSize: "13px", fontFamily: mono ? "monospace" : "inherit", wordBreak: "break-all" }}>
        {value ?? <span style={{ color: "#9ca3af" }}>—</span>}
      </p>
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

function PaginationBar({ meta, onPageChange, count }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px", fontSize: "13px", color: "#888", marginTop: "4px" }}>
        <span>Showing <strong style={{ color: "#111827" }}>{count}</strong> of <strong style={{ color: "#111827" }}>{meta.total}</strong></span>
        <span style={{ background: "#f0f9f3", padding: "4px 14px", borderRadius: "20px", fontWeight: 500, color: "#1E8E3E" }}>Page {meta.page} of {meta.totalPages}</span>
      </div>
      {meta.totalPages > 1 && <GlobalPagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={onPageChange} />}
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
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>📚</div>
      <h5 style={{ fontWeight: 700, color: "#333", marginBottom: "8px" }}>No Records Found</h5>
      <p style={{ fontSize: "14px", color: "#999" }}>{msg || "Nothing to show here."}</p>
    </div>
  );
}

function MiniStatCard({ label, value, color, bg, icon: Icon, pct, barColor }) {
  return (
    <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e8ede9", padding: "16px 18px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={17} color={color} />
        </div>
        {pct != null && (
          <span style={{ fontSize: "11px", fontWeight: 700, color: color, background: bg, padding: "2px 8px", borderRadius: "20px" }}>{pct}%</span>
        )}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#111", lineHeight: 1.1 }}>{value ?? "—"}</p>
        <p style={{ margin: "3px 0 0", fontSize: "11.5px", color: "#888", fontWeight: 500 }}>{label}</p>
      </div>
      {pct != null && (
        <div style={{ height: "4px", borderRadius: "4px", background: "#f0f0f0", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: barColor || color, borderRadius: "4px", transition: "width 0.6s ease" }} />
        </div>
      )}
    </div>
  );
}

// ── Tab constants ─────────────────────────────────────────────────────────────
const VIEW_TABS = [
  { value: "stats",       label: "Overview",    color: "#1E8E3E" },
  { value: "enquiries",   label: "Enquiries",   color: "#2563eb" },
  { value: "enrollments", label: "Enrollments", color: "#7c3aed" },
];

const ENQUIRY_STATUS_OPTIONS = [
  { value: "",          label: "All Status" },
  { value: "new",       label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed",    label: "Closed" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "",        label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "paid",    label: "Paid" },
  { value: "failed",  label: "Failed" },
];

const ENQUIRY_NEXT_STATUS = { new: "contacted", contacted: "closed" };
const ENQUIRY_NEXT_LABEL  = { new: "Mark Contacted", contacted: "Mark Closed" };

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function CourseTable() {
  const [activeView, setActiveView] = useState("stats");

  // ── Stats ──────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // ── Enquiries ──────────────────────────────────────────────────────────────
  const [enquiries, setEnquiries] = useState([]);
  const [enquiryMeta, setEnquiryMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [enquiryPage, setEnquiryPage] = useState(1);
  const [enquirySearch, setEnquirySearch] = useState("");
  const [enquirySearchInput, setEnquirySearchInput] = useState("");
  const [enquiryStatus, setEnquiryStatus] = useState("");
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const enquiryTimer = useRef(null);

  // ── Enrollments ────────────────────────────────────────────────────────────
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentMeta, setEnrollmentMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [enrollmentPage, setEnrollmentPage] = useState(1);
  const [enrollmentSearch, setEnrollmentSearch] = useState("");
  const [enrollmentSearchInput, setEnrollmentSearchInput] = useState("");
  const [enrollmentStatus, setEnrollmentStatus] = useState("");
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const enrollmentTimer = useRef(null);

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [showDetail, setShowDetail] = useState(false);
  const [detailType, setDetailType] = useState(null); // "enquiry" | "enrollment"
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Fetch: Stats ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeView !== "stats") return;
    setStatsLoading(true);
    courseService.stats()
      .then((res) => setStats(res?.data?.data || null))
      .catch(() => toast.error("Failed to load course stats."))
      .finally(() => setStatsLoading(false));
  }, [activeView, refreshKey]);

  // ── Fetch: Enquiries ───────────────────────────────────────────────────────
  useEffect(() => {
    if (activeView !== "enquiries") return;
    setEnquiryLoading(true);
    const p = new URLSearchParams({ page: enquiryPage, limit: 20 });
    if (enquirySearch) p.append("search", enquirySearch);
    if (enquiryStatus) p.append("status", enquiryStatus);
    courseService.enquiries(p.toString())
      .then((res) => {
        setEnquiries(res?.data?.data || []);
        setEnquiryMeta(res?.data?.meta || { page: 1, limit: 20, total: 0, totalPages: 1 });
      })
      .catch(() => toast.error("Failed to load enquiries."))
      .finally(() => setEnquiryLoading(false));
  }, [activeView, enquiryPage, enquirySearch, enquiryStatus, refreshKey]);

  // ── Fetch: Enrollments ─────────────────────────────────────────────────────
  useEffect(() => {
    if (activeView !== "enrollments") return;
    setEnrollmentLoading(true);
    const p = new URLSearchParams({ page: enrollmentPage, limit: 20 });
    if (enrollmentSearch) p.append("search", enrollmentSearch);
    if (enrollmentStatus) p.append("payment_status", enrollmentStatus);
    courseService.enrollments(p.toString())
      .then((res) => {
        setEnrollments(res?.data?.data || []);
        setEnrollmentMeta(res?.data?.meta || { page: 1, limit: 20, total: 0, totalPages: 1 });
      })
      .catch(() => toast.error("Failed to load enrollments."))
      .finally(() => setEnrollmentLoading(false));
  }, [activeView, enrollmentPage, enrollmentSearch, enrollmentStatus, refreshKey]);

  // ── Debounced search ───────────────────────────────────────────────────────
  const handleEnquirySearch = (val) => {
    setEnquirySearchInput(val);
    clearTimeout(enquiryTimer.current);
    enquiryTimer.current = setTimeout(() => { setEnquirySearch(val); setEnquiryPage(1); }, 500);
  };
  const handleEnrollmentSearch = (val) => {
    setEnrollmentSearchInput(val);
    clearTimeout(enrollmentTimer.current);
    enrollmentTimer.current = setTimeout(() => { setEnrollmentSearch(val); setEnrollmentPage(1); }, 500);
  };

  // ── Open detail modal ──────────────────────────────────────────────────────
  const openEnquiryDetail = (id) => {
    setDetailType("enquiry");
    setDetail(null);
    setShowDetail(true);
    setDetailLoading(true);
    courseService.getEnquiry(id)
      .then((res) => setDetail(res?.data?.data || null))
      .catch(() => { toast.error("Failed to load enquiry."); setShowDetail(false); })
      .finally(() => setDetailLoading(false));
  };
  const openEnrollmentDetail = (id) => {
    setDetailType("enrollment");
    setDetail(null);
    setShowDetail(true);
    setDetailLoading(true);
    courseService.getEnrollment(id)
      .then((res) => setDetail(res?.data?.data || null))
      .catch(() => { toast.error("Failed to load enrollment."); setShowDetail(false); })
      .finally(() => setDetailLoading(false));
  };

  // ── Update enquiry status ──────────────────────────────────────────────────
  const handleUpdateStatus = (id, nextStatus) => {
    setUpdatingStatus(true);
    courseService.updateEnquiryStatus(id, { status: nextStatus })
      .then(() => {
        toast.success("Enquiry status updated.");
        setDetail((prev) => prev ? { ...prev, status: nextStatus } : prev);
        setRefreshKey((k) => k + 1);
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to update status."))
      .finally(() => setUpdatingStatus(false));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

        {/* ── View tabs ── */}
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

        {/* ════════════════════════════════════════════════════════════════
            VIEW 1 — STATS OVERVIEW
        ════════════════════════════════════════════════════════════════ */}
        {activeView === "stats" && (
          statsLoading ? <LoadingState /> : !stats ? (
            <EmptyState msg="No stats available." />
          ) : (
            <StatsOverview stats={stats} />
          )
        )}

        {/* ════════════════════════════════════════════════════════════════
            VIEW 2 — ENQUIRIES
        ════════════════════════════════════════════════════════════════ */}
        {activeView === "enquiries" && (
          <>
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "center", flexWrap: "wrap" }}>
              <SearchBar value={enquirySearchInput} onChange={handleEnquirySearch} placeholder="Search name, email, phone..." />
              <FilterDropdown value={enquiryStatus} onChange={(v) => { setEnquiryStatus(v); setEnquiryPage(1); }} options={ENQUIRY_STATUS_OPTIONS} placeholder="All Status" accent="#2563eb" />
              {(enquirySearch || enquiryStatus) && (
                <button onClick={() => { setEnquirySearch(""); setEnquirySearchInput(""); setEnquiryStatus(""); setEnquiryPage(1); }}
                  style={{ height: "40px", border: "1px solid #fecaca", borderRadius: "10px", padding: "0 14px", background: "#fef2f2", cursor: "pointer", color: "#ef4444", fontWeight: 600, fontSize: "12.5px", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
                  <LuX size={13} /> Clear
                </button>
              )}
            </div>

            {enquiryLoading ? <LoadingState /> : enquiries.length === 0 ? <EmptyState msg="No enquiries found." /> : (
              <>
                <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #edf1ee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <Table className="table mb-0" style={{ borderCollapse: "collapse", minWidth: "900px" }}>
                    <thead>
                      <tr>{["S.No", "Name", "Contact", "Qualification", "Status", "Date", "Actions"].map((c) => <TH key={c}>{c}</TH>)}</tr>
                    </thead>
                    <tbody>
                      {enquiries.map((e, i) => (
                        <TR key={e.id} index={i}>
                          <TD style={{ fontWeight: 700, color: "#2563eb", fontSize: "13px" }}>{(enquiryMeta.page - 1) * enquiryMeta.limit + i + 1}</TD>
                          <TD>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#111827" }}>{e.name || "—"}</p>
                          </TD>
                          <TD>
                            <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12.5px", color: "#374151" }}>
                              <LuMail size={11} color="#888" /> {e.email || "—"}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                              <LuPhone size={11} /> {e.phone || "—"}
                            </div>
                          </TD>
                          <TD style={{ fontSize: "12.5px", color: "#374151" }}>{e.qualification || "—"}</TD>
                          <TD><EnquiryStatusBadge status={e.status} /></TD>
                          <TD style={{ fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap" }}>{formatDate(e.created_at)}</TD>
                          <TD>
                            <ActionBtn onClick={() => openEnquiryDetail(e.id)} title="View Details" bg="#eff6ff">
                              <FaEye style={{ color: "#3b82f6", fontSize: "13px" }} />
                            </ActionBtn>
                          </TD>
                        </TR>
                      ))}
                    </tbody>
                  </Table>
                </div>
                <PaginationBar meta={enquiryMeta} onPageChange={setEnquiryPage} count={enquiries.length} />
              </>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════
            VIEW 3 — ENROLLMENTS
        ════════════════════════════════════════════════════════════════ */}
        {activeView === "enrollments" && (
          <>
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "center", flexWrap: "wrap" }}>
              <SearchBar value={enrollmentSearchInput} onChange={handleEnrollmentSearch} placeholder="Search name, email, phone..." />
              <FilterDropdown value={enrollmentStatus} onChange={(v) => { setEnrollmentStatus(v); setEnrollmentPage(1); }} options={PAYMENT_STATUS_OPTIONS} placeholder="All Status" accent="#7c3aed" />
              {(enrollmentSearch || enrollmentStatus) && (
                <button onClick={() => { setEnrollmentSearch(""); setEnrollmentSearchInput(""); setEnrollmentStatus(""); setEnrollmentPage(1); }}
                  style={{ height: "40px", border: "1px solid #fecaca", borderRadius: "10px", padding: "0 14px", background: "#fef2f2", cursor: "pointer", color: "#ef4444", fontWeight: 600, fontSize: "12.5px", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
                  <LuX size={13} /> Clear
                </button>
              )}
            </div>

            {enrollmentLoading ? <LoadingState /> : enrollments.length === 0 ? <EmptyState msg="No enrollments found." /> : (
              <>
                <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #edf1ee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <Table className="table mb-0" style={{ borderCollapse: "collapse", minWidth: "1000px" }}>
                    <thead>
                      <tr>{["S.No", "Name", "Contact", "Course Fee", "Payment Status", "Order ID", "Payment ID", "Enrolled On", "Actions"].map((c) => <TH key={c}>{c}</TH>)}</tr>
                    </thead>
                    <tbody>
                      {enrollments.map((en, i) => (
                        <TR key={en.id} index={i}>
                          <TD style={{ fontWeight: 700, color: "#7c3aed", fontSize: "13px" }}>{(enrollmentMeta.page - 1) * enrollmentMeta.limit + i + 1}</TD>
                          <TD>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#111827" }}>{en.name || "—"}</p>
                          </TD>
                          <TD>
                            <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12.5px", color: "#374151" }}>
                              <LuMail size={11} color="#888" /> {en.email || "—"}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                              <LuPhone size={11} /> {en.phone || "—"}
                            </div>
                          </TD>
                          <TD style={{ fontWeight: 700, fontSize: "13px", color: "#111827" }}>{fmtRupees(en.course_fee)}</TD>
                          <TD><PaymentStatusBadge status={en.payment_status} /></TD>
                          <TD style={{ fontSize: "11.5px", color: "#374151", fontFamily: "monospace" }}>{en.razorpay_order_id || "—"}</TD>
                          <TD style={{ fontSize: "11.5px", color: "#374151", fontFamily: "monospace" }}>{en.razorpay_payment_id || "—"}</TD>
                          <TD style={{ fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap" }}>{formatDate(en.created_at)}</TD>
                          <TD>
                            <ActionBtn onClick={() => openEnrollmentDetail(en.id)} title="View Details" bg="#f5f3ff">
                              <FaEye style={{ color: "#7c3aed", fontSize: "13px" }} />
                            </ActionBtn>
                          </TD>
                        </TR>
                      ))}
                    </tbody>
                  </Table>
                </div>
                <PaginationBar meta={enrollmentMeta} onPageChange={setEnrollmentPage} count={enrollments.length} />
              </>
            )}
          </>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          DETAIL MODAL
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="lg" centered scrollable>
        <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #1E8E3E 0%, #0f5c26 100%)", color: "#fff", borderBottom: "none", padding: "1.2rem 1.8rem" }}>
          <Modal.Title style={{ fontWeight: 800, fontSize: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LuBookOpen size={18} color="#fff" />
            </div>
            {detailType === "enquiry" ? "Enquiry Detail" : "Enrollment Detail"}
            {detail && <span style={{ background: "rgba(255,255,255,0.18)", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px" }}>#{detail.id}</span>}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ background: "#f0f4f8", padding: "24px" }}>
          {detailLoading ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <div className="spinner-border" style={{ color: "#1E8E3E", width: "2.5rem", height: "2.5rem" }} role="status" />
              <p style={{ marginTop: "16px", color: "#999" }}>Loading details...</p>
            </div>
          ) : detail ? (
            detailType === "enquiry" ? (
              <EnquiryDetail detail={detail} onUpdateStatus={handleUpdateStatus} updatingStatus={updatingStatus} />
            ) : (
              <EnrollmentDetail detail={detail} />
            )
          ) : null}
        </Modal.Body>
      </Modal>
    </div>
  );
}

// ── Stats Overview ────────────────────────────────────────────────────────────
function StatsOverview({ stats }) {
  const enr = stats.enquiries  || {};
  const enl = stats.enrollments || {};
  const total = enl.total || 0;
  const paidPct    = total ? Math.round((enl.paid    || 0) / total * 100) : 0;
  const pendingPct = total ? Math.round((enl.pending || 0) / total * 100) : 0;
  const failedPct  = total ? Math.round((enl.failed  || 0) / total * 100) : 0;

  const enqTotal       = enr.total    || 0;
  const newPct         = enqTotal ? Math.round((enr.new       || 0) / enqTotal * 100) : 0;
  const contactedPct   = enqTotal ? Math.round((enr.contacted || 0) / enqTotal * 100) : 0;
  const closedPct      = enqTotal ? Math.round((enr.closed    || 0) / enqTotal * 100) : 0;

  return (
    <div>
      {/* ── Hero Revenue Banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #1E8E3E 0%, #0d5c26 60%, #052e13 100%)",
        borderRadius: "16px", padding: "28px 32px", marginBottom: "24px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", bottom: "-60px", right: "80px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <LuIndianRupee size={20} color="#fff" />
              </div>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "1px" }}>Total Revenue</span>
            </div>
            <p style={{ margin: 0, fontSize: "40px", fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-1px" }}>
              {fmtRupees(enl.total_revenue)}
            </p>
            <p style={{ margin: "6px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>
              from {(enl.paid || 0).toLocaleString("en-IN")} paid enrollments
            </p>
          </div>

          {/* Right pill stats */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {[
              { label: "Total", value: enl.total || 0, color: "#fff", bg: "rgba(255,255,255,0.12)" },
              { label: "Paid",  value: enl.paid  || 0, color: "#4ade80", bg: "rgba(74,222,128,0.15)" },
            ].map((s) => (
              <div key={s.label} style={{ background: s.bg, borderRadius: "12px", padding: "12px 20px", textAlign: "center", minWidth: "90px", backdropFilter: "blur(8px)" }}>
                <p style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value.toLocaleString("en-IN")}</p>
                <p style={{ margin: "4px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment conversion bar */}
        <div style={{ position: "relative", marginTop: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Payment Breakdown</span>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)" }}>{total} total enrollments</span>
          </div>
          <div style={{ height: "8px", borderRadius: "8px", background: "rgba(255,255,255,0.12)", overflow: "hidden", display: "flex" }}>
            <div style={{ width: `${paidPct}%`, background: "#4ade80", transition: "width 0.8s ease" }} />
            <div style={{ width: `${pendingPct}%`, background: "#fbbf24", transition: "width 0.8s ease" }} />
            <div style={{ width: `${failedPct}%`, background: "#f87171", transition: "width 0.8s ease" }} />
          </div>
          <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
            {[
              { dot: "#4ade80", label: `Paid ${paidPct}%` },
              { dot: "#fbbf24", label: `Pending ${pendingPct}%` },
              { dot: "#f87171", label: `Failed ${failedPct}%` },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: l.dot, flexShrink: 0 }} />
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Enrollment Detail Cards ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
        <div style={{ width: "3px", height: "16px", background: "#7c3aed", borderRadius: "4px" }} />
        <span style={{ fontWeight: 700, fontSize: "13px", color: "#374151", textTransform: "uppercase", letterSpacing: "0.7px" }}>Enrollment Breakdown</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px", marginBottom: "28px" }}>
        <MiniStatCard label="Total Enrollments" value={(enl.total    || 0).toLocaleString("en-IN")} color="#7c3aed" bg="#f5f3ff" icon={LuUsers}       />
        <MiniStatCard label="Paid"              value={(enl.paid     || 0).toLocaleString("en-IN")} color="#16a34a" bg="#f0fdf4" icon={LuCheckCircle} pct={paidPct}    barColor="#16a34a" />
        <MiniStatCard label="Pending Payment"   value={(enl.pending  || 0).toLocaleString("en-IN")} color="#d97706" bg="#fffbeb" icon={LuClock}        pct={pendingPct} barColor="#f59e0b" />
        <MiniStatCard label="Failed"            value={(enl.failed   || 0).toLocaleString("en-IN")} color="#ef4444" bg="#fef2f2" icon={LuXCircle}      pct={failedPct}  barColor="#ef4444" />
      </div>

      {/* ── Enquiries Section ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
        <div style={{ width: "3px", height: "16px", background: "#2563eb", borderRadius: "4px" }} />
        <span style={{ fontWeight: 700, fontSize: "13px", color: "#374151", textTransform: "uppercase", letterSpacing: "0.7px" }}>Enquiry Pipeline</span>
      </div>

      {/* Funnel row */}
      <div style={{ background: "#f8fafc", borderRadius: "14px", border: "1px solid #e8ede9", padding: "20px 24px", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0", flexWrap: "wrap" }}>
          {[
            { label: "New Leads",  value: enr.new       || 0, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: LuMessageSquare, pct: newPct },
            { label: "Contacted",  value: enr.contacted || 0, color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: LuPhone,          pct: contactedPct },
            { label: "Closed",     value: enr.closed    || 0, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", icon: LuCheckCircle,    pct: closedPct },
          ].map((s, idx, arr) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: "140px" }}>
              <div style={{ flex: 1, background: "#fff", borderRadius: "12px", border: `1.5px solid ${s.border}`, padding: "16px 18px", position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <s.icon size={15} color={s.color} />
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: s.color, background: s.bg, padding: "2px 8px", borderRadius: "20px" }}>{s.pct}%</span>
                </div>
                <p style={{ margin: 0, fontSize: "26px", fontWeight: 900, color: "#111", lineHeight: 1 }}>{s.value.toLocaleString("en-IN")}</p>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#888", fontWeight: 500 }}>{s.label}</p>
                <div style={{ marginTop: "10px", height: "3px", borderRadius: "3px", background: "#f0f0f0", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${s.pct}%`, background: s.color, borderRadius: "3px" }} />
                </div>
              </div>
              {idx < arr.length - 1 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 10px", flexShrink: 0 }}>
                  <LuArrowRight size={18} color="#cbd5e1" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Total enquiries summary pill */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: "1px solid #e8ede9", borderRadius: "12px", padding: "14px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LuTrendingUp size={17} color="#2563eb" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "11px", color: "#888", fontWeight: 500 }}>Total Enquiries Received</p>
            <p style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#111" }}>{(enr.total || 0).toLocaleString("en-IN")}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { label: "New",       val: enr.new       || 0, color: "#2563eb", bg: "#eff6ff" },
            { label: "Contacted", val: enr.contacted || 0, color: "#d97706", bg: "#fffbeb" },
            { label: "Closed",    val: enr.closed    || 0, color: "#16a34a", bg: "#f0fdf4" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center", background: s.bg, borderRadius: "10px", padding: "8px 14px", minWidth: "70px" }}>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: s.color }}>{s.val.toLocaleString("en-IN")}</p>
              <p style={{ margin: 0, fontSize: "10px", color: "#888", fontWeight: 500 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .course-funnel-row { flex-direction: column !important; }
        }
      `}</style>
    </div>
  );
}

// ── Enquiry Detail ─────────────────────────────────────────────────────────────
function EnquiryDetail({ detail, onUpdateStatus, updatingStatus }) {
  const next = ENQUIRY_NEXT_STATUS[detail.status];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <InfoRow label="Name"          value={detail.name} />
        <InfoRow label="Email"         value={detail.email} />
        <InfoRow label="Phone"         value={detail.phone} />
        <InfoRow label="Qualification" value={detail.qualification} />
      </div>
      <InfoRow label="Message" value={detail.message} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <InfoRow label="Status"     value={<EnquiryStatusBadge status={detail.status} />} />
        <InfoRow label="Created At" value={formatDateTime(detail.created_at)} />
        <InfoRow label="Updated At" value={formatDateTime(detail.updated_at)} />
      </div>
      {next && (
        <button
          onClick={() => onUpdateStatus(detail.id, next)}
          disabled={updatingStatus}
          style={{ marginTop: "8px", padding: "10px 24px", borderRadius: "10px", border: "none", background: "#1E8E3E", color: "#fff", fontWeight: 700, fontSize: "13.5px", cursor: updatingStatus ? "not-allowed" : "pointer", opacity: updatingStatus ? 0.7 : 1, alignSelf: "flex-start" }}>
          {updatingStatus ? "Updating..." : ENQUIRY_NEXT_LABEL[detail.status]}
        </button>
      )}
    </div>
  );
}

// ── Enrollment Detail ──────────────────────────────────────────────────────────
function EnrollmentDetail({ detail }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <InfoRow label="Name"           value={detail.name} />
        <InfoRow label="Email"          value={detail.email} />
        <InfoRow label="Phone"          value={detail.phone} />
        <InfoRow label="Course Fee"     value={fmtRupees(detail.course_fee)} />
        <InfoRow label="Payment Status" value={<PaymentStatusBadge status={detail.payment_status} />} />
        <InfoRow label="Enrolled On"    value={formatDateTime(detail.created_at)} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <InfoRow label="Razorpay Order ID"   value={detail.razorpay_order_id}   mono />
        <InfoRow label="Razorpay Payment ID" value={detail.razorpay_payment_id} mono />
        <InfoRow label="Razorpay Signature"  value={detail.razorpay_signature}  mono />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <InfoRow label="Payment Verified At" value={formatDateTime(detail.payment_verified_at)} />
        <InfoRow label="Payment Failed At"   value={formatDateTime(detail.payment_failed_at)} />
        <InfoRow label="Updated At"          value={formatDateTime(detail.updated_at)} />
      </div>
    </div>
  );
}
