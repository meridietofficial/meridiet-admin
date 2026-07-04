import { useState, useEffect, useRef } from "react";
import { useRouter } from "../../helpers/useRouter";
import { Table, FormControl } from "react-bootstrap";
import { FaSort, FaChevronDown } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { LuBrainCircuit, LuSend, LuFileText } from "react-icons/lu";
import GlobalPagination from "../common/GlobalPagination";
import API from "../../helpers/api";
import toast from "react-hot-toast";

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS = {
  generating: { bg: "#FFF8E1", color: "#F59E0B", border: "rgba(245,158,11,0.3)",  label: "Generating" },
  completed:  { bg: "#EFF6FF", color: "#3b82f6", border: "rgba(59,130,246,0.3)",  label: "Pending Review" },
  failed:     { bg: "#FEF2F2", color: "#EF4444", border: "rgba(239,68,68,0.3)",   label: "Failed" },
  sent:       { bg: "#ECFDF5", color: "#10B981", border: "rgba(16,185,129,0.3)",  label: "Sent" },
};

const TABS = [
  { key: "completed", label: "Pending Review" },
  { key: "sent",      label: "Sent" },
  { key: "",          label: "All" },
  { key: "generating", label: "Generating" },
  { key: "failed",    label: "Failed" },
];

const SORT_OPTIONS = [
  { key: "new", label: "Newest First" },
  { key: "old", label: "Oldest First" },
];

const SORT_LABEL = { new: "Newest", old: "Oldest" };

