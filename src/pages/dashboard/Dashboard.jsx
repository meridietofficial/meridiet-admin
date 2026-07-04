import { useState, useRef, useEffect } from "react";
import { LuCalendar, LuChevronDown, LuCheck } from "react-icons/lu";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import {
  LuUsers, LuStethoscope, LuCalendarCheck, LuIndianRupee,
  LuFileText,
  LuActivity, LuServer, LuDatabase, LuHeadphones,
  LuSalad, LuClock, LuClipboardList,
} from "react-icons/lu";
import API from "../../helpers/api";

// ── Period → API param maps ───────────────────────────────────────────────────
const REV_PERIOD_MAP    = { "This Week": "daily", "This Month": "weekly", "This Year": "monthly" };
const USER_PERIOD_MAP   = { "This Month": "weekly", "This Quarter": "monthly", "This Year": "quarterly" };
const CONSULT_PERIOD_MAP = { "This Week": "daily", "This Month": "weekly" };

const PLAN_META = [
  { type: 1, label: "Basic Plan", sub: "1 Week · 7 Days", icon: LuClock, color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", price: 199 },
  { type: 2, label: "Standard Plan", sub: "1 Month · 4 Weeks", icon: LuSalad, color: "#1E8E3E", bg: "#e8f5ee", border: "#bbf7d0", price: 499 },
  { type: 3, label: "Premium Plan", sub: "3 Months · 12 Weeks", icon: LuClipboardList, color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe", price: 999 },
];


// ── Date Range Picker ─────────────────────────────────────────────────────────
const PRESETS = [
  { label: "Today", days: 0 }, { label: "Yesterday", days: 1 },
  { label: "Last 7 Days", days: 7 }, { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 }, { label: "This Month", days: "month" },
  { label: "Last Month", days: "lastMonth" },
];
const fmt = (d) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const toISO = (d) => d.toISOString().split("T")[0];

const DateRangePicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(value.from);
  const [to, setTo] = useState(value.to);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const applyPreset = (days) => {
    const end = new Date(); let start = new Date();
    if (days === "month") { start = new Date(end.getFullYear(), end.getMonth(), 1); }
    else if (days === "lastMonth") { start = new Date(end.getFullYear(), end.getMonth() - 1, 1); end.setDate(0); }
    else { start.setDate(end.getDate() - days); }
    const f = toISO(start), t = toISO(end);
    setFrom(f); setTo(t); onChange({ from: f, to: t }); setOpen(false);
  };

  const label = value.from && value.to
    ? `${fmt(new Date(value.from))} – ${fmt(new Date(value.to))}` : "Select date range";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px",
        borderRadius: "10px", border: "1px solid #d4e6d9", background: "#fff",
        cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#1E8E3E",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <LuCalendar size={15} color="#1E8E3E" />
        {label}
        <LuChevronDown size={13} color="#888" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {open && (
        <div className="drp-dropdown" style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#fff",
          borderRadius: "14px", border: "1px solid #e8ede9", zIndex: 999,
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)", display: "flex", minWidth: "460px", overflow: "hidden",
        }}>
          <div style={{ background: "#f8fbf9", borderRight: "1px solid #eee", padding: "14px 12px", minWidth: "150px" }}>
            <p style={{ margin: "0 0 10px", fontSize: "11px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.6px" }}>Quick Select</p>
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => applyPreset(p.days)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "7px 10px", marginBottom: "2px", borderRadius: "8px",
                border: "none", cursor: "pointer",
                background: p.label === "Last 7 Days" ? "#e8f5ee" : "transparent",
                color: p.label === "Last 7 Days" ? "#1E8E3E" : "#444",
                fontSize: "12px", fontWeight: p.label === "Last 7 Days" ? 700 : 500, textAlign: "left",
              }}>
                {p.label}{p.label === "Last 7 Days" && <LuCheck size={12} />}
              </button>
            ))}
          </div>
          <div style={{ padding: "16px 18px", flex: 1 }}>
            <p style={{ margin: "0 0 14px", fontSize: "11px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.6px" }}>Custom Range</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[{ label: "From", val: from, set: setFrom }, { label: "To", val: to, set: setTo }].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#666", display: "block", marginBottom: "5px" }}>{f.label}</label>
                  <input type="date" value={f.val} onChange={e => f.set(e.target.value)} style={{
                    width: "100%", padding: "8px 12px", borderRadius: "8px",
                    border: "1px solid #d4e6d9", fontSize: "13px", color: "#333", outline: "none",
                  }} />
                </div>
              ))}
              <button onClick={() => { onChange({ from, to }); setOpen(false); }} style={{
                padding: "9px", borderRadius: "9px", border: "none",
                background: "#1E8E3E", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer",
              }}>Apply Range</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Shared UI ─────────────────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{
    background: "#fff", borderRadius: "14px", border: "1px solid #e8ede9",
    padding: "20px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", ...style,
  }}>{children}</div>
);

