import { useState, useEffect, useRef } from "react";
import { useRouter } from "../../helpers/useRouter";
import { Table, FormControl, Modal, Button } from "react-bootstrap";
import { FaSort, FaChevronDown, FaEye } from "react-icons/fa";
import { LuSalad } from "react-icons/lu";
import GlobalPagination from "../common/GlobalPagination";
import API, { setAuthorization } from "../../helpers/api";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  pending: { bg: "#FFF8E1", color: "#F59E0B", border: "rgba(245,158,11,0.3)", label: "Pending" },
  in_progress: { bg: "#EFF6FF", color: "#3b82f6", border: "rgba(59,130,246,0.3)", label: "In Progress" },
  completed: { bg: "#ECFDF5", color: "#10B981", border: "rgba(16,185,129,0.3)", label: "Completed" },
  rejected: { bg: "#FEF2F2", color: "#EF4444", border: "rgba(239,68,68,0.3)", label: "Rejected" },
};

const PLAN_TYPES = { 1: "Basic Plan", 2: "Standard Plan", 3: "Premium Plan" };

const statusStyle = (status) => STATUS_COLORS[status] || STATUS_COLORS.pending;

const formatDate = (iso) => {
  if (!iso) return "N/A";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};

// "healthy_lifestyle" -> "Healthy Lifestyle"
const humanize = (val) => {
  if (val === null || val === undefined || val === "") return "";
  return String(val)
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

// Normalizes a value that may be an array, a comma string, or null into a clean list
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

export default function DietRequestTable() {
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortType, setSortType] = useState("");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortRef = useRef(null);

  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setCurrentPage(1); }, 500);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { fetchRequests(); }, [debouncedSearch, sortType, currentPage]);

  const fetchRequests = () => {
    setAuthorization();
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (sortType === "a-z") { params.append("sortBy", "full_name"); params.append("sortOrder", "ASC"); }
    if (sortType === "z-a") { params.append("sortBy", "full_name"); params.append("sortOrder", "DESC"); }
    params.append("page", currentPage);
    params.append("limit", pagination.limit);

    API.apiGet("dietFormRequests", `?${params.toString()}`)
      .then((res) => {
        const data = res?.data?.data || [];
        const meta = res?.data?.meta || {};
        setRequests(data);
        setPagination({ page: meta.page || 1, limit: meta.limit || 10, total: meta.total || 0, totalPages: meta.totalPages || 1 });
      })
      .catch(() => toast.error("Failed to fetch diet chart requests."))
      .finally(() => setLoading(false));
  };

  const handleViewPlan = (r) => router.push(`/dashboard/diet-plan/${r.id}`);

  useEffect(() => {
    const handler = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const columns = ["#", "Applicant", "Contact", "Plan", "Goals", "Diet", "Location", "Status", "Actions"];

  return (
    <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

      {/* Search & Sort */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <svg style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <FormControl
            type="text"
            placeholder="Search by name, email, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ height: "42px", borderRadius: "10px", border: "1px solid #e5e5e5", paddingLeft: "40px", fontSize: "13px", boxShadow: "none" }}
          />
        </div>

        <div style={{ position: "relative" }} ref={sortRef}>
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            style={{ height: "42px", border: `1px solid ${sortType ? "#1E8E3E" : "#e5e5e5"}`, borderRadius: "10px", padding: "0 14px", background: sortType ? "#f0f9f3" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", minWidth: "130px", fontWeight: 600, fontSize: "13px", color: sortType ? "#1E8E3E" : "#555" }}
          >
            <FaSort style={{ color: sortType ? "#1E8E3E" : "#aaa", fontSize: "13px" }} />
            {sortType === "a-z" ? "Sort: A–Z" : sortType === "z-a" ? "Sort: Z–A" : "Sort By"}
            <FaChevronDown style={{ marginLeft: "auto", fontSize: "11px", color: "#aaa" }} />
          </button>
          {showSortDropdown && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#fff", border: "1px solid #edf1ee", borderRadius: "12px", minWidth: "140px", zIndex: 1000, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: "6px" }}>
              {[{ key: "a-z", label: "A — Z" }, { key: "z-a", label: "Z — A" }].map(({ key, label }) => (
                <div key={key} onClick={() => { setSortType(key); setShowSortDropdown(false); setCurrentPage(1); }}
                  style={{ padding: "9px 14px", cursor: "pointer", borderRadius: "8px", fontSize: "13px", fontWeight: sortType === key ? 700 : 500, color: sortType === key ? "#1E8E3E" : "#444", background: sortType === key ? "#f0f9f3" : "transparent" }}
                >{label}</div>
              ))}
              {sortType && (
                <div onClick={() => { setSortType(""); setShowSortDropdown(false); }}
                  style={{ padding: "9px 14px", cursor: "pointer", borderRadius: "8px", fontSize: "13px", color: "#EF4444", fontWeight: 600 }}>Clear Sort</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div className="spinner-border" style={{ color: "#1E8E3E", width: "2.5rem", height: "2.5rem" }} role="status" />
          <p style={{ marginTop: "16px", color: "#999", fontSize: "14px", fontWeight: 500 }}>Loading...</p>
        </div>
      ) : requests.length > 0 ? (
        <>
          <div style={{ borderRadius: "12px", border: "1px solid #edf1ee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflowX: "auto" }}>
            <Table className="table mb-0" style={{ borderCollapse: "collapse", tableLayout: "fixed", width: "100%", minWidth: "1250px" }}>
              <thead>
                <tr>
                  {columns.map((col) => {
                    const colWidths = { "#": "48px", "Applicant": "180px", "Contact": "200px", "Plan": "120px", "Goals": "150px", "Diet": "120px", "Location": "140px", "Status": "110px", "Actions": "180px" };
                    return (
                      <th key={col} style={{ background: "#1E8E3E", color: "#fff", fontWeight: 600, fontSize: "12px", padding: "12px 14px", whiteSpace: "nowrap", borderBottom: "2px solid #166C31", letterSpacing: "0.3px", width: colWidths[col] || "auto" }}>{col}</th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {requests.map((r, i) => {
                  const st = statusStyle(r.status);
                  const goals = toList(r.goals);
                  return (
                    <tr key={r.id}
                      style={{ borderBottom: "1px solid #edf1ee", background: i % 2 === 0 ? "#fff" : "#fafcfa", transition: "background 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9f3")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafcfa")}
                    >
                      {/* # */}
                      <td style={{ padding: "10px 14px", fontSize: "13px", fontWeight: 700, color: "#1E8E3E", verticalAlign: "middle", width: "48px", maxWidth: "48px" }}>#{r.id}</td>

                      {/* Applicant — avatar + name + submitted */}
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
                        <span style={{ background: "#f0faf8", color: "#0d9488", border: "1px solid rgba(13,148,136,0.2)", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap" }}>
                          {PLAN_TYPES[r.plan_type] || `Plan ${r.plan_type ?? "—"}`}
                        </span>
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

                      {/* Status */}
                      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                        <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: st.color }} />
                          {st.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {/* View Details */}
                          <div onClick={() => { setSelected(r); setShowDetail(true); }}
                            title="View Details"
                            style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                            <FaEye style={{ color: "#3b82f6", fontSize: "14px" }} />
                          </div>

                          {/* View Diet Plan — only when completed */}
                          {r.status === "completed" && (
                            <button
                              onClick={() => handleViewPlan(r)}
                              title="View Diet Plan"
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
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🥗</div>
          <h5 style={{ fontWeight: 700, color: "#333", marginBottom: "8px" }}>No Diet Chart Requests</h5>
          <p style={{ fontSize: "14px", color: "#999" }}>{debouncedSearch ? `No results for "${debouncedSearch}"` : "No diet chart requests found."}</p>
        </div>
      )}

      {/* Detail Modal */}
      <DietRequestDetailModal show={showDetail} onHide={() => setShowDetail(false)} request={selected} />
    </div>
  );
}

// ── Detail modal: shows everything the applicant filled in the form ──────────
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
          const st = statusStyle(r.status);
          return (
            <div>
              {/* Header card */}
              <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "18px" }}>
                <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg, #1E8E3E, #4ade80)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "26px", flexShrink: 0 }}>
                  {(r.full_name || "U").charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h5 style={{ margin: 0, fontWeight: 800, color: "#111827" }}>{r.full_name || "N/A"}</h5>
                  <p style={{ margin: "2px 0 8px", color: "#888", fontSize: "13px" }}>
                    Request #{r.id} • Submitted {formatDate(r.created_at)}
                  </p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: 700 }}>{st.label}</span>
                    <span style={{ background: "#f0faf8", color: "#0d9488", border: "1px solid rgba(13,148,136,0.2)", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: 700 }}>{PLAN_TYPES[r.plan_type] || `Plan ${r.plan_type ?? "—"}`}</span>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
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

              {/* Goals & Activity */}
              <Section title="Goals & Activity">
                <Chips label="Goals" items={toList(r.goals)} color="#2563eb" bg="#eff6ff" border="rgba(37,99,235,0.2)" />
                <div className="row g-3">
                  <Field label="Activity Level" value={humanize(r.activity_level)} />
                  <Field label="Work Type" value={humanize(r.work_type)} />
                  <Field label="Workout Type" value={humanize(r.workout_type)} />
                </div>
              </Section>

              {/* Diet Preferences */}
              <Section title="Diet Preferences">
                <div className="row g-3" style={{ marginBottom: "12px" }}>
                  <Field label="Diet Type" value={humanize(r.diet_type)} />
                </div>
                <Chips label="Cuisine Preference" items={toList(r.cuisine_preference)} color="#7c3aed" bg="#f5f3ff" border="rgba(124,58,237,0.2)" />
                <Chips label="Food Allergies" items={toList(r.food_allergies)} color="#ef4444" bg="#fef2f2" border="rgba(239,68,68,0.2)" />
                <div className="row g-3" style={{ marginTop: "0" }}>
                  <Field label="Foods Disliked" value={r.foods_dislike} full />
                  <Field label="Favorite Foods" value={r.favorite_foods} full />
                </div>
              </Section>

              {/* Health & Medical */}
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

              {/* Contact & Delivery */}
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

              {/* Notes */}
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
