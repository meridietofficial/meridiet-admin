import { useState, useEffect, useRef } from "react";
import { Table, FormControl, Modal, Button } from "react-bootstrap";
import { FaSort, FaChevronDown, FaEye } from "react-icons/fa";
import { MdBlock, MdCheckCircle, MdDelete } from "react-icons/md";
import GlobalPagination from "../common/GlobalPagination";
import API, { setAuthorization } from "../../helpers/api";
import toast from "react-hot-toast";

const formatDate = (iso) => {
  if (!iso) return "N/A";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};

export default function ExistingUserTable() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortType, setSortType] = useState("");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortRef = useRef(null);

  // Action states
  const [togglingId, setTogglingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detail modal
  const [showDetail, setShowDetail] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setCurrentPage(1); }, 500);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { fetchUsers(); }, [debouncedSearch, sortType, currentPage]);

  const fetchUsers = () => {
    setAuthorization();
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (sortType === "a-z") { params.append("sortBy", "full_name"); params.append("sortOrder", "ASC"); }
    if (sortType === "z-a") { params.append("sortBy", "full_name"); params.append("sortOrder", "DESC"); }
    params.append("page", currentPage);
    params.append("limit", pagination.limit);

    API.apiGet("existingUserList", `?${params.toString()}`)
      .then((res) => {
        const data = res?.data?.data || [];
        const meta = res?.data?.meta || {};
        setUsers(data);
        setPagination({ page: meta.page || 1, limit: meta.limit || 10, total: meta.total || 0, totalPages: meta.totalPages || 1 });
      })
      .catch(() => toast.error("Failed to fetch users."))
      .finally(() => setLoading(false));
  };

  const handleToggleStatus = (user) => {
    setTogglingId(user.id);
    API.apiPatch("changeUserStatus", { user_id: user.id })
      .then(() => {
        toast.success(user.is_active ? "User blocked successfully." : "User unblocked successfully.");
        fetchUsers();
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to update status."))
      .finally(() => setTogglingId(null));
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    setIsDeleting(true);
    API.apiDel("removeUser", { data: { user_id: selectedUser.id } })
      .then(() => {
        toast.success("User deleted successfully.");
        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchUsers();
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to delete user."))
      .finally(() => setIsDeleting(false));
  };

  const fetchUserDetail = (userId) => {
    setLoadingDetail(true);
    setShowDetail(true);
    setDetailUser(null);
    API.apiGet("getUserCompleteDetails", String(userId))
      .then((res) => {
        const data = res?.data?.data || res?.data?.response?.data || null;
        if (data) setDetailUser(data);
        else { toast.error("User details not found."); setShowDetail(false); }
      })
      .catch(() => { toast.error("Failed to fetch user details."); setShowDetail(false); })
      .finally(() => setLoadingDetail(false));
  };

  // Close sort on outside click
  useEffect(() => {
    const handler = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

      {/* Search & Sort */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <svg style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <FormControl
            type="text"
            placeholder="Search by name, email, phone..."
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
          <p style={{ marginTop: "16px", color: "#999", fontSize: "14px", fontWeight: 500 }}>Loading users...</p>
        </div>
      ) : users.length > 0 ? (
        <>
          <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #edf1ee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <Table className="table mb-0" style={{ borderCollapse: "collapse", minWidth: "750px" }}>
              <thead>
                <tr>
                  {["#", "Joined", "Name", "Email", "Phone", "Role", "Status", "Actions"].map((col) => (
                    <th key={col} style={{ background: "#1E8E3E", color: "#fff", fontWeight: 600, fontSize: "13px", padding: "14px 16px", whiteSpace: "nowrap", borderBottom: "2px solid #166C31", letterSpacing: "0.3px" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr key={user.id}
                    style={{ borderBottom: "1px solid #edf1ee", background: i % 2 === 0 ? "#fff" : "#fafcfa", transition: "background 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9f3")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafcfa")}
                  >
                    {/* ID */}
                    <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 700, color: "#1E8E3E", verticalAlign: "middle" }}>#{user.id}</td>

                    {/* Joined */}
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "#888", verticalAlign: "middle", whiteSpace: "nowrap" }}>{formatDate(user.created_at)}</td>

                    {/* Name */}
                    <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600, color: "#111827", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name} style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover", border: "2px solid #edf1ee", flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg, #1E8E3E, #4ade80)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "14px", flexShrink: 0 }}>
                            {(user.full_name || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                        {user.full_name || "N/A"}
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: "12px 16px", fontSize: "13px", color: "#3b82f6", verticalAlign: "middle" }}>{user.email || "—"}</td>

                    {/* Phone */}
                    <td style={{ padding: "12px 16px", fontSize: "13px", color: "#555", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                      {user.phone_number ? `${user.phone_code || ""} ${user.phone_number}`.trim() : "—"}
                    </td>

                    {/* Role */}
                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      <span style={{ background: "#f0f9f3", color: "#1E8E3E", border: "1px solid rgba(30,142,62,0.2)", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>
                        {user.role || "user"}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      <span style={{ background: user.is_active ? "#dcfce7" : "#fee2e2", color: user.is_active ? "#16a34a" : "#ef4444", borderRadius: "20px", padding: "5px 12px", fontSize: "12px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: user.is_active ? "#16a34a" : "#ef4444" }} />
                        {user.is_active ? "Active" : "Blocked"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {/* View */}
                        <div onClick={() => fetchUserDetail(user.id)}
                          title="View Details"
                          style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        >
                          <FaEye style={{ color: "#3b82f6", fontSize: "14px" }} />
                        </div>

                        {/* Block / Unblock */}
                        <div
                          onClick={() => { if (togglingId !== user.id) handleToggleStatus(user); }}
                          title={user.is_active ? "Block User" : "Unblock User"}
                          style={{ width: "32px", height: "32px", borderRadius: "8px", background: user.is_active ? "#fef2f2" : "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", cursor: togglingId === user.id ? "wait" : "pointer", transition: "all 0.2s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        >
                          {user.is_active
                            ? <MdBlock style={{ color: "#ef4444", fontSize: "16px" }} />
                            : <MdCheckCircle style={{ color: "#16a34a", fontSize: "16px" }} />}
                        </div>

                        {/* Delete */}
                        <div
                          onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                          title="Delete User"
                          style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        >
                          <MdDelete style={{ color: "#ef4444", fontSize: "16px" }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Footer stats */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px", fontSize: "13px", color: "#888", marginTop: "4px" }}>
            <span>Showing <strong style={{ color: "#111827" }}>{users.length}</strong> of <strong style={{ color: "#111827" }}>{pagination.total}</strong> users</span>
            <span style={{ background: "#f0f9f3", padding: "4px 14px", borderRadius: "20px", fontWeight: 500, color: "#1E8E3E" }}>Page {pagination.page} of {pagination.totalPages}</span>
          </div>

          {pagination.totalPages > 1 && (
            <GlobalPagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setCurrentPage} />
          )}
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 20px", borderRadius: "12px", border: "1px solid #edf1ee" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>👥</div>
          <h5 style={{ fontWeight: 700, color: "#333", marginBottom: "8px" }}>No Users Found</h5>
          <p style={{ fontSize: "14px", color: "#999" }}>{debouncedSearch ? `No results for "${debouncedSearch}"` : "No users are currently registered."}</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => { setShowDeleteModal(false); setSelectedUser(null); }} size="sm" centered>
        <Modal.Body style={{ padding: "32px 24px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <MdDelete style={{ color: "#ef4444", fontSize: "28px" }} />
          </div>
          <h5 style={{ fontWeight: 700, marginBottom: "8px" }}>Delete User?</h5>
          <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>
            Are you sure you want to delete <strong>{selectedUser?.full_name}</strong>? This cannot be undone.
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <Button variant="outline-secondary" onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }} disabled={isDeleting} style={{ minWidth: "100px", fontWeight: 600 }}>Cancel</Button>
            <Button onClick={handleDelete} disabled={isDeleting} style={{ minWidth: "100px", fontWeight: 600, background: "#ef4444", border: "none" }}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* User Detail Modal */}
      <Modal show={showDetail} onHide={() => { setShowDetail(false); setDetailUser(null); }} size="md" centered scrollable>
        <Modal.Header closeButton style={{ background: "#1E8E3E", color: "#fff", borderBottom: "none", padding: "1.1rem 1.5rem" }}>
          <Modal.Title style={{ fontWeight: 700, fontSize: "1rem" }}>User Details</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: "#f8f9fa", padding: "1.25rem" }}>
          {loadingDetail ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div className="spinner-border" style={{ color: "#1E8E3E" }} role="status" />
              <p style={{ marginTop: "12px", color: "#999" }}>Loading...</p>
            </div>
          ) : detailUser ? (
            <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              {/* Avatar + name */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #edf1ee" }}>
                {detailUser.avatar_url ? (
                  <img src={detailUser.avatar_url} alt={detailUser.full_name} style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", border: "2px solid #edf1ee" }} />
                ) : (
                  <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg, #1E8E3E, #4ade80)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "22px", flexShrink: 0 }}>
                    {(detailUser.full_name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#111827" }}>{detailUser.full_name || "N/A"}</p>
                  <span style={{ background: "#f0f9f3", color: "#1E8E3E", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 600, textTransform: "capitalize" }}>{detailUser.role || "user"}</span>
                </div>
              </div>
              {/* Info rows */}
              <div className="row g-3">
                {[
                  { label: "User ID", value: `#${detailUser.id}` },
                  { label: "Email", value: detailUser.email },
                  { label: "Phone", value: detailUser.phone_number ? `${detailUser.phone_code || ""} ${detailUser.phone_number}`.trim() : null },
                  { label: "Status", value: detailUser.is_active ? "Active" : "Blocked" },
                  { label: "Joined", value: formatDate(detailUser.created_at) },
                  { label: "Last Updated", value: formatDate(detailUser.updated_at) },
                ].map(({ label, value }) => (
                  <div className="col-6" key={label}>
                    <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px" }}>
                      <small style={{ color: "#aaa", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</small>
                      <p style={{ margin: 0, fontWeight: 600, color: "#111827", fontSize: "13px", marginTop: "2px" }}>{value || "N/A"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>No details available.</div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ background: "#f8f9fa", borderTop: "1px solid #edf1ee" }}>
          <Button variant="secondary" onClick={() => { setShowDetail(false); setDetailUser(null); }} style={{ borderRadius: "8px", fontWeight: 600 }}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