const SectionHeader = ({ title, action, actionLabel = "View All" }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
    <span style={{ fontWeight: 700, fontSize: "15px", color: "#111" }}>{title}</span>
    {action && <button onClick={action} style={{ background: "none", border: "none", color: "#1E8E3E", fontSize: "13px", fontWeight: 600, cursor: "pointer", padding: 0 }}>{actionLabel}</button>}
  </div>
);

const PeriodBadge = ({ value, onChange, options }) => (
  <select value={value} onChange={e => onChange(e.target.value)} style={{
    border: "1px solid #e0e7e1", borderRadius: "8px", padding: "4px 10px",
    fontSize: "13px", color: "#444", background: "#fff", cursor: "pointer", outline: "none",
  }}>
    {options.map(o => <option key={o}>{o}</option>)}
  </select>
);

const StatBadge = ({ value, positive = true }) => (
  <span style={{ color: positive ? "#16a34a" : "#ef4444", fontSize: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "2px" }}>
    {positive ? "▲" : "▼"} {value}
  </span>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e8ede9", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <p style={{ margin: 0, fontWeight: 600, color: "#333" }}>{label}</p>
      <p style={{ margin: 0, color: "#1E8E3E" }}>{payload[0].value}</p>
    </div>
  );
};

const Skeleton = ({ w = "100%", h = "18px", radius = "6px" }) => (
  <div style={{ width: w, height: h, borderRadius: radius, background: "linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
);

// ── Main Dashboard ─────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [revPeriod, setRevPeriod] = useState("This Week");
  const [userPeriod, setUserPeriod] = useState("This Month");
  const [consultPeriod, setConsultPeriod] = useState("This Week");

  const today = new Date();
  const weekAgo = new Date(); weekAgo.setDate(today.getDate() - 7);
  const [dateRange, setDateRange] = useState({ from: toISO(weekAgo), to: toISO(today) });

  // ── Summary stats ────────────────────────────────────────────────
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(null);
  const [totalDietitians, setTotalDietitians] = useState(null);
  const [totalConsultations, setTotalConsultations] = useState(null);
  const [totalRevenue, setTotalRevenue] = useState(null);
  const [planCounts, setPlanCounts] = useState({ 1: null, 2: null, 3: null, total: null });
  const [statChanges, setStatChanges] = useState(null);

  // ── Chart data ───────────────────────────────────────────────────
  const [revenueData, setRevenueData] = useState([]);
  const [revTotal, setRevTotal] = useState(null);
  const [revChange, setRevChange] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(true);

  const [userGrowthData, setUserGrowthData] = useState([]);
  const [userGrowthLoading, setUserGrowthLoading] = useState(true);

  const [consultData, setConsultData] = useState([]);
  const [consultTotal, setConsultTotal] = useState(null);
  const [consultChange, setConsultChange] = useState(null);
  const [consultBreakdown, setConsultBreakdown] = useState(null);
  const [consultLoading, setConsultLoading] = useState(true);

  const [systemData, setSystemData] = useState(null);

  const buildDateParams = (range) => {
    const p = range?.from && range?.to ? `&from=${range.from}&to=${range.to}` : "";
    return p;
  };

  // ── Fetch: Summary stats (re-runs when date range changes) ───────
  useEffect(() => {
    setStatsLoading(true);
    const dp = buildDateParams(dateRange);
    API.apiGet("dashboardStats", dp ? `?${dp.slice(1)}` : "")
      .then(res => {
        const d = res?.data?.data;
        if (!d) return;
        setTotalUsers(d.totalUsers ?? null);
        setTotalDietitians(d.totalDietitians ?? null);
        setTotalConsultations(d.totalConsultations ?? null);
        setTotalRevenue(d.totalRevenue ?? null);
        const byPlan = d.dietChartRequests?.byPlan || {};
        const total = d.dietChartRequests?.total ?? null;
        setPlanCounts({ 1: byPlan["1"] ?? null, 2: byPlan["2"] ?? null, 3: byPlan["3"] ?? null, total });
        setStatChanges(d.changes ?? null);
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [dateRange]);

  // ── Fetch: Revenue chart (re-runs when date range or period dropdown changes) ─
  useEffect(() => {
    setRevenueLoading(true);
    const period = REV_PERIOD_MAP[revPeriod] || "daily";
    const dp = buildDateParams(dateRange);
    API.apiGet("dashboardRevenue", `?period=${period}${dp}`)
      .then(res => {
        const d = res?.data?.data;
        if (!d) return;
        setRevTotal(d.total ?? null);
        setRevChange(d.change ?? null);
        setRevenueData((d.data || []).map(p => ({ label: p.label, value: p.revenue })));
      })
      .catch(() => {})
      .finally(() => setRevenueLoading(false));
  }, [dateRange, revPeriod]);

  // ── Fetch: User growth chart ─────────────────────────────────────
  useEffect(() => {
    setUserGrowthLoading(true);
    const period = USER_PERIOD_MAP[userPeriod] || "monthly";
    const dp = buildDateParams(dateRange);
    API.apiGet("dashboardUserGrowth", `?period=${period}${dp}`)
      .then(res => {
        const d = res?.data?.data;
        if (!d) return;
        setUserGrowthData((d.data || []).map(p => ({ week: p.label, users: p.newUsers })));
      })
      .catch(() => {})
      .finally(() => setUserGrowthLoading(false));
  }, [dateRange, userPeriod]);

  // ── Fetch: Consultations chart ───────────────────────────────────
  useEffect(() => {
    setConsultLoading(true);
    const period = CONSULT_PERIOD_MAP[consultPeriod] || "daily";
    const dp = buildDateParams(dateRange);
    API.apiGet("dashboardConsultations", `?period=${period}${dp}`)
      .then(res => {
        const d = res?.data?.data;
        if (!d) return;
        setConsultTotal(d.total ?? null);
        setConsultChange(d.change ?? null);
        setConsultBreakdown(d.breakdown ?? null);
        setConsultData((d.data || []).map(p => ({ day: p.label, value: p.count })));
      })
      .catch(() => {})
      .finally(() => setConsultLoading(false));
  }, [dateRange, consultPeriod]);

  // ── Fetch: System overview (once only) ───────────────────────────
  useEffect(() => {
    API.apiGet("systemOverview", "")
      .then(res => setSystemData(res?.data?.data ?? null))
      .catch(() => {});
  }, []);

  const fmtNum = (n) => n == null ? null : Number(n).toLocaleString("en-IN");
  const fmtRupees = (n) => n == null ? null : "₹" + Number(n).toLocaleString("en-IN");

  const getChange = (key) => {
    const c = statChanges?.[key];
    if (!c) return { change: null, positive: true };
    return { change: `${c.percent}%`, positive: c.direction !== "down" };
  };

  const statCards = [
    { label: "Total Users",         value: fmtNum(totalUsers),        ...getChange("totalUsers"),        icon: LuUsers,         color: "#1E8E3E", bg: "#e8f5ee" },
    { label: "Dietitians",          value: fmtNum(totalDietitians),   ...getChange("totalDietitians"),   icon: LuStethoscope,   color: "#3b82f6", bg: "#eff6ff" },
    { label: "Consultations",       value: fmtNum(totalConsultations),...getChange("totalConsultations"), icon: LuCalendarCheck, color: "#7c3aed", bg: "#faf5ff" },
    { label: "Revenue",             value: fmtRupees(totalRevenue),   ...getChange("totalRevenue"),      icon: LuIndianRupee,   color: "#f97316", bg: "#fff7ed" },
    { label: "Diet Chart Requests", value: fmtNum(planCounts.total),  ...getChange("dietChartRequests"), icon: LuClipboardList, color: "#0891b2", bg: "#ecfeff" },
  ];

  return (
    <div style={{ padding: "0", background: "#f4f7f5", minHeight: "100vh" }}>

      {/* ── Header ── */}
      <div className="dash-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
            <div style={{ width: "4px", height: "20px", background: "linear-gradient(180deg, #1E8E3E, #4ade80)", borderRadius: "4px" }} />
            <h4 className="fw700 mb-0" style={{ fontSize: "1.15rem" }}>
              <span style={{ color: "#111827" }}>DASH</span><span style={{ color: "#1E8E3E" }}>BOARD</span>
            </h4>
          </div>
          <p style={{ color: "#999", marginBottom: 0, paddingLeft: "14px", fontSize: "13px" }}>Welcome back — here's what's happening today.</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* ── Stat Cards ── */}
      <div className="dash-top-grid" style={{ display: "grid", gap: "14px", marginBottom: "18px" }}>
        {statCards.map((card) => (
          <Card key={card.label} style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <card.icon size={19} color={card.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "11px", color: "#888", fontWeight: 500, marginBottom: "3px" }}>{card.label}</p>
                {statsLoading && card.value == null
                  ? <Skeleton w="80px" h="22px" />
                  : <p style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#111", lineHeight: 1.2 }}>{card.value ?? "—"}</p>
                }
                <div style={{ marginTop: "5px" }}>
                  {card.change != null
                    ? <><StatBadge value={card.change} positive={card.positive} /><span style={{ fontSize: "10px", color: "#aaa", marginLeft: "4px" }}>vs prev. period</span></>
                    : <span style={{ fontSize: "10px", color: "#ccc" }}>No comparison data</span>
                  }
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Row 2: Revenue Overview | Diet Chart Plans | Recent Requests ── */}
      <div className="dash-row2" style={{ display: "grid", gap: "14px", marginBottom: "18px" }}>

        {/* Revenue Overview */}
        <Card style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontWeight: 700, fontSize: "15px", color: "#111" }}>Revenue Overview</span>
            <PeriodBadge value={revPeriod} onChange={setRevPeriod} options={["This Week", "This Month", "This Year"]} />
          </div>
          <div style={{ marginBottom: "14px" }}>
            {revenueLoading && revTotal == null
              ? <Skeleton w="160px" h="30px" />
              : <>
                  <span style={{ fontSize: "26px", fontWeight: 800, color: "#111" }}>{fmtRupees(revTotal) ?? "—"} </span>
                  {revChange && <StatBadge value={`${revChange.percent}%`} positive={revChange.direction !== "down"} />}
                  <span style={{ fontSize: "11px", color: "#aaa", marginLeft: "4px" }}>vs prev. period</span>
                </>
            }
          </div>
          <div>
            {revenueLoading ? (
              <div style={{ height: "220px", borderRadius: "8px", background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E8E3E" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1E8E3E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#aaa" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#aaa" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#1E8E3E" strokeWidth={2.5}
                    fill="url(#revGrad)" dot={{ fill: "#1E8E3E", r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "#1E8E3E" }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Diet Chart Plans — Pie Chart */}
        <Card style={{ display: "flex", flexDirection: "column" }}>
          <SectionHeader title="Diet Chart Plans" actionLabel="View All"
            action={() => window.location.href = "/dashboard/diet-chart-requests"} />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>

            {/* Donut chart — centred */}
            <div style={{ position: "relative", width: "160px", height: "160px", flexShrink: 0 }}>
              {statsLoading ? (
                <div style={{ width: "160px", height: "160px", borderRadius: "50%", background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={PLAN_META.map(p => ({ name: p.label, value: planCounts[p.type] ?? 0 }))}
                      cx="50%" cy="50%"
                      innerRadius={48} outerRadius={70}
                      dataKey="value" paddingAngle={3}
                      startAngle={90} endAngle={-270}
                    >
                      {PLAN_META.map((plan, i) => (
                        <Cell key={i} fill={plan.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name) => [val.toLocaleString("en-IN"), name]}
                      contentStyle={{ borderRadius: "10px", border: "1px solid #e8ede9", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {/* Centre label */}
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
                {statsLoading && planCounts.total == null
                  ? <Skeleton w="48px" h="20px" radius="6px" />
                  : <p style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: "#111", lineHeight: 1 }}>
                      {planCounts.total != null ? planCounts.total.toLocaleString("en-IN") : "—"}
                    </p>
                }
                <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#aaa", fontWeight: 500 }}>Total</p>
              </div>
            </div>

            {/* 3 plan strips below chart */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
              {PLAN_META.map((plan) => {
                const sold = planCounts[plan.type];
                const earned = sold != null ? sold * plan.price : null;
                return (
                  <div key={plan.type} style={{
                    display: "flex", alignItems: "center",
                    background: plan.bg,
                    border: `1px solid ${plan.border}`,
                    borderLeft: `3px solid ${plan.color}`,
                    borderRadius: "8px",
                    padding: "7px 10px",
                    gap: "8px",
                  }}>
                    {/* Left: name + duration */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "#111", lineHeight: 1.3 }}>{plan.label}</p>
                      <p style={{ margin: 0, fontSize: "9.5px", color: "#888", whiteSpace: "nowrap" }}>{plan.sub}</p>
                    </div>
                    {/* Divider */}
                    <div style={{ width: "1px", height: "28px", background: plan.border, flexShrink: 0 }} />
                    {/* Stats: Price | Sold | Earned */}
                    {[
                      { label: "Price", value: `₹${plan.price}`, loading: false, colored: true },
                      { label: "Sold", value: sold != null ? sold.toLocaleString("en-IN") : null, loading: statsLoading && sold == null, colored: false },
                      { label: "Earned", value: earned != null ? `₹${earned.toLocaleString("en-IN")}` : null, loading: statsLoading && earned == null, colored: true },
                    ].map((stat, i) => (
                      <div key={i} style={{ textAlign: "center", minWidth: "44px" }}>
                        <p style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: stat.colored ? plan.color : "#111", lineHeight: 1.2 }}>
                          {stat.loading
                            ? <span style={{ display: "inline-block", width: "32px", height: "12px", borderRadius: "3px", background: "linear-gradient(90deg,#e8e8e8 25%,#d8d8d8 50%,#e8e8e8 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", verticalAlign: "middle" }} />
                            : (stat.value ?? "—")}
                        </p>
                        <p style={{ margin: 0, fontSize: "8.5px", color: "#aaa", fontWeight: 500, letterSpacing: "0.3px" }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Recent Diet Chart Requests */}
        <RecentDietRequests dateRange={dateRange} />
      </div>

      {/* ── Row 3: User Growth | Consultations Overview — equal height charts ── */}
      <div className="dash-row3" style={{ display: "grid", gap: "14px", marginBottom: "18px" }}>

        {/* User Growth */}
        <Card style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontWeight: 700, fontSize: "15px", color: "#111" }}>User Growth</span>
            <PeriodBadge value={userPeriod} onChange={setUserPeriod} options={["This Month", "This Quarter", "This Year"]} />
          </div>
          <div style={{ marginBottom: "14px" }}>
            {userGrowthLoading && totalUsers == null
              ? <Skeleton w="120px" h="28px" />
              : <>
                  <span style={{ fontSize: "22px", fontWeight: 800, color: "#111" }}>{fmtNum(totalUsers) ?? "—"} </span>
                  {statChanges?.totalUsers && <StatBadge value={`${statChanges.totalUsers.percent}%`} positive={statChanges.totalUsers.direction !== "down"} />}
                </>
            }
            <div><span style={{ fontSize: "11px", color: "#aaa" }}>vs prev. period</span></div>
          </div>
          <div>
            {userGrowthLoading ? (
              <div style={{ height: "220px", borderRadius: "8px", background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={userGrowthData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 9, fill: "#aaa" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#aaa" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="users" radius={[4, 4, 0, 0]}>
                    {userGrowthData.map((_, i) => (
                      <Cell key={i} fill={i === userGrowthData.length - 1 ? "#1E8E3E" : "#c5e3d0"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Consultations Overview */}
        <Card style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontWeight: 700, fontSize: "15px", color: "#111" }}>Consultations Overview</span>
            <PeriodBadge value={consultPeriod} onChange={setConsultPeriod} options={["This Week", "This Month"]} />
          </div>
          <div style={{ marginBottom: "10px" }}>
            {consultLoading && consultTotal == null
              ? <Skeleton w="120px" h="28px" />
              : <>
                  <span style={{ fontSize: "22px", fontWeight: 800, color: "#111" }}>{fmtNum(consultTotal) ?? "—"} </span>
                  {consultChange && <StatBadge value={`${consultChange.percent}%`} positive={consultChange.direction !== "down"} />}
                </>
            }
            <div><span style={{ fontSize: "11px", color: "#aaa" }}>vs prev. period</span></div>
          </div>
          <div>
            {consultLoading ? (
              <div style={{ height: "200px", borderRadius: "8px", background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={consultData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="consultGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E8E3E" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1E8E3E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#aaa" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#aaa" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#1E8E3E" strokeWidth={2}
                    fill="url(#consultGrad)" dot={{ fill: "#1E8E3E", r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#1E8E3E" }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Stats strip */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #f0f4f1" }}>
            {[
              { label: "Completed", value: consultBreakdown?.completed?.count, pct: consultBreakdown?.completed?.percent, color: "#1E8E3E" },
              { label: "Scheduled", value: consultBreakdown?.scheduled?.count, pct: consultBreakdown?.scheduled?.percent, color: "#f59e0b" },
              { label: "Cancelled", value: consultBreakdown?.cancelled?.count, pct: consultBreakdown?.cancelled?.percent, color: "#ef4444" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center", padding: "8px", background: "#fafcfa", borderRadius: "10px" }}>
                <p style={{ margin: 0, fontSize: "10px", color: "#888", fontWeight: 500 }}>{s.label}</p>
                {consultLoading && s.value == null
                  ? <div style={{ margin: "4px auto", width: "60px", height: "22px", borderRadius: "4px", background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
                  : <p style={{ margin: "2px 0", fontSize: "18px", fontWeight: 800, color: s.color }}>{fmtNum(s.value) ?? "—"}</p>
                }
                <p style={{ margin: 0, fontSize: "10px", color: "#bbb" }}>{s.pct != null ? `${s.pct}%` : ""}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Row 4: System Overview ── */}
      <Card>
        <SectionHeader title="System Overview" />
        <div className="dash-system-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {[
            {
              icon: LuServer, label: "Server Uptime",
              value: systemData?.serverUptime ?? null,
              sub: null, color: "#1E8E3E", bg: "#e8f5ee",
            },
            {
              icon: LuActivity, label: "Active Users",
              value: systemData?.activeUsers != null ? fmtNum(systemData.activeUsers) : null,
              sub: "Online", color: "#1E8E3E", bg: "#e8f5ee",
            },
            {
              icon: LuDatabase, label: "Database",
              value: systemData?.databaseStatus ? systemData.databaseStatus.charAt(0).toUpperCase() + systemData.databaseStatus.slice(1) : null,
              sub: null,
              color: systemData?.databaseStatus === "unhealthy" ? "#ef4444" : "#1E8E3E",
              bg: systemData?.databaseStatus === "unhealthy" ? "#fee2e2" : "#e8f5ee",
            },
            {
              icon: LuHeadphones, label: "Support Tickets",
              value: systemData?.openSupportTickets != null ? String(systemData.openSupportTickets) : null,
              sub: "Open", color: "#f59e0b", bg: "#fef3c7",
            },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", background: "#fafcfa", borderRadius: "12px", border: "1px solid #f0f4f1" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "11px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <s.icon size={19} color={s.color} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "11px", color: "#888" }}>{s.label}</p>
                {s.value == null
                  ? <div style={{ marginTop: "4px", width: "60px", height: "20px", borderRadius: "4px", background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
                  : <p style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: s.color }}>{s.value}</p>
                }
                {s.sub && <p style={{ margin: 0, fontSize: "10px", color: "#aaa" }}>{s.sub}</p>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .dash-top-grid    { grid-template-columns: repeat(5, 1fr); }
        .dash-row2        { grid-template-columns: 1.3fr 1fr 1fr; }
        .dash-row3        { grid-template-columns: 1fr 1fr; }
        .dash-system-grid { grid-template-columns: repeat(4, 1fr); }

        @media (max-width: 1280px) {
          .dash-top-grid    { grid-template-columns: repeat(3, 1fr) !important; }
          .dash-row2        { grid-template-columns: 1fr !important; }
          .dash-system-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 900px) {
          .dash-top-grid              { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-row2, .dash-row3      { grid-template-columns: 1fr !important; }
          .dash-system-grid           { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 767px) {
          .dash-header                { flex-direction: column; gap: 10px; align-items: flex-start !important; }
          .drp-dropdown               { right: auto !important; left: 0 !important; min-width: min(460px, calc(100vw - 20px)) !important; }
        }
        @media (max-width: 480px) {
          .dash-top-grid              { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-system-grid           { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 360px) {
          .dash-top-grid              { grid-template-columns: 1fr !important; }
          .dash-system-grid           { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

// ── Recent Diet Chart Requests — fetches live from API ────────────────────────
const PLAN_LABEL = { 1: "Basic Plan", 2: "Standard Plan", 3: "Premium Plan" };
const PLAN_COLOR = { 1: "#3b82f6", 2: "#1E8E3E", 3: "#7c3aed" };
const STATUS_STYLE = {
  pending:     { color: "#f59e0b", bg: "#fef3c7" },
  in_progress: { color: "#3b82f6", bg: "#dbeafe" },
  completed:   { color: "#16a34a", bg: "#dcfce7" },
  rejected:    { color: "#ef4444", bg: "#fee2e2" },
};
const STATUS_LABEL = { pending: "Pending", in_progress: "In Review", completed: "Completed", rejected: "Rejected" };

function RecentDietRequests({ dateRange }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const dp = dateRange?.from && dateRange?.to ? `&from=${dateRange.from}&to=${dateRange.to}` : "";
    API.apiGet("paidDietCharts", `?page=1&limit=5${dp}`)
      .then(res => setRequests(res?.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dateRange]);

  return (
    <Card>
      <SectionHeader title="Recent Diet Chart Requests" actionLabel="View All"
        action={() => window.location.href = "/dashboard/diet-chart-requests"} />

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", border: "1px solid #f0f4f1" }}>
              <Skeleton w="34px" h="34px" radius="50%" />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <Skeleton w="60%" h="13px" />
                <Skeleton w="40%" h="11px" />
              </div>
              <Skeleton w="60px" h="22px" radius="6px" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 0", color: "#aaa" }}>
          <LuClipboardList size={32} style={{ marginBottom: "8px", opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: "13px" }}>No paid diet charts found</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {requests.map((r) => {
            const planColor = PLAN_COLOR[r.plan_type] || "#888";
            return (
              <div key={r.id} style={{
                display: "flex", alignItems: "center", gap: "11px",
                padding: "10px 12px", borderRadius: "10px",
                border: "1px solid #f0f4f1", background: "#fafcfa",
              }}>
                <div style={{
                  width: "34px", height: "34px", borderRadius: "50%",
                  background: "linear-gradient(135deg,#1E8E3E,#4ade80)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>
                    {(r.full_name || "?").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "#222", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.full_name || "—"}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                    <span style={{
                      fontSize: "10px", fontWeight: 600, color: planColor,
                      background: `${planColor}15`, borderRadius: "4px", padding: "1px 6px",
                    }}>
                      {PLAN_LABEL[r.plan_type] || `Plan ${r.plan_type}`}
                    </span>
                    {r.payment_amount != null && (
                      <span style={{ fontSize: "10px", fontWeight: 600, color: "#16a34a" }}>
                        ₹{Number(r.payment_amount).toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  {r.pdf_url && (
                    <a href={r.pdf_url} target="_blank" rel="noreferrer" title="Download PDF" style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: "26px", height: "26px", borderRadius: "6px",
                      background: "#e8f5ee", color: "#1E8E3E", textDecoration: "none",
                    }}>
                      <LuFileText size={13} />
                    </a>
                  )}
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      fontSize: "10px", fontWeight: 700, color: "#16a34a",
                      background: "#dcfce7", borderRadius: "6px", padding: "3px 8px", display: "block",
                    }}>Completed</span>
                    <p style={{ margin: "3px 0 0", fontSize: "10px", color: "#bbb" }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : ""}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default Dashboard;