const COLUMNS = ["S.No", "Client", "Contact", "Goal & Diet", "Delivery", "Status", "Created", "Actions"];
const COL_W = {
  "S.No": "52px", Client: "175px", Contact: "190px", "Goal & Diet": "175px",
  Delivery: "135px", Status: "125px", Created: "135px", Actions: "180px",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const statusStyle = (s) => STATUS[s] || { bg: "#F3F4F6", color: "#9CA3AF", border: "rgba(156,163,175,0.3)", label: s || "Unknown" };

const formatDate = (iso) => {
  if (!iso) return "N/A";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const humanize = (v) =>
  v ? String(v).split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "";

const toList = (v) => {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === "string" && v.trim()) return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
};

// ── Tab Button ───────────────────────────────────────────────────────────────

const TabBtn = ({ active, onClick, children, count }) => (
  <button
    onClick={onClick}
    style={{
      padding: "10px 20px", border: "none", borderRadius: "10px", cursor: "pointer",
      fontWeight: 700, fontSize: "13px", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px",
      background: active ? "#1E8E3E" : "#fff",
      color: active ? "#fff" : "#6b7280",
      boxShadow: active ? "0 4px 12px rgba(30,142,62,0.3)" : "0 1px 4px rgba(0,0,0,0.08)",
    }}
  >
    {children}
    {count != null && (
      <span style={{ background: active ? "rgba(255,255,255,0.25)" : "#f0f9f3", color: active ? "#fff" : "#1E8E3E", borderRadius: "20px", padding: "1px 8px", fontSize: "11px", fontWeight: 700 }}>
        {count}
      </span>
    )}
  </button>
);

// ── Main Component ────────────────────────────────────────────────────────────

export default function AIDietPlanTable({ activeTab, onTabChange, onCountsChange }) {
  const router = useRouter();

  const [plans, setPlans]           = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [tabCounts, setTabCounts]   = useState({ completed: null, sent: null });

  const [search, setSearch]                     = useState("");
  const [debouncedSearch, setDebouncedSearch]   = useState("");
  const [loading, setLoading]                   = useState(false);
  const [sortType, setSortType]                 = useState("new");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortRef = useRef(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setCurrentPage(1); }, 500);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { fetchPlans(); }, [activeTab, debouncedSearch, sortType, currentPage]);
  useEffect(() => { fetchTabCounts(); }, [debouncedSearch]);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const buildParams = () => {
    const p = new URLSearchParams();
    if (activeTab) p.append("status", activeTab);
    if (debouncedSearch) p.append("search", debouncedSearch);
    p.append("page", currentPage);
    p.append("limit", pagination.limit);
    return p.toString();
  };

  const fetchPlans = () => {
    setLoading(true);
    API.apiGet("aiDietPlans", `?${buildParams()}`)
      .then((res) => {
        const d = res?.data?.data || {};
        setPlans(d.plans || []);
        const pg = d.pagination || {};
        setPagination((prev) => ({ ...prev, page: pg.page || 1, total: pg.total || 0, pages: pg.pages || 1 }));
      })
      .catch(() => toast.error("Failed to fetch AI diet plans."))
      .finally(() => setLoading(false));
  };

  const fetchTabCounts = () => {
    const base = new URLSearchParams();
    if (debouncedSearch) base.append("search", debouncedSearch);
    base.append("page", "1"); base.append("limit", "1");

    const pending = new URLSearchParams(base); pending.append("status", "completed");
    const sent    = new URLSearchParams(base); sent.append("status", "sent");

    Promise.all([
      API.apiGet("aiDietPlans", `?${pending}`).then((r) => r?.data?.data?.pagination?.total ?? null).catch(() => null),
      API.apiGet("aiDietPlans", `?${sent}`).then((r)    => r?.data?.data?.pagination?.total ?? null).catch(() => null),
    ]).then(([completedCount, sentCount]) => {
      const counts = { completed: completedCount, sent: sentCount };
      setTabCounts(counts);
      if (onCountsChange) onCountsChange(counts);
    });
  };

  return (
    <div>
      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <TabBtn
            key={tab.key}
            active={activeTab === tab.key}
            onClick={() => { onTabChange(tab.key); setCurrentPage(1); }}
            count={tab.key === "completed" ? tabCounts.completed : tab.key === "sent" ? tabCounts.sent : undefined}
          >
            {tab.label}
          </TabBtn>
        ))}
      </div>

      {/* ── Main Card ── */}
      <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

        {/* ── Toolbar ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>

          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <svg style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <FormControl
              type="text"
              placeholder="Search by name, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ height: "42px", borderRadius: "10px", border: "1px solid #e5e5e5", paddingLeft: "40px", fontSize: "13px", boxShadow: "none" }}
            />
          </div>

          {/* Sort */}
          <div style={{ position: "relative" }} ref={sortRef}>
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              style={{ height: "42px", border: `1px solid ${sortType ? "#1E8E3E" : "#e5e5e5"}`, borderRadius: "10px", padding: "0 14px", background: sortType ? "#f0f9f3" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", minWidth: "140px", fontWeight: 600, fontSize: "13px", color: sortType ? "#1E8E3E" : "#555" }}
            >
              <FaSort style={{ color: sortType ? "#1E8E3E" : "#aaa", fontSize: "13px" }} />
              {sortType ? `Sort: ${SORT_LABEL[sortType]}` : "Sort By"}
              <FaChevronDown style={{ marginLeft: "auto", fontSize: "11px", color: "#aaa" }} />
            </button>
            {showSortDropdown && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#fff", border: "1px solid #edf1ee", borderRadius: "12px", minWidth: "160px", zIndex: 1000, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: "6px" }}>
                {SORT_OPTIONS.map(({ key, label }) => (
                  <div key={key} onClick={() => { setSortType(key); setShowSortDropdown(false); setCurrentPage(1); }}
                    style={{ padding: "9px 14px", cursor: "pointer", borderRadius: "8px", fontSize: "13px", fontWeight: sortType === key ? 700 : 500, color: sortType === key ? "#1E8E3E" : "#444", background: sortType === key ? "#f0f9f3" : "transparent" }}>
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div className="spinner-border" style={{ color: "#1E8E3E", width: "2.5rem", height: "2.5rem" }} role="status" />
            <p style={{ marginTop: "16px", color: "#999", fontSize: "14px", fontWeight: 500 }}>Loading…</p>
          </div>
        ) : plans.length > 0 ? (
          <>
            <div style={{ borderRadius: "12px", border: "1px solid #edf1ee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflowX: "auto" }}>
              <Table className="table mb-0" style={{ borderCollapse: "collapse", tableLayout: "fixed", width: "100%", minWidth: "1167px" }}>
                <thead>
                  <tr>
                    {COLUMNS.map((col) => (
                      <th key={col} style={{ background: "#1E8E3E", color: "#fff", fontWeight: 600, fontSize: "12px", padding: "12px 14px", whiteSpace: "nowrap", borderBottom: "2px solid #166C31", letterSpacing: "0.3px", width: COL_W[col] || "auto" }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p, i) => {
                    const st = statusStyle(p.status);
                    const goals = toList(p.form_goals);
                    const deliveryMethods = toList(p.form_delivery_method);
                    const sno = (pagination.page - 1) * pagination.limit + i + 1;
                    return (
                      <tr key={p.id}
                        style={{ borderBottom: "1px solid #edf1ee", background: i % 2 === 0 ? "#fff" : "#fafcfa", transition: "background 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9f3")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafcfa")}
                      >
                        {/* S.No */}
                        <td style={{ padding: "10px 14px", fontSize: "13px", fontWeight: 700, color: "#1E8E3E", verticalAlign: "middle" }}>{sno}</td>

                        {/* Client */}
                        <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #1E8E3E, #4ade80)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "14px", flexShrink: 0 }}>
                              {(p.client_name || p.form_full_name || "U").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "130px" }}>{p.client_name || p.form_full_name || "N/A"}</p>
                              <p style={{ margin: 0, fontSize: "11px", color: "#aaa" }}>{p.diet_type ? humanize(p.diet_type) : "—"}</p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                            <span style={{ fontSize: "12px", color: "#3b82f6", fontWeight: 500, wordBreak: "break-all" }}>{p.form_email || "—"}</span>
                            <span style={{ fontSize: "12px", color: "#555" }}>{p.form_whatsapp || "—"}</span>
                          </div>
                        </td>

                        {/* Goal & Diet */}
                        <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                          {goals.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                              <span style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "20px", padding: "3px 9px", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100px" }}>{humanize(goals[0])}</span>
                              {goals.length > 1 && <span style={{ background: "#f1f5f9", color: "#64748b", borderRadius: "20px", padding: "3px 8px", fontSize: "11px", fontWeight: 600 }}>+{goals.length - 1}</span>}
                            </div>
                          ) : <span style={{ fontSize: "12px", color: "#aaa" }}>{p.primary_goal || "—"}</span>}
                          {p.calorie_range && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#6b7280" }}>{p.calorie_range}</p>}
                        </td>

                        {/* Delivery */}
                        <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                            {deliveryMethods.length ? deliveryMethods.map((m) => (
                              <span key={m} style={{ background: "#f0f9f3", color: "#1E8E3E", border: "1px solid rgba(30,142,62,0.2)", borderRadius: "20px", padding: "3px 9px", fontSize: "11px", fontWeight: 600 }}>{humanize(m)}</span>
                            )) : <span style={{ fontSize: "12px", color: "#aaa" }}>—</span>}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                          <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: "20px", padding: "4px 12px", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap" }}>{st.label}</span>
                          {p.sent_at && <p style={{ margin: "4px 0 0", fontSize: "10px", color: "#9ca3af" }}>{formatDate(p.sent_at)}</p>}
                        </td>

                        {/* Created */}
                        <td style={{ padding: "10px 14px", verticalAlign: "middle", fontSize: "12px", color: "#555", whiteSpace: "nowrap" }}>{formatDate(p.created_at)}</td>

                        {/* Actions */}
                        <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {/* Review / Edit button — always shown */}
                            <button
                              onClick={() => router.push(`/dashboard/ai-diet-plans/${p.id}`)}
                              style={{ height: "32px", borderRadius: "8px", background: "#f0f9f3", border: "1px solid rgba(30,142,62,0.3)", display: "flex", alignItems: "center", gap: "5px", padding: "0 10px", cursor: "pointer", fontSize: "12px", fontWeight: 700, color: "#1E8E3E", transition: "all 0.2s", whiteSpace: "nowrap" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "#1E8E3E"; e.currentTarget.style.color = "#fff"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "#f0f9f3"; e.currentTarget.style.color = "#1E8E3E"; }}
                            >
                              <LuBrainCircuit size={12} /> Review
                            </button>
                            {/* View Diet Plan — only when plan data is ready */}
                            {(p.status === "completed" || p.status === "sent") && (
                              <button
                                onClick={() => router.push(`/dashboard/ai-diet-plans/${p.id}/view`)}
                                style={{ height: "32px", borderRadius: "8px", background: "#eff6ff", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", gap: "5px", padding: "0 10px", cursor: "pointer", fontSize: "12px", fontWeight: 700, color: "#3b82f6", transition: "all 0.2s", whiteSpace: "nowrap" }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#3b82f6"; e.currentTarget.style.color = "#fff"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.color = "#3b82f6"; }}
                              >
                                <LuFileText size={12} /> View Plan
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px", fontSize: "13px", color: "#888", marginTop: "4px" }}>
              <span>Showing <strong style={{ color: "#111827" }}>{plans.length}</strong> of <strong style={{ color: "#111827" }}>{pagination.total}</strong> plans</span>
              <span style={{ background: "#f0f9f3", padding: "4px 14px", borderRadius: "20px", fontWeight: 500, color: "#1E8E3E" }}>Page {pagination.page} of {pagination.pages}</span>
            </div>

            {pagination.pages > 1 && (
              <GlobalPagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={setCurrentPage} />
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", borderRadius: "12px", border: "1px solid #edf1ee" }}>
            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center" }}><LuBrainCircuit size={48} color="#c5e3d0" /></div>
            <h5 style={{ fontWeight: 700, color: "#333", marginBottom: "8px" }}>No Plans Found</h5>
            <p style={{ fontSize: "14px", color: "#999" }}>
              {debouncedSearch ? `No results for "${debouncedSearch}"` : "No AI-generated diet plans found for this status."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
