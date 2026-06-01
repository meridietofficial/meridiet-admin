import { useState, useEffect, useRef } from "react";
import { Table, FormControl, Modal, Button } from "react-bootstrap";
import { FaSort, FaChevronDown, FaEye, FaCheckCircle, FaExternalLinkAlt } from "react-icons/fa";
import { MdBlock, MdCheckCircle, MdDelete } from "react-icons/md";
import GlobalPagination from "../common/GlobalPagination";
import API, { setAuthorization } from "../../helpers/api";
import toast from "react-hot-toast";

const VERIFY_STATUS = { 0: "Pending", 1: "Verified", 2: "Rejected" };
const VERIFY_COLORS = {
  0: { bg: "#FFF8E1", color: "#F59E0B", border: "rgba(245,158,11,0.3)" },
  1: { bg: "#ECFDF5", color: "#10B981", border: "rgba(16,185,129,0.3)" },
  2: { bg: "#FEF2F2", color: "#EF4444", border: "rgba(239,68,68,0.3)" },
};

const formatDate = (iso) => {
  if (!iso) return "N/A";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};

// apiKey: "dietitianList" | "dietitianRequests"
// showVerify: true = show Verify button in detail modal
export default function DietitianTable({ apiKey = "dietitianList", showVerify = false }) {
  const [dietitians, setDietitians] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortType, setSortType] = useState("");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortRef = useRef(null);

  const [showDetail, setShowDetail] = useState(false);
  const [selectedDietitian, setSelectedDietitian] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Block / Delete states
  const [togglingId, setTogglingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setCurrentPage(1); }, 500);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { fetchDietitians(); }, [debouncedSearch, sortType, currentPage]);

  const fetchDietitians = () => {
    setAuthorization();
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (sortType === "a-z") { params.append("sortBy", "full_name"); params.append("sortOrder", "ASC"); }
    if (sortType === "z-a") { params.append("sortBy", "full_name"); params.append("sortOrder", "DESC"); }
    params.append("page", currentPage);
    params.append("limit", pagination.limit);

    API.apiGet(apiKey, `?${params.toString()}`)
      .then((res) => {
        const data = res?.data?.data || [];
        const meta = res?.data?.meta || {};
        setDietitians(data);
        setPagination({ page: meta.page || 1, limit: meta.limit || 10, total: meta.total || 0, totalPages: meta.totalPages || 1 });
      })
      .catch(() => toast.error("Failed to fetch dietitians."))
      .finally(() => setLoading(false));
  };

  const handleVerify = () => {
    if (!selectedDietitian) return;
    setVerifying(true);
    API.apiPatch("verifyDietitian", { dietitian_id: selectedDietitian.id })
      .then((res) => {
        toast.success(res?.data?.message || "Dietitian verified successfully.");
        setShowDetail(false);
        fetchDietitians();
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Verification failed."))
      .finally(() => setVerifying(false));
  };

  const handleToggleStatus = (d) => {
    setTogglingId(d.id);
    API.apiPatch("toggleDietitianStatus", { dietitian_id: d.id })
      .then(() => {
        toast.success(d.is_active ? "Dietitian blocked successfully." : "Dietitian unblocked successfully.");
        fetchDietitians();
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to update status."))
      .finally(() => setTogglingId(null));
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    API.apiDel("deleteDietitian", { data: { dietitian_id: deleteTarget.id } })
      .then(() => {
        toast.success("Dietitian deleted successfully.");
        setShowDeleteModal(false);
        setDeleteTarget(null);
        fetchDietitians();
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to delete dietitian."))
      .finally(() => setIsDeleting(false));
  };

  useEffect(() => {
    const handler = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const DocLink = ({ url }) => {
    if (!url) return <span style={{ color: "#aaa", fontSize: "12px" }}>Not uploaded</span>;
    const isPdf = url.toLowerCase().endsWith(".pdf");
    return (
      <a href={url} target="_blank" rel="noreferrer"
        style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#1E8E3E", fontWeight: 600, fontSize: "13px", textDecoration: "none" }}>
        {isPdf ? "View PDF" : "View Image"} <FaExternalLinkAlt size={11} />
      </a>
    );
  };

  const emptyLabel = showVerify ? "No pending requests found." : "No approved dietitians found.";
  const columns = ["#", "Dietitian", "Email", "Phone", "Location", "Specialization", "Experience", "Active", "Actions"];

  return (
    <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

      {/* Search & Sort */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <svg style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <FormControl
            type="text"
            placeholder="Search by name, email, city, specialization..."
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
      ) : dietitians.length > 0 ? (
        <>
          <div style={{ borderRadius: "12px", border: "1px solid #edf1ee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>
            <Table className="table mb-0" style={{ borderCollapse: "collapse", tableLayout: "fixed", width: "100%" }}>
              <thead>
                <tr>
                  {columns.map((col) => {
                    const colWidths = { "#": "48px", "Specialization": "130px", "Experience": "110px", "Active": "90px", "Actions": "110px" };
                    return (
                      <th key={col} style={{ background: "#1E8E3E", color: "#fff", fontWeight: 600, fontSize: "12px", padding: "12px 14px", whiteSpace: "nowrap", borderBottom: "2px solid #166C31", letterSpacing: "0.3px", width: colWidths[col] || "auto" }}>{col}</th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {dietitians.map((d, i) => {
                  const verifyStyle = VERIFY_COLORS[d.is_verified] || VERIFY_COLORS[0];
                  return (
                    <tr key={d.id}
                      style={{ borderBottom: "1px solid #edf1ee", background: i % 2 === 0 ? "#fff" : "#fafcfa", transition: "background 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9f3")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafcfa")}
                    >
                      {/* # */}
                      <td style={{ padding: "10px 14px", fontSize: "13px", fontWeight: 700, color: "#1E8E3E", verticalAlign: "middle", width: "48px", maxWidth: "48px" }}>#{d.id}</td>

                      {/* Dietitian — avatar + name + joined */}
                      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {d.profile_photo ? (
                            <img src={d.profile_photo} alt={d.full_name} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid #edf1ee", flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #1E8E3E, #4ade80)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "14px", flexShrink: 0 }}>
                              {(d.full_name || "D").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "130px" }}>{d.full_name || "N/A"}</p>
                            <p style={{ margin: 0, fontSize: "11px", color: "#aaa" }}>{formatDate(d.created_at)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: "10px 14px", fontSize: "12px", color: "#3b82f6", fontWeight: 500, verticalAlign: "middle" }}>{d.email || "—"}</td>

                      {/* Phone */}
                      <td style={{ padding: "10px 14px", fontSize: "12px", color: "#555", verticalAlign: "middle", whiteSpace: "nowrap" }}>{d.phone_number ? `${d.phone_code || ""} ${d.phone_number}`.trim() : "—"}</td>

                      {/* Location */}
                      <td style={{ padding: "10px 14px", fontSize: "12px", color: "#555", verticalAlign: "middle" }}>{[d.city, d.state].filter(Boolean).join(", ") || "—"}</td>

                      {/* Specialization */}
                      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                        <span style={{ background: "#f0faf8", color: "#0d9488", border: "1px solid rgba(13,148,136,0.2)", borderRadius: "20px", padding: "3px 9px", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap" }}>{d.specialization || "N/A"}</span>
                      </td>

                      {/* Experience */}
                      <td style={{ padding: "10px 14px", fontSize: "11px", color: "#666", verticalAlign: "middle" }}>{d.experience || "—"}</td>


                      {/* Active */}
                      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                        <span style={{ background: d.is_active ? "#dcfce7" : "#fee2e2", color: d.is_active ? "#16a34a" : "#ef4444", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: d.is_active ? "#16a34a" : "#ef4444" }} />
                          {d.is_active ? "Active" : "Blocked"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {/* View */}
                          <div onClick={() => { setSelectedDietitian(d); setShowDetail(true); }}
                            title="View Details"
                            style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                            <FaEye style={{ color: "#3b82f6", fontSize: "14px" }} />
                          </div>

                          {/* Quick Verify — requests list only */}
                          {showVerify && (
                            <button
                              onClick={() => { setSelectedDietitian(d); handleVerifyDirect(d); }}
                              title="Verify"
                              style={{ height: "32px", borderRadius: "8px", background: "#f0f9f3", border: "1px solid rgba(30,142,62,0.3)", display: "flex", alignItems: "center", gap: "5px", padding: "0 10px", cursor: "pointer", fontSize: "12px", fontWeight: 700, color: "#1E8E3E", transition: "all 0.2s" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "#1E8E3E"; e.currentTarget.style.color = "#fff"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "#f0f9f3"; e.currentTarget.style.color = "#1E8E3E"; }}>
                              <FaCheckCircle size={12} /> Verify
                            </button>
                          )}

                          {/* Block / Unblock */}
                          <div
                            onClick={() => { if (togglingId !== d.id) handleToggleStatus(d); }}
                            title={d.is_active ? "Block" : "Unblock"}
                            style={{ width: "32px", height: "32px", borderRadius: "8px", background: d.is_active ? "#fef2f2" : "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", cursor: togglingId === d.id ? "wait" : "pointer", transition: "all 0.2s" }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                            {d.is_active
                              ? <MdBlock style={{ color: "#ef4444", fontSize: "16px" }} />
                              : <MdCheckCircle style={{ color: "#16a34a", fontSize: "16px" }} />}
                          </div>

                          {/* Delete */}
                          <div
                            onClick={() => { setDeleteTarget(d); setShowDeleteModal(true); }}
                            title="Delete"
                            style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                            <MdDelete style={{ color: "#ef4444", fontSize: "16px" }} />
                          </div>
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
            <span>Showing <strong style={{ color: "#111827" }}>{dietitians.length}</strong> of <strong style={{ color: "#111827" }}>{pagination.total}</strong> {showVerify ? "requests" : "dietitians"}</span>
            <span style={{ background: "#f0f9f3", padding: "4px 14px", borderRadius: "20px", fontWeight: 500, color: "#1E8E3E" }}>Page {pagination.page} of {pagination.totalPages}</span>
          </div>

          {pagination.totalPages > 1 && (
            <GlobalPagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setCurrentPage} />
          )}
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 20px", borderRadius: "12px", border: "1px solid #edf1ee" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>{showVerify ? "📋" : "🧑‍⚕️"}</div>
          <h5 style={{ fontWeight: 700, color: "#333", marginBottom: "8px" }}>{showVerify ? "No Pending Requests" : "No Dietitians Found"}</h5>
          <p style={{ fontSize: "14px", color: "#999" }}>{debouncedSearch ? `No results for "${debouncedSearch}"` : emptyLabel}</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => { setShowDeleteModal(false); setDeleteTarget(null); }} size="sm" centered>
        <Modal.Body style={{ padding: "32px 24px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <MdDelete style={{ color: "#ef4444", fontSize: "28px" }} />
          </div>
          <h5 style={{ fontWeight: 700, marginBottom: "8px" }}>Delete Dietitian?</h5>
          <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>
            Are you sure you want to delete <strong>{deleteTarget?.full_name}</strong>? This cannot be undone.
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <Button variant="outline-secondary" onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }} disabled={isDeleting} style={{ minWidth: "100px", fontWeight: 600 }}>Cancel</Button>
            <Button onClick={handleDelete} disabled={isDeleting} style={{ minWidth: "100px", fontWeight: 600, background: "#ef4444", border: "none" }}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Detail Modal */}
      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="lg" centered scrollable>
        <Modal.Header closeButton style={{ background: "#1E8E3E", color: "#fff", borderBottom: "none", padding: "1.25rem 1.75rem" }}>
          <Modal.Title style={{ fontWeight: 700, fontSize: "1.1rem" }}>
            {showVerify ? "Review Request" : "Dietitian Details"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: "#f8f9fa", padding: "1.5rem", maxHeight: "72vh", overflowY: "auto" }}>
          {selectedDietitian && (() => {
            const d = selectedDietitian;
            const verifyStyle = VERIFY_COLORS[d.is_verified] || VERIFY_COLORS[0];
            return (
              <div>
                {/* Header card */}
                <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "18px" }}>
                  {d.profile_photo ? (
                    <img src={d.profile_photo} alt={d.full_name} style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", border: "3px solid #edf1ee" }} />
                  ) : (
                    <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg, #1E8E3E, #4ade80)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "26px", flexShrink: 0 }}>
                      {(d.full_name || "D").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <h5 style={{ margin: 0, fontWeight: 800, color: "#111827" }}>{d.full_name}</h5>
                    <p style={{ margin: "2px 0 8px", color: "#888", fontSize: "13px" }}>{d.email}</p>
                    {!showVerify && (
                      <span style={{ background: verifyStyle.bg, color: verifyStyle.color, border: `1px solid ${verifyStyle.border}`, borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: 700 }}>
                        {VERIFY_STATUS[d.is_verified] ?? "Pending"}
                      </span>
                    )}
                    {showVerify && (
                      <span style={{ background: "#FFF8E1", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: 700 }}>
                        Pending Approval
                      </span>
                    )}
                  </div>
                </div>

                {/* Info grid */}
                <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <h6 style={{ fontWeight: 700, color: "#1E8E3E", marginBottom: "14px", paddingBottom: "8px", borderBottom: "1px solid #edf1ee" }}>Professional Info</h6>
                  <div className="row g-3">
                    {[
                      { label: "Phone", value: `${d.phone_code || ""} ${d.phone_number || ""}`.trim() || "N/A" },
                      { label: "City", value: d.city },
                      { label: "State", value: d.state },
                      { label: "Specialization", value: d.specialization },
                      { label: "Experience", value: d.experience },
                      { label: "Highest Degree", value: d.highest_degree },
                      { label: "Registration No.", value: d.registration_number },
                      { label: "Submitted", value: formatDate(d.created_at) },
                    ].map(({ label, value }) => (
                      <div className="col-md-6" key={label}>
                        <div style={{ background: "#fafcfa", borderRadius: "10px", padding: "10px 14px" }}>
                          <small style={{ color: "#aaa", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</small>
                          <p style={{ margin: 0, fontWeight: 600, color: "#111827", fontSize: "13px", marginTop: "2px" }}>{value || "N/A"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents */}
                <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <h6 style={{ fontWeight: 700, color: "#1E8E3E", marginBottom: "14px", paddingBottom: "8px", borderBottom: "1px solid #edf1ee" }}>Uploaded Documents</h6>
                  <div className="row g-3">
                    {[
                      { label: "Degree Certificate", url: d.degree_certificate },
                      { label: "Registration Certificate", url: d.registration_certificate },
                      { label: "ID Proof", url: d.id_proof },
                    ].map(({ label, url }) => (
                      <div className="col-md-4" key={label}>
                        <div style={{ background: "#fafcfa", borderRadius: "10px", padding: "14px", textAlign: "center" }}>
                          <div style={{ fontSize: "28px", marginBottom: "6px" }}>📄</div>
                          <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 700, color: "#555" }}>{label}</p>
                          <DocLink url={url} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal.Body>
        <Modal.Footer style={{ background: "#f8f9fa", borderTop: "1px solid #edf1ee", padding: "1rem 1.5rem", gap: "10px" }}>
          {showVerify && selectedDietitian && (
            <Button
              onClick={handleVerify}
              disabled={verifying}
              style={{ background: "#1E8E3E", border: "none", borderRadius: "8px", padding: "8px 20px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
            >
              <FaCheckCircle /> {verifying ? "Verifying..." : "Verify Dietitian"}
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowDetail(false)} style={{ borderRadius: "8px", padding: "8px 20px", fontWeight: 600 }}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );

  function handleVerifyDirect(dietitian) {
    setVerifying(true);
    API.apiPatch("verifyDietitian", { dietitian_id: dietitian.id })
      .then((res) => {
        toast.success(res?.data?.message || "Dietitian verified successfully.");
        fetchDietitians();
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Verification failed."))
      .finally(() => setVerifying(false));
  }
}
