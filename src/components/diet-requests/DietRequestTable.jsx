import { useState, useEffect, useRef } from "react";
import { useRouter } from "../../helpers/useRouter";
import { Table, FormControl, Modal, Button } from "react-bootstrap";
import { FaSort, FaChevronDown, FaEye, FaFileExcel, FaCalendarAlt, FaFilter } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { LuSalad } from "react-icons/lu";
import GlobalPagination from "../common/GlobalPagination";
import API from "../../helpers/api";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  pending:     { bg: "#FFF8E1", color: "#F59E0B", border: "rgba(245,158,11,0.3)",   label: "Pending" },
  generating:  { bg: "#FFF8E1", color: "#F59E0B", border: "rgba(245,158,11,0.3)",   label: "Generating…" },
  in_progress: { bg: "#EFF6FF", color: "#3b82f6", border: "rgba(59,130,246,0.3)",   label: "In Progress" },
  completed:   { bg: "#EFF6FF", color: "#3b82f6", border: "rgba(59,130,246,0.3)",   label: "Pending Review" },
  failed:      { bg: "#FEF2F2", color: "#EF4444", border: "rgba(239,68,68,0.3)",    label: "Failed" },
  rejected:    { bg: "#FEF2F2", color: "#EF4444", border: "rgba(239,68,68,0.3)",    label: "Rejected" },
  sent:        { bg: "#ECFDF5", color: "#10B981", border: "rgba(16,185,129,0.3)",   label: "Sent" },
  no_plan:     { bg: "#F3F4F6", color: "#9CA3AF", border: "rgba(156,163,175,0.3)",  label: "Not Started" },
};

const PLAN_TYPES = { 1: "1 Week Plan", 2: "1 Month Plan", 3: "3 Month Plan" };
const PLAN_FILTER_OPTIONS = [
  { key: "1", label: "1 Week Plan" },
  { key: "2", label: "1 Month Plan" },
  { key: "3", label: "3 Month Plan" },
];

const PLAN_STATUS_OPTIONS = [
  { key: "generating", label: "Generating…" },
  { key: "completed",  label: "Pending Review" },
  { key: "failed",     label: "Failed" },
  { key: "sent",       label: "Sent" },
];

const SORT_OPTIONS = [
  { key: "new", label: "Newest First", sortBy: "created_at", sortOrder: "DESC" },
  { key: "old", label: "Oldest First", sortBy: "created_at", sortOrder: "ASC"  },
  { key: "a-z", label: "Name A – Z",   sortBy: "full_name",  sortOrder: "ASC"  },
  { key: "z-a", label: "Name Z – A",   sortBy: "full_name",  sortOrder: "DESC" },
];
const SORT_LABEL = { new: "Newest", old: "Oldest", "a-z": "A – Z", "z-a": "Z – A" };

// ── Helpers ──────────────────────────────────────────────────────────────────

const statusStyle = (s) => STATUS_COLORS[s] || STATUS_COLORS.pending;

const formatDate = (iso) => {
  if (!iso) return "N/A";
  const d = new Date(iso);
  const date = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  const hours = String(d.getHours()).padStart(2, "0");
  const mins  = String(d.getMinutes()).padStart(2, "0");
  return `${date} ${hours}:${mins}`;
};

const humanize = (val) => {
  if (val === null || val === undefined || val === "") return "";
  return String(val).split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

const toList = (val) => {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === "string" && val.trim()) return val.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
};

const formatHeight = (r) => {
  if (!r.height) return "N/A";
  return r.height_unit === "ft_in" ? `${r.height} ft` : `${r.height} cm`;
};

const formatWeight = (r) => {
  if (!r.weight) return "N/A";
  const w = parseFloat(r.weight);
  return `${Number.isNaN(w) ? r.weight : w} ${r.weight_unit || ""}`.trim();
};

// ── Tab Button ───────────────────────────────────────────────────────────────

