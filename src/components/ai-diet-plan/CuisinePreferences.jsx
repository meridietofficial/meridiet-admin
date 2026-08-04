import { useState, useEffect } from "react";
import { Modal, Button, Table } from "react-bootstrap";
import { LuUtensilsCrossed, LuPlus, LuPencil, LuTrash2, LuRotateCcw, LuHash, LuAlignLeft, LuArrowUpDown } from "react-icons/lu";
import toast from "react-hot-toast";
import cuisinePreferencesService from "../../services/cuisinePreferencesService";

const EMPTY_FORM = { cuisine_key: "", label: "", description: "", display_order: "" };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "deleted", label: "Deleted" },
];

function StatusBadge({ is_active, is_deleted }) {
  if (is_deleted)
    return <span style={{ background: "#fee2e2", color: "#ef4444", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>Deleted</span>;
  return (
    <span style={{ background: is_active ? "#dcfce7" : "#f3f4f6", color: is_active ? "#16a34a" : "#6b7280", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: is_active ? "#16a34a" : "#9ca3af" }} />
      {is_active ? "Active" : "Inactive"}
    </span>
  );
}

function ActionBtn({ title, bg, onClick, children }) {
  return (
    <div onClick={onClick} title={title}
      style={{ width: "32px", height: "32px", borderRadius: "8px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform 0.15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {children}
    </div>
  );
}

function FieldLabel({ label, required }) {
  return (
    <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>
      {label}{required && <span style={{ color: "#ef4444", marginLeft: "3px" }}>*</span>}
    </label>
  );
}

function StyledInput({ icon: Icon, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      {Icon && (
        <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: focused ? "#1E8E3E" : "#9ca3af", pointerEvents: "none", display: "flex" }}>
          <Icon size={14} />
        </div>
      )}
      <input
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={{
          height: "42px", borderRadius: "10px", width: "100%", fontSize: "13px",
          padding: Icon ? "0 12px 0 36px" : "0 12px",
          border: `1.5px solid ${focused ? "#1E8E3E" : "#e5e7eb"}`,
          outline: "none", background: "#fff", transition: "border-color 0.2s",
          boxShadow: focused ? "0 0 0 3px rgba(30,142,62,0.1)" : "none",
          color: "#111827",
          ...props.style,
        }}
      />
    </div>
  );
}

function StyledTextarea(props) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      style={{
        borderRadius: "10px", width: "100%", fontSize: "13px", padding: "10px 12px",
        border: `1.5px solid ${focused ? "#1E8E3E" : "#e5e7eb"}`,
        outline: "none", background: "#fff", transition: "border-color 0.2s", resize: "vertical",
        boxShadow: focused ? "0 0 0 3px rgba(30,142,62,0.1)" : "none",
        color: "#111827",
      }}
    />
  );
}

function StatBox({ label, value, color, bg }) {
  return (
    <div style={{ background: bg, borderRadius: "12px", padding: "12px 18px", display: "flex", alignItems: "center", gap: "12px", border: `1px solid ${color}22`, minWidth: "120px" }}>
      <div>
        <p style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>{value ?? "—"}</p>
        <p style={{ margin: 0, fontSize: "11px", color: "#6b7280", fontWeight: 500, marginTop: "1px", whiteSpace: "nowrap" }}>{label}</p>
      </div>
    </div>
  );
}