const TabBtn = ({ active, onClick, children, count }) => (
  <button
    onClick={onClick}
    style={{
      padding: "10px 24px", border: "none", borderRadius: "10px", cursor: "pointer",
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

export default function DietRequestTable({ activeTab, onTabChange, onStatsChange }) {
  const [requests, setRequests]     = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [tabCounts, setTabCounts]   = useState({ paid: null, unpaid: null });

  const [search, setSearch]                 = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading]               = useState(false);
  const [isExporting, setIsExporting]       = useState(false);

  const [sortType, setSortType]                 = useState("");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortRef = useRef(null);

  const [planTypeFilter, setPlanTypeFilter]             = useState("");
  const [showPlanTypeDropdown, setShowPlanTypeDropdown] = useState(false);
  const planTypeRef = useRef(null);

  const [planStatusFilter, setPlanStatusFilter]           = useState("");
  const [showPlanStatusDropdown, setShowPlanStatusDropdown] = useState(false);
  const planStatusRef = useRef(null);

  const [startDate, setStartDate]           = useState("");
  const [endDate, setEndDate]               = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateRef = useRef(null);

  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected]     = useState(null);
  const router = useRouter();

  const apiKey = activeTab === "paid" ? "paidDietCharts" : "dietFormRequests";

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setCurrentPage(1); }, 500);
    return () => clearTimeout(t);
  }, [search]);

  // Refetch on filter / tab change
  useEffect(() => { fetchRequests(); }, [activeTab, debouncedSearch, sortType, planTypeFilter, planStatusFilter, currentPage, startDate, endDate]);

  // Stats whenever tab / search / date changes
  useEffect(() => { fetchStats(); }, [activeTab, debouncedSearch, startDate, endDate]);

  // Fetch tab counts once per tab switch
  useEffect(() => { fetchTabCounts(); }, [debouncedSearch, startDate, endDate]);

  // ── Params builder ─────────────────────────────────────────────────────────

  const buildParams = (overrides = {}) => {
    const p = new URLSearchParams();
    const s  = overrides.search    !== undefined ? overrides.search    : debouncedSearch;
    const st = overrides.sortType  !== undefined ? overrides.sortType  : sortType;
    const sd = overrides.startDate !== undefined ? overrides.startDate : startDate;
    const ed = overrides.endDate   !== undefined ? overrides.endDate   : endDate;
    const pg = overrides.page      !== undefined ? overrides.page      : currentPage;
    const lm = overrides.limit     !== undefined ? overrides.limit     : pagination.limit;

    if (s) p.append("search", s);

    const opt = SORT_OPTIONS.find((o) => o.key === st);
    if (opt) { p.append("sortBy", opt.sortBy); p.append("sortOrder", opt.sortOrder); }

    if (sd) p.append("startDate", sd);
    if (ed) p.append("endDate", ed);
    const pt = overrides.planType !== undefined ? overrides.planType : planTypeFilter;
    if (pt) p.append("planType", pt);
    const ps = overrides.planStatus !== undefined ? overrides.planStatus : planStatusFilter;
    if (ps) p.append("planStatus", ps);

    p.append("page", pg);
    p.append("limit", lm);
    return p.toString();
  };

  // ── Fetch functions ────────────────────────────────────────────────────────

  const fetchRequests = () => {
    setLoading(true);
    API.apiGet(apiKey, `?${buildParams()}`)
      .then((res) => {
        setRequests(res?.data?.data || []);
        const meta = res?.data?.meta || {};
        setPagination({ page: meta.page || 1, limit: meta.limit || 10, total: meta.total || 0, totalPages: meta.totalPages || 1 });
      })
      .catch(() => toast.error("Failed to fetch diet chart requests."))
      .finally(() => setLoading(false));
  };

  const fetchStats = () => {
    if (!onStatsChange) return;
    onStatsChange({ total: null, basic: null, standard: null, other: null });

    const base = new URLSearchParams();
    if (debouncedSearch) base.append("search", debouncedSearch);
    if (startDate) base.append("startDate", startDate);
    if (endDate) base.append("endDate", endDate);
    base.append("page", "1");
    base.append("limit", "1");

    const bp1 = new URLSearchParams(base); bp1.append("planType", "1");
    const bp2 = new URLSearchParams(base); bp2.append("planType", "2");
    const bp3 = new URLSearchParams(base); bp3.append("planType", "3");

    Promise.all([
      API.apiGet(apiKey, `?${bp1.toString()}`).then((r) => r?.data?.meta?.total ?? 0).catch(() => 0),
      API.apiGet(apiKey, `?${bp2.toString()}`).then((r) => r?.data?.meta?.total ?? 0).catch(() => 0),
      API.apiGet(apiKey, `?${bp3.toString()}`).then((r) => r?.data?.meta?.total ?? 0).catch(() => 0),
    ]).then(([basic, standard, other]) => {
      onStatsChange({ total: basic + standard + other, basic, standard, other });
    });
  };

  const fetchTabCounts = () => {
    const base = new URLSearchParams();
    if (debouncedSearch) base.append("search", debouncedSearch);
    if (startDate) base.append("startDate", startDate);
    if (endDate) base.append("endDate", endDate);
    base.append("page", "1");
    base.append("limit", "1");

    API.apiGet("dietFormRequests", `?${base.toString()}`)
      .then((res) => setTabCounts((p) => ({ ...p, unpaid: res?.data?.meta?.total ?? 0 })))
      .catch(() => {});

    API.apiGet("paidDietCharts", `?${base.toString()}`)
      .then((res) => setTabCounts((p) => ({ ...p, paid: res?.data?.meta?.total ?? 0 })))
      .catch(() => {});
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    API.apiGet(apiKey, `?${buildParams({ page: 1, limit: 10000 })}`)
      .then((res) => {
        const data = res?.data?.data || [];
        if (!data.length) { toast.error("No data to export."); return; }

        const isPaid = activeTab === "paid";
        const rows = data.map((r, i) => {
          const effectiveStatus = isPaid ? (r.plan_status ?? "no_plan") : (r.status ?? "pending");
          const row = {
            "S.No": i + 1,
            "Name": r.full_name || "N/A",
            "Email": r.email || "—",
            "WhatsApp": r.whatsapp || "—",
            "Plan": PLAN_TYPES[r.plan_type] || `Plan ${r.plan_type ?? "—"}`,
            "Goals": toList(r.goals).map(humanize).join(", ") || "—",
            "Diet Type": humanize(r.diet_type) || "—",
            "City": r.city || "—",
            "State": r.state || "—",
            "Submitted": formatDate(r.created_at),
          };
          if (isPaid) {
            row["Payment (₹)"] = r.payment_amount ?? "—";
            row["Plan Status"] = humanize(r.plan_status || "Not Started");
            row["Sent At"]     = r.sent_at ? formatDate(r.sent_at) : "—";
          }
          return row;
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, isPaid ? "Paid Plans" : "Unpaid Requests");
        const colWidthsPaid  = [5, 22, 26, 16, 14, 24, 14, 14, 14, 14, 14, 16, 16];
        const colWidthsUnpaid = [5, 22, 26, 16, 14, 24, 14, 14, 14, 14, 14];
        ws["!cols"] = (isPaid ? colWidthsPaid : colWidthsUnpaid).map((w) => ({ wch: w }));

        const dateStr = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(wb, `diet_${activeTab}_${dateStr}.xlsx`);
        toast.success(`Exported ${rows.length} records to Excel.`);
      })
      .catch(() => toast.error("Export failed. Please try again."))
      .finally(() => setIsExporting(false));
  };

  const handleViewPlan = (r) => {
    router.push(`/dashboard/diet-plan/${r.id}`);
  };

  const clearDateRange = () => { setStartDate(""); setEndDate(""); setCurrentPage(1); };
  const hasDateFilter  = startDate || endDate;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortDropdown(false);
      if (dateRef.current && !dateRef.current.contains(e.target)) setShowDatePicker(false);
      if (planTypeRef.current && !planTypeRef.current.contains(e.target)) setShowPlanTypeDropdown(false);
      if (planStatusRef.current && !planStatusRef.current.contains(e.target)) setShowPlanStatusDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const columns = ["S.No", "Applicant", "Contact", "Plan", "Status", "Goals", "Diet", "Location", "Submitted", "Actions"];
  const colWidths = { "S.No": "48px", Applicant: "160px", Contact: "180px", Plan: "115px", Status: "140px", Goals: "140px", Diet: "110px", Location: "120px", Submitted: "135px", Actions: "155px" };

  return (
    <div>
      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <TabBtn active={activeTab === "paid"} onClick={() => { onTabChange("paid"); setCurrentPage(1); }} count={tabCounts.paid}>
          Paid
        </TabBtn>
        <TabBtn active={activeTab === "unpaid"} onClick={() => { onTabChange("unpaid"); setCurrentPage(1); }} count={tabCounts.unpaid}>
          Unpaid
        </TabBtn>
      </div>

      {/* ── Main Card ── */}
      <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

        {/* ── Toolbar ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>

          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <svg style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <FormControl
              type="text"
              placeholder="Search by name, email, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ height: "42px", borderRadius: "10px", border: "1px solid #e5e5e5", paddingLeft: "40px", fontSize: "13px", boxShadow: "none" }}
            />
          </div>

          {/* Date Range */}
          <div style={{ position: "relative" }} ref={dateRef}>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              style={{ height: "42px", border: `1px solid ${hasDateFilter ? "#6366f1" : "#e5e5e5"}`, borderRadius: "10px", padding: "0 14px", background: hasDateFilter ? "#f5f3ff" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", fontWeight: 600, fontSize: "13px", color: hasDateFilter ? "#6366f1" : "#555" }}
            >
              <FaCalendarAlt style={{ color: hasDateFilter ? "#6366f1" : "#aaa", fontSize: "13px" }} />
              {hasDateFilter ? `${startDate || "—"} → ${endDate || "—"}` : "Date Range"}
              {hasDateFilter
                ? <MdClose style={{ marginLeft: "4px", color: "#6366f1", fontSize: "14px" }} onClick={(e) => { e.stopPropagation(); clearDateRange(); }} />
                : <FaChevronDown style={{ marginLeft: "4px", fontSize: "11px", color: "#aaa" }} />}
            </button>
            {showDatePicker && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#fff", border: "1px solid #edf1ee", borderRadius: "12px", zIndex: 1000, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: "16px", minWidth: "280px" }}>
                <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: "13px", color: "#111827" }}>Filter by Date Range</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "4px" }}>From</label>
                    <input type="date" value={startDate} max={endDate || undefined}
                      onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid #e5e5e5", borderRadius: "8px", fontSize: "13px", color: "#111827" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "4px" }}>To</label>
                    <input type="date" value={endDate} min={startDate || undefined}
                      onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid #e5e5e5", borderRadius: "8px", fontSize: "13px", color: "#111827" }} />
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={clearDateRange} style={{ flex: 1, padding: "8px", border: "1px solid #e5e5e5", borderRadius: "8px", background: "#fff", fontSize: "13px", cursor: "pointer", color: "#6b7280", fontWeight: 600 }}>Clear</button>
                    <button onClick={() => setShowDatePicker(false)} style={{ flex: 1, padding: "8px", border: "none", borderRadius: "8px", background: "#6366f1", fontSize: "13px", cursor: "pointer", color: "#fff", fontWeight: 600 }}>Apply</button>
                  </div>
                </div>
              </div>
            )}
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
                {sortType && (
                  <div onClick={() => { setSortType(""); setShowSortDropdown(false); }}
                    style={{ padding: "9px 14px", cursor: "pointer", borderRadius: "8px", fontSize: "13px", color: "#EF4444", fontWeight: 600 }}>Clear Sort</div>
                )}
              </div>
            )}
          </div>

          {/* Plan Type Filter */}
          <div style={{ position: "relative" }} ref={planTypeRef}>
            <button
              onClick={() => setShowPlanTypeDropdown(!showPlanTypeDropdown)}
              style={{ height: "42px", border: `1px solid ${planTypeFilter ? "#f59e0b" : "#e5e5e5"}`, borderRadius: "10px", padding: "0 14px", background: planTypeFilter ? "#fffbeb" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", minWidth: "140px", fontWeight: 600, fontSize: "13px", color: planTypeFilter ? "#f59e0b" : "#555" }}
            >
              <FaFilter style={{ color: planTypeFilter ? "#f59e0b" : "#aaa", fontSize: "12px" }} />
              {planTypeFilter ? PLAN_TYPES[planTypeFilter] : "Plan Type"}
              {planTypeFilter
                ? <MdClose style={{ marginLeft: "auto", fontSize: "14px" }} onClick={(e) => { e.stopPropagation(); setPlanTypeFilter(""); setCurrentPage(1); }} />
                : <FaChevronDown style={{ marginLeft: "auto", fontSize: "11px", color: "#aaa" }} />}
            </button>
            {showPlanTypeDropdown && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#fff", border: "1px solid #edf1ee", borderRadius: "12px", minWidth: "160px", zIndex: 1000, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: "6px" }}>
                {PLAN_FILTER_OPTIONS.map(({ key, label }) => (
                  <div key={key} onClick={() => { setPlanTypeFilter(key); setShowPlanTypeDropdown(false); setCurrentPage(1); }}
                    style={{ padding: "9px 14px", cursor: "pointer", borderRadius: "8px", fontSize: "13px", fontWeight: planTypeFilter === key ? 700 : 500, color: planTypeFilter === key ? "#f59e0b" : "#444", background: planTypeFilter === key ? "#fffbeb" : "transparent" }}>
                    {label}
                  </div>
                ))}
                {planTypeFilter && (
                  <div onClick={() => { setPlanTypeFilter(""); setShowPlanTypeDropdown(false); }}
                    style={{ padding: "9px 14px", cursor: "pointer", borderRadius: "8px", fontSize: "13px", color: "#EF4444", fontWeight: 600 }}>Clear Filter</div>
                )}
              </div>
            )}
          </div>

          {/* Plan Status Filter (paid tab only) */}
          {activeTab === "paid" && (
            <div style={{ position: "relative" }} ref={planStatusRef}>
              <button
                onClick={() => setShowPlanStatusDropdown(!showPlanStatusDropdown)}
                style={{ height: "42px", border: `1px solid ${planStatusFilter ? "#3b82f6" : "#e5e5e5"}`, borderRadius: "10px", padding: "0 14px", background: planStatusFilter ? "#eff6ff" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", minWidth: "150px", fontWeight: 600, fontSize: "13px", color: planStatusFilter ? "#3b82f6" : "#555" }}
              >
                <FaFilter style={{ color: planStatusFilter ? "#3b82f6" : "#aaa", fontSize: "12px" }} />
                {planStatusFilter ? (PLAN_STATUS_OPTIONS.find((o) => o.key === planStatusFilter)?.label ?? "Plan Status") : "Plan Status"}
                {planStatusFilter
                  ? <MdClose style={{ marginLeft: "auto", fontSize: "14px" }} onClick={(e) => { e.stopPropagation(); setPlanStatusFilter(""); setCurrentPage(1); }} />
                  : <FaChevronDown style={{ marginLeft: "auto", fontSize: "11px", color: "#aaa" }} />}
              </button>
              {showPlanStatusDropdown && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#fff", border: "1px solid #edf1ee", borderRadius: "12px", minWidth: "170px", zIndex: 1000, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: "6px" }}>
                  {PLAN_STATUS_OPTIONS.map(({ key, label }) => {
                    const sc = STATUS_COLORS[key] || {};
                    return (
                      <div key={key} onClick={() => { setPlanStatusFilter(key); setShowPlanStatusDropdown(false); setCurrentPage(1); }}
                        style={{ padding: "9px 14px", cursor: "pointer", borderRadius: "8px", fontSize: "13px", fontWeight: planStatusFilter === key ? 700 : 500, color: planStatusFilter === key ? sc.color : "#444", background: planStatusFilter === key ? sc.bg : "transparent", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: sc.color || "#aaa", flexShrink: 0 }} />
                        {label}
                      </div>
                    );
                  })}
                  {planStatusFilter && (
                    <div onClick={() => { setPlanStatusFilter(""); setShowPlanStatusDropdown(false); }}
                      style={{ padding: "9px 14px", cursor: "pointer", borderRadius: "8px", fontSize: "13px", color: "#EF4444", fontWeight: 600 }}>Clear Filter</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            style={{ height: "42px", border: "1px solid #16a34a", borderRadius: "10px", padding: "0 16px", background: isExporting ? "#f0f9f3" : "#16a34a", cursor: isExporting ? "wait" : "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "13px", color: isExporting ? "#16a34a" : "#fff", whiteSpace: "nowrap", transition: "all 0.2s" }}
          >
            <FaFileExcel style={{ fontSize: "15px" }} />
            {isExporting ? "Exporting..." : "Export Excel"}
          </button>
        </div>

        {/* Active filters strip */}
        {(hasDateFilter || sortType || planStatusFilter) && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 600 }}>Active filters:</span>
            {hasDateFilter && (
              <span style={{ background: "#f5f3ff", color: "#6366f1", borderRadius: "20px", padding: "3px 10px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                {startDate || "—"} → {endDate || "—"}
                <MdClose style={{ cursor: "pointer", fontSize: "13px" }} onClick={clearDateRange} />
              </span>
            )}
            {sortType && (
              <span style={{ background: "#f0f9f3", color: "#1E8E3E", borderRadius: "20px", padding: "3px 10px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                {SORT_LABEL[sortType]}
                <MdClose style={{ cursor: "pointer", fontSize: "13px" }} onClick={() => setSortType("")} />
              </span>
            )}
            {planStatusFilter && (
              <span style={{ background: STATUS_COLORS[planStatusFilter]?.bg, color: STATUS_COLORS[planStatusFilter]?.color, borderRadius: "20px", padding: "3px 10px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                {STATUS_COLORS[planStatusFilter]?.label}
                <MdClose style={{ cursor: "pointer", fontSize: "13px" }} onClick={() => setPlanStatusFilter("")} />
              </span>
            )}
          </div>
        )}

        {/* ── Table ── */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div className="spinner-border" style={{ color: "#1E8E3E", width: "2.5rem", height: "2.5rem" }} role="status" />
            <p style={{ marginTop: "16px", color: "#999", fontSize: "14px", fontWeight: 500 }}>Loading...</p>
          </div>
        ) : requests.length > 0 ? (
          <>
            <div style={{ borderRadius: "12px", border: "1px solid #edf1ee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflowX: "auto" }}>
              <Table className="table mb-0" style={{ borderCollapse: "collapse", tableLayout: "fixed", width: "100%", minWidth: "1303px" }}>
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col} style={{ background: "#1E8E3E", color: "#fff", fontWeight: 600, fontSize: "12px", padding: "12px 14px", whiteSpace: "nowrap", borderBottom: "2px solid #166C31", letterSpacing: "0.3px", width: colWidths[col] || "auto" }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r, i) => {
                    // Unpaid uses `status`; Paid uses `plan_status` (null → no plan yet)
                    const effectiveStatus = activeTab === "paid"
                      ? (r.plan_status ?? "no_plan")
                      : (r.status ?? "pending");
                    const st = statusStyle(effectiveStatus);
                    // Paid: show review button when plan is ready or already sent (and plan_id exists)
                    const canViewPlan = activeTab === "paid"
                      ? (r.plan_status === "completed" || r.plan_status === "sent") && !!r.plan_id
                      : r.status === "completed";
                    const goals = toList(r.goals);
                    const sno = (pagination.page - 1) * pagination.limit + i + 1;
                    return (
                      <tr key={r.id}
                        style={{ borderBottom: "1px solid #edf1ee", background: i % 2 === 0 ? "#fff" : "#fafcfa", transition: "background 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9f3")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafcfa")}
                      >
                        {/* S.No */}
                        <td style={{ padding: "10px 14px", fontSize: "13px", fontWeight: 700, color: "#1E8E3E", verticalAlign: "middle" }}>{sno}</td>

                        {/* Applicant */}
                        <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #1E8E3E, #4ade80)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "14px", flexShrink: 0 }}>
                              {(r.full_name || "U").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "130px" }}>{r.full_name || "N/A"}</p>
                              <p style={{ margin: 0, fontSize: "11px", color: "#aaa" }}>
                                {r.age ? `${r.age} yrs` : "—"}{r.gender ? ` • ${humanize(r.gender)}` : ""}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                            <span style={{ fontSize: "12px", color: "#3b82f6", fontWeight: 500, wordBreak: "break-all" }}>{r.email || "—"}</span>
                            <span style={{ fontSize: "12px", color: "#555", whiteSpace: "nowrap" }}>{r.whatsapp || "—"}</span>
                          </div>
                        </td>

                        {/* Plan */}
                        <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span style={{ background: "#f0faf8", color: "#0d9488", border: "1px solid rgba(13,148,136,0.2)", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap" }}>
                              {PLAN_TYPES[r.plan_type] || `Plan ${r.plan_type ?? "—"}`}
                            </span>
                            {activeTab === "paid" && r.payment_amount != null && (
                              <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 700, paddingLeft: "2px" }}>
                                ₹{r.payment_amount}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap", display: "inline-block" }}>
                              {st.label}
                            </span>
                            {activeTab === "paid" && r.sent_at && (
                              <span style={{ fontSize: "10px", color: "#6b7280", paddingLeft: "2px" }}>
                                {formatDate(r.sent_at)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Goals */}
                        <td style={{ padding: "10px 14px", verticalAlign: "middle", overflow: "hidden" }}>
                          {goals.length ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }} title={goals.map(humanize).join(", ")}>
                              <span style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "20px", padding: "3px 9px", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100px" }}>{humanize(goals[0])}</span>
                              {goals.length > 1 && (
                                <span style={{ background: "#f1f5f9", color: "#64748b", borderRadius: "20px", padding: "3px 8px", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>+{goals.length - 1}</span>
                              )}
                            </div>
                          ) : <span style={{ color: "#aaa", fontSize: "11px" }}>N/A</span>}
                        </td>

                        {/* Diet */}
                        <td style={{ padding: "10px 14px", fontSize: "12px", color: "#555", verticalAlign: "middle", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{humanize(r.diet_type) || "—"}</td>

                        {/* Location */}
                        <td style={{ padding: "10px 14px", fontSize: "12px", color: "#555", verticalAlign: "middle", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={[r.city, r.state].filter(Boolean).join(", ")}>{[r.city, r.state].filter(Boolean).join(", ") || "—"}</td>

                        {/* Submitted */}
                        <td style={{ padding: "10px 14px", verticalAlign: "middle", fontSize: "12px", color: "#555", whiteSpace: "nowrap" }}>
                          {formatDate(r.created_at)}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div onClick={() => { setSelected(r); setShowDetail(true); }} title="View Details"
                              style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}
                              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                              <FaEye style={{ color: "#3b82f6", fontSize: "14px" }} />
                            </div>
                            {canViewPlan && (
                              <button onClick={() => handleViewPlan(r)} title="View Diet Plan"
                                style={{ height: "32px", borderRadius: "8px", background: "#f0f9f3", border: "1px solid rgba(30,142,62,0.3)", display: "flex", alignItems: "center", gap: "5px", padding: "0 10px", cursor: "pointer", fontSize: "12px", fontWeight: 700, color: "#1E8E3E", transition: "all 0.2s", whiteSpace: "nowrap" }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#1E8E3E"; e.currentTarget.style.color = "#fff"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "#f0f9f3"; e.currentTarget.style.color = "#1E8E3E"; }}>
                                <LuSalad size={13} /> Diet Plan
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
              <span>Showing <strong style={{ color: "#111827" }}>{requests.length}</strong> of <strong style={{ color: "#111827" }}>{pagination.total}</strong> requests</span>
              <span style={{ background: "#f0f9f3", padding: "4px 14px", borderRadius: "20px", fontWeight: 500, color: "#1E8E3E" }}>Page {pagination.page} of {pagination.totalPages}</span>
            </div>

            {pagination.totalPages > 1 && (
              <GlobalPagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setCurrentPage} />
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", borderRadius: "12px", border: "1px solid #edf1ee" }}>
            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center" }}><LuSalad size={48} color="#c5e3d0" /></div>
            <h5 style={{ fontWeight: 700, color: "#333", marginBottom: "8px" }}>No {activeTab === "paid" ? "Paid" : "Unpaid"} Requests Found</h5>
            <p style={{ fontSize: "14px", color: "#999" }}>
              {debouncedSearch ? `No results for "${debouncedSearch}"` : hasDateFilter ? "No requests found in the selected date range." : `No ${activeTab} diet chart requests found.`}
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <DietRequestDetailModal show={showDetail} onHide={() => setShowDetail(false)} request={selected} />
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DietRequestDetailModal({ show, onHide, request: r }) {
  const Section = ({ title, children }) => (
    <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <h6 style={{ fontWeight: 700, color: "#1E8E3E", marginBottom: "14px", paddingBottom: "8px", borderBottom: "1px solid #edf1ee" }}>{title}</h6>
      {children}
    </div>
  );

  const Field = ({ label, value, full }) => (
    <div className={full ? "col-12" : "col-md-6"}>
      <div style={{ background: "#fafcfa", borderRadius: "10px", padding: "10px 14px", height: "100%" }}>
        <small style={{ color: "#aaa", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</small>
        <p style={{ margin: 0, fontWeight: 600, color: "#111827", fontSize: "13px", marginTop: "2px" }}>{value || "N/A"}</p>
      </div>
    </div>
  );

  const Chips = ({ label, items, color = "#0d9488", bg = "#f0faf8", border = "rgba(13,148,136,0.2)" }) => (
    <div style={{ marginBottom: "12px" }}>
      <small style={{ color: "#aaa", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</small>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "5px" }}>
        {items.length ? items.map((it, idx) => (
          <span key={idx} style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: "20px", padding: "3px 11px", fontSize: "12px", fontWeight: 600 }}>{humanize(it)}</span>
        )) : <span style={{ color: "#bbb", fontSize: "12px" }}>None</span>}
      </div>
    </div>
  );

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton style={{ background: "#1E8E3E", color: "#fff", borderBottom: "none", padding: "1.25rem 1.75rem" }}>
        <Modal.Title style={{ fontWeight: 700, fontSize: "1.1rem" }}>Diet Chart Request</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: "#f8f9fa", padding: "1.5rem", maxHeight: "72vh", overflowY: "auto" }}>
        {r && (() => {
          // For paid entries show plan_status; for unpaid show form status
          const statusKey = r.plan_id != null ? (r.plan_status ?? "no_plan") : (r.status ?? "pending");
          const st = statusStyle(statusKey);
          return (
            <div>
              <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "18px" }}>
                <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg, #1E8E3E, #4ade80)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "26px", flexShrink: 0 }}>
                  {(r.full_name || "U").charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h5 style={{ margin: 0, fontWeight: 800, color: "#111827" }}>{r.full_name || "N/A"}</h5>
                  <p style={{ margin: "2px 0 8px", color: "#888", fontSize: "13px" }}>
                    Request #{r.id} • Submitted {formatDate(r.created_at)}
                    {r.payment_amount != null && ` • ₹${r.payment_amount}`}
                  </p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: 700 }}>{st.label}</span>
                    <span style={{ background: "#f0faf8", color: "#0d9488", border: "1px solid rgba(13,148,136,0.2)", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: 700 }}>{PLAN_TYPES[r.plan_type] || `Plan ${r.plan_type ?? "—"}`}</span>
                    {r.sent_at && <span style={{ background: "#ecfdf5", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: 700 }}>Sent {formatDate(r.sent_at)}</span>}
                  </div>
                </div>
              </div>

              <Section title="Basic Information">
                <div className="row g-3">
                  <Field label="Full Name" value={r.full_name} />
                  <Field label="Age" value={r.age ? `${r.age} years` : null} />
                  <Field label="Gender" value={humanize(r.gender)} />
                  <Field label="Date of Birth" value={r.dob ? formatDate(r.dob) : null} />
                  <Field label="Height" value={formatHeight(r)} />
                  <Field label="Weight" value={formatWeight(r)} />
                </div>
              </Section>

              <Section title="Goals & Activity">
                <Chips label="Goals" items={toList(r.goals)} color="#2563eb" bg="#eff6ff" border="rgba(37,99,235,0.2)" />
                <div className="row g-3">
                  <Field label="Activity Level" value={humanize(r.activity_level)} />
                  <Field label="Work Type" value={humanize(r.work_type)} />
                  <Field label="Workout Type" value={humanize(r.workout_type)} />
                </div>
                {(r.breakfast_time || r.lunch_time || r.evening_snack_time || r.dinner_time) && (
                  <div className="row g-3" style={{ marginTop: 0 }}>
                    <Field label="Breakfast Time"     value={r.breakfast_time} />
                    <Field label="Lunch Time"         value={r.lunch_time} />
                    <Field label="Evening Snack Time" value={r.evening_snack_time} />
                    <Field label="Dinner Time"        value={r.dinner_time} />
                  </div>
                )}
              </Section>

              <Section title="Diet Preferences">
                <div className="row g-3" style={{ marginBottom: "12px" }}>
                  <Field label="Diet Type" value={humanize(r.diet_type)} />
                </div>
                <Chips label="Cuisine Preference" items={toList(r.cuisine_preference)} color="#7c3aed" bg="#f5f3ff" border="rgba(124,58,237,0.2)" />
                <Chips label="Food Allergies" items={toList(r.food_allergies)} color="#ef4444" bg="#fef2f2" border="rgba(239,68,68,0.2)" />
                <div className="row g-3" style={{ marginTop: "0" }}>
                  <Field label="Foods Disliked" value={r.foods_dislike} full />
                  <Field label="Favorite Foods" value={r.favorite_foods} full />
                  {r.whey_protein && <Field label="Whey Protein" value={humanize(r.whey_protein)} full />}
                </div>
              </Section>

              <Section title="Health & Medical">
                <Chips label="Medical Conditions" items={toList(r.medical_conditions)} color="#ef4444" bg="#fef2f2" border="rgba(239,68,68,0.2)" />
                <div className="row g-3">
                  <Field label="Other Condition" value={r.other_condition} />
                  <Field label="On Medication" value={humanize(r.on_medication)} />
                  <Field label="Medications" value={r.medications} />
                  <Field label="Digestive Health" value={humanize(r.digestive_health)} />
                  <Field label="Smoke / Alcohol" value={humanize(r.smoke_alcohol)} />
                </div>
                {r.health_notes && (
                  <div style={{ background: "#fafcfa", borderRadius: "10px", padding: "10px 14px", marginTop: "12px" }}>
                    <small style={{ color: "#aaa", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Health Notes</small>
                    <p style={{ margin: 0, fontWeight: 500, color: "#374151", fontSize: "13px", marginTop: "2px" }}>{r.health_notes}</p>
                  </div>
                )}
              </Section>

              <Section title="Contact & Delivery">
                <div className="row g-3" style={{ marginBottom: toList(r.delivery_method).length ? "12px" : 0 }}>
                  <Field label="Contact Name" value={r.contact_name} />
                  <Field label="WhatsApp" value={r.whatsapp} />
                  <Field label="Email" value={r.email} />
                  <Field label="City" value={r.city} />
                  <Field label="State" value={[r.state, r.state_code].filter(Boolean).join(" ")} />
                </div>
                <Chips label="Delivery Method" items={toList(r.delivery_method)} color="#2563eb" bg="#eff6ff" border="rgba(37,99,235,0.2)" />
              </Section>

              {r.final_notes && (
                <Section title="Final Notes">
                  <p style={{ margin: 0, color: "#374151", fontSize: "13px", lineHeight: 1.6 }}>{r.final_notes}</p>
                </Section>
              )}
            </div>
          );
        })()}
      </Modal.Body>
      <Modal.Footer style={{ background: "#f8f9fa", borderTop: "1px solid #edf1ee", padding: "1rem 1.5rem" }}>
        <Button variant="secondary" onClick={onHide} style={{ borderRadius: "8px", padding: "8px 20px", fontWeight: 600 }}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