export default function CuisinePreferences() {
  const [cuisines, setCuisines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchCuisines(); }, []);

  const fetchCuisines = () => {
    setLoading(true);
    cuisinePreferencesService.list()
      .then((res) => setCuisines(res?.data?.data || []))
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to fetch cuisine preferences."))
      .finally(() => setLoading(false));
  };

  const filtered = cuisines.filter((c) => {
    if (filter === "deleted") return c.is_deleted === 1;
    if (filter === "active") return c.is_deleted === 0 && c.is_active === 1;
    if (filter === "inactive") return c.is_deleted === 0 && c.is_active === 0;
    return true;
  });

  const stats = {
    total: cuisines.length,
    active: cuisines.filter((c) => c.is_active === 1 && c.is_deleted === 0).length,
    inactive: cuisines.filter((c) => c.is_active === 0 && c.is_deleted === 0).length,
    deleted: cuisines.filter((c) => c.is_deleted === 1).length,
  };

  const setField = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };

  const openEdit = (cuisine) => {
    setEditing(cuisine);
    setForm({
      cuisine_key: cuisine.cuisine_key || "",
      label: cuisine.label || "",
      description: cuisine.description || "",
      display_order: cuisine.display_order ?? "",
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.cuisine_key.trim()) { toast.error("Cuisine key is required."); return; }
    if (!form.label.trim()) { toast.error("Label is required."); return; }

    const payload = {
      cuisine_key: form.cuisine_key.trim().toLowerCase(),
      label: form.label.trim(),
      description: form.description.trim() || null,
      display_order: form.display_order === "" ? 0 : Number(form.display_order),
    };

    setSaving(true);
    const call = editing
      ? cuisinePreferencesService.update(editing.id, payload)
      : cuisinePreferencesService.create(payload);

    call
      .then(() => {
        toast.success(editing ? "Cuisine preference updated!" : "Cuisine preference created!");
        setShowForm(false);
        fetchCuisines();
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Operation failed."))
      .finally(() => setSaving(false));
  };

  const openDelete = (cuisine) => { setDeleteTarget(cuisine); setShowDelete(true); };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    cuisinePreferencesService.remove(deleteTarget.id)
      .then(() => {
        toast.success("Cuisine preference deleted.");
        setShowDelete(false);
        setDeleteTarget(null);
        fetchCuisines();
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to delete."))
      .finally(() => setDeleting(false));
  };

  const handleRestore = (cuisine) => {
    cuisinePreferencesService.update(cuisine.id, { is_deleted: 0, is_active: 1 })
      .then(() => { toast.success("Cuisine preference restored."); fetchCuisines(); })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to restore."));
  };

  const handleToggleActive = (cuisine) => {
    const newActive = cuisine.is_active === 1 ? 0 : 1;
    cuisinePreferencesService.update(cuisine.id, { is_active: newActive })
      .then(() => { toast.success(newActive ? "Cuisine activated." : "Cuisine deactivated."); fetchCuisines(); })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed."));
  };

  return (
    <div style={{ padding: "4px 0" }}>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div style={{ width: "4px", height: "28px", background: "linear-gradient(180deg, #1E8E3E, #4ade80)", borderRadius: "4px" }} />
            <h2 style={{ fontWeight: 800, margin: 0, fontSize: "20px" }}>
              <span style={{ color: "#111827" }}>CUISINE</span>
              <span style={{ color: "#1E8E3E" }}> LIST</span>
            </h2>
          </div>
          <p style={{ color: "#999", marginBottom: 0, paddingLeft: "14px", fontSize: "13px" }}>Manage cuisine preferences used in AI diet plan generation.</p>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <StatBox label="Total Cuisines" value={stats.total} color="#6366f1" bg="#f5f3ff" />
          <StatBox label="Active" value={stats.active} color="#16a34a" bg="#f0fdf4" />
          <StatBox label="Inactive" value={stats.inactive} color="#f59e0b" bg="#fffbeb" />
        </div>
      </div>

      {/* Card */}
      <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {FILTERS.map(({ key, label }) => (
              <button key={key} onClick={() => setFilter(key)}
                style={{
                  padding: "7px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1.5px solid",
                  borderColor: filter === key ? "#1E8E3E" : "#e5e7eb",
                  background: filter === key ? "#f0fdf4" : "#fff",
                  color: filter === key ? "#1E8E3E" : "#6b7280",
                  transition: "all 0.15s",
                }}>
                {label}
                {key !== "all" && (
                  <span style={{ marginLeft: "6px", background: filter === key ? "#1E8E3E" : "#e5e7eb", color: filter === key ? "#fff" : "#6b7280", borderRadius: "20px", padding: "1px 7px", fontSize: "10px", fontWeight: 700 }}>
                    {key === "active" ? stats.active : key === "inactive" ? stats.inactive : stats.deleted}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          <button onClick={openCreate}
            style={{ height: "40px", border: "none", borderRadius: "10px", padding: "0 18px", background: "#1E8E3E", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "13px", color: "#fff", whiteSpace: "nowrap" }}>
            <LuPlus size={15} /> Add Cuisine
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div className="spinner-border" style={{ color: "#1E8E3E", width: "2.5rem", height: "2.5rem" }} role="status" />
            <p style={{ marginTop: "16px", color: "#999", fontSize: "14px", fontWeight: 500 }}>Loading cuisine preferences...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #edf1ee" }}>
            <Table className="table mb-0" style={{ borderCollapse: "collapse", minWidth: "700px" }}>
              <thead>
                <tr>
                  {["S.No", "Label", "Cuisine Key", "Description", "Order", "Status", "Actions"].map((col) => (
                    <th key={col} style={{ background: "#1E8E3E", color: "#fff", fontWeight: 600, fontSize: "13px", padding: "14px 16px", whiteSpace: "nowrap", borderBottom: "2px solid #166C31", letterSpacing: "0.3px" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id}
                    style={{ borderBottom: "1px solid #edf1ee", background: i % 2 === 0 ? "#fff" : "#fafcfa", opacity: c.is_deleted ? 0.6 : 1 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9f3")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafcfa")}>

                    <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 700, color: "#1E8E3E", verticalAlign: "middle" }}>{i + 1}</td>

                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#111827" }}>{c.label}</p>
                    </td>

                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#6366f1", background: "#f5f3ff", padding: "3px 8px", borderRadius: "6px", border: "1px solid #e0e7ff" }}>{c.cuisine_key}</span>
                    </td>

                    <td style={{ padding: "12px 16px", verticalAlign: "middle", maxWidth: "220px" }}>
                      <p style={{ margin: 0, fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {c.description || <span style={{ color: "#d1d5db" }}>—</span>}
                      </p>
                    </td>

                    <td style={{ padding: "12px 16px", verticalAlign: "middle", textAlign: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: "13px", color: "#374151" }}>{c.display_order}</span>
                    </td>

                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      <StatusBadge is_active={c.is_active} is_deleted={c.is_deleted} />
                    </td>

                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {!c.is_deleted && (
                          <>
                            <ActionBtn title="Edit" bg="#f0f9f3" onClick={() => openEdit(c)}>
                              <LuPencil size={14} color="#1E8E3E" />
                            </ActionBtn>
                            <ActionBtn title={c.is_active ? "Deactivate" : "Activate"} bg={c.is_active ? "#fffbeb" : "#f0fdf4"} onClick={() => handleToggleActive(c)}>
                              <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: c.is_active ? "#f59e0b" : "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff" }} />
                              </span>
                            </ActionBtn>
                            <ActionBtn title="Delete" bg="#fef2f2" onClick={() => openDelete(c)}>
                              <LuTrash2 size={14} color="#ef4444" />
                            </ActionBtn>
                          </>
                        )}
                        {c.is_deleted === 1 && (
                          <ActionBtn title="Restore" bg="#f0fdf4" onClick={() => handleRestore(c)}>
                            <LuRotateCcw size={14} color="#1E8E3E" />
                          </ActionBtn>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", borderRadius: "12px", border: "1px solid #edf1ee" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <LuUtensilsCrossed size={26} color="#1E8E3E" />
            </div>
            <h5 style={{ fontWeight: 700, color: "#333", marginBottom: "8px" }}>No Cuisines Found</h5>
            <p style={{ fontSize: "14px", color: "#999", marginBottom: "16px" }}>
              {filter !== "all" ? `No ${filter} cuisines found.` : "No cuisine preferences have been added yet."}
            </p>
            {filter === "all" && (
              <button onClick={openCreate} style={{ padding: "10px 20px", background: "#1E8E3E", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                Add First Cuisine
              </button>
            )}
          </div>
        )}

        {filtered.length > 0 && (
          <p style={{ margin: "12px 0 0", fontSize: "12px", color: "#9ca3af" }}>
            Showing <strong style={{ color: "#111827" }}>{filtered.length}</strong> of <strong style={{ color: "#111827" }}>{cuisines.length}</strong> cuisines
          </p>
        )}
      </div>

      {/* ══ CREATE / EDIT MODAL ══ */}
      <Modal show={showForm} onHide={() => !saving && setShowForm(false)} size="md" centered>
        <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #1E8E3E 0%, #0f5c26 100%)", color: "#fff", borderBottom: "none", padding: "1.2rem 1.6rem" }}>
          <Modal.Title style={{ fontWeight: 800, fontSize: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LuUtensilsCrossed size={16} color="#fff" />
            </div>
            {editing ? `Edit — ${editing.label}` : "Add Cuisine Preference"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ padding: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            <div>
              <FieldLabel label="Cuisine Key" required />
              <StyledInput icon={LuHash} placeholder="e.g. north_indian" value={form.cuisine_key}
                onChange={(e) => setField("cuisine_key", e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                disabled={!!editing}
                style={{ background: editing ? "#f9fafb" : "#fff", cursor: editing ? "not-allowed" : "text" }} />
              <p style={{ margin: "4px 0 0 2px", fontSize: "11px", color: "#9ca3af" }}>
                {editing ? "Cuisine key cannot be changed after creation." : "Unique internal key — auto lowercased, spaces → underscores."}
              </p>
            </div>

            <div>
              <FieldLabel label="Label" required />
              <StyledInput icon={LuAlignLeft} placeholder="e.g. North Indian" value={form.label}
                onChange={(e) => setField("label", e.target.value)} />
            </div>

            <div>
              <FieldLabel label="Description" />
              <StyledTextarea rows={3} placeholder="e.g. Roti, dal, sabzi, paneer-based meals"
                value={form.description} onChange={(e) => setField("description", e.target.value)} />
            </div>

            <div>
              <FieldLabel label="Display Order" />
              <StyledInput icon={LuArrowUpDown} type="number" min="0" placeholder="e.g. 1 (default: 0)"
                value={form.display_order} onChange={(e) => setField("display_order", e.target.value)} />
            </div>

          </div>
        </Modal.Body>

        <Modal.Footer style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb", padding: "14px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>
              Fields marked <span style={{ color: "#ef4444" }}>*</span> are required
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <Button variant="outline-secondary" onClick={() => setShowForm(false)} disabled={saving}
                style={{ borderRadius: "10px", fontWeight: 600, padding: "8px 18px", fontSize: "13px" }}>
                Cancel
              </Button>
              <button onClick={handleSave} disabled={saving} style={{
                padding: "8px 22px", borderRadius: "10px", border: "none", fontWeight: 700, fontSize: "13px",
                background: saving ? "#9ca3af" : "linear-gradient(135deg, #1E8E3E, #166C31)",
                color: "#fff", cursor: saving ? "not-allowed" : "pointer",
                boxShadow: saving ? "none" : "0 4px 12px rgba(30,142,62,0.35)",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                {saving
                  ? <><span className="spinner-border spinner-border-sm" role="status" style={{ width: "13px", height: "13px", borderWidth: "2px" }} /> Saving...</>
                  : <><LuUtensilsCrossed size={14} /> {editing ? "Update Cuisine" : "Create Cuisine"}</>
                }
              </button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>

      {/* ══ DELETE CONFIRM ══ */}
      <Modal show={showDelete} onHide={() => !deleting && setShowDelete(false)} size="sm" centered>
        <Modal.Body style={{ padding: "32px 24px", textAlign: "center" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <LuTrash2 size={24} color="#ef4444" />
          </div>
          <h5 style={{ fontWeight: 700, marginBottom: "8px" }}>Delete Cuisine?</h5>
          <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "4px" }}>
            <strong>{deleteTarget?.label}</strong> will be soft-deleted.
          </p>
          <p style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "24px" }}>You can restore it anytime.</p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <Button variant="outline-secondary" onClick={() => setShowDelete(false)} disabled={deleting}
              style={{ minWidth: "90px", fontWeight: 600, borderRadius: "8px" }}>
              Cancel
            </Button>
            <button onClick={handleDelete} disabled={deleting} style={{
              minWidth: "110px", fontWeight: 600, borderRadius: "8px", border: "none", padding: "8px 18px",
              background: deleting ? "#9ca3af" : "#ef4444", color: "#fff", cursor: deleting ? "not-allowed" : "pointer",
            }}>
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Modal.Body>
      </Modal>

    </div>
  );
}
