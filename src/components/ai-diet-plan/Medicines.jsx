import { useState, useEffect, useRef } from "react";
import { Modal, Button, Table } from "react-bootstrap";
import { LuPill, LuPlus, LuPencil, LuTrash2, LuRotateCcw, LuHash, LuAlignLeft, LuArrowUpDown, LuPin, LuChevronDown, LuX } from "react-icons/lu";
import toast from "react-hot-toast";
import medicinesService from "../../services/medicinesService";

// ── Category config ────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "diabetes",     label: "Diabetes",     color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  { key: "thyroid",      label: "Thyroid",      color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { key: "bp",           label: "BP",           color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  { key: "cholesterol",  label: "Cholesterol",  color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
  { key: "heart",        label: "Heart",        color: "#e11d48", bg: "#fff1f2", border: "#fecdd3" },
  { key: "supplements",  label: "Supplements",  color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  { key: "hormonal",     label: "Hormonal",     color: "#db2777", bg: "#fdf2f8", border: "#fbcfe8" },
  { key: "digestive",    label: "Digestive",    color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  { key: "steroids",     label: "Steroids",     color: "#4338ca", bg: "#eef2ff", border: "#c7d2fe" },
  { key: "uric_acid",    label: "Uric Acid",    color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4" },
  { key: "pain",         label: "Pain",         color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" },
  { key: "psychiatric",  label: "Psychiatric",  color: "#6d28d9", bg: "#f5f3ff", border: "#ddd6fe" },
  { key: "other",        label: "Other",        color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" },
];

const getCat = (key) => CATEGORIES.find((c) => c.key === key);

function CategoryBadge({ category }) {
  if (!category) return <span style={{ color: "#d1d5db", fontSize: "12px" }}>—</span>;
  const cat = getCat(category);
  if (!cat) return <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#6b7280" }}>{category}</span>;
  return (
    <span style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.border}`, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap" }}>
      {cat.label}
    </span>
  );
}

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "deleted", label: "Deleted" },
];

const EMPTY_FORM = { medicine_key: "", label: "", category: "", description: "", display_order: "" };

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
          color: "#111827", ...props.style,
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
        boxShadow: focused ? "0 0 0 3px rgba(30,142,62,0.1)" : "none", color: "#111827",
      }}
    />
  );
}

function StatBox({ label, value, color, bg }) {
  return (
    <div style={{ background: bg, borderRadius: "12px", padding: "12px 18px", border: `1px solid ${color}22`, minWidth: "110px" }}>
      <p style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>{value ?? "—"}</p>
      <p style={{ margin: 0, fontSize: "11px", color: "#6b7280", fontWeight: 500, marginTop: "1px", whiteSpace: "nowrap" }}>{label}</p>
    </div>
  );
}

// ── Category select dropdown ───────────────────────────────────────────────
function CategorySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = getCat(value);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => setOpen((o) => !o)}
        style={{ height: "42px", borderRadius: "10px", border: `1.5px solid ${open ? "#1E8E3E" : "#e5e7eb"}`, padding: "0 12px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", background: "#fff", boxShadow: open ? "0 0 0 3px rgba(30,142,62,0.1)" : "none", transition: "border-color 0.2s" }}>
        {selected ? <CategoryBadge category={value} /> : <span style={{ fontSize: "13px", color: "#9ca3af" }}>Select category (optional)</span>}
        <div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
          {value && (
            <div onClick={(e) => { e.stopPropagation(); onChange(""); }}
              style={{ display: "flex", alignItems: "center", color: "#9ca3af", padding: "2px" }}>
              <LuX size={13} />
            </div>
          )}
          <LuChevronDown size={14} color="#9ca3af" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </div>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", zIndex: 1000, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: "6px", maxHeight: "260px", overflowY: "auto" }}>
          {CATEGORIES.map((cat) => (
            <div key={cat.key} onClick={() => { onChange(cat.key); setOpen(false); }}
              style={{ padding: "8px 10px", borderRadius: "8px", cursor: "pointer", background: value === cat.key ? "#f0fdf4" : "transparent", display: "flex", alignItems: "center", gap: "8px" }}
              onMouseEnter={(e) => { if (value !== cat.key) e.currentTarget.style.background = "#f9fafb"; }}
              onMouseLeave={(e) => { if (value !== cat.key) e.currentTarget.style.background = "transparent"; }}>
              <CategoryBadge category={cat.key} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Category filter dropdown ───────────────────────────────────────────────
function CategoryFilter({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = getCat(value);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)}
        style={{ height: "36px", border: `1.5px solid ${value ? "#1E8E3E" : "#e5e7eb"}`, borderRadius: "20px", padding: "0 12px", background: value ? "#f0fdf4" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: value ? "#1E8E3E" : "#6b7280", whiteSpace: "nowrap" }}>
        {selected ? <><CategoryBadge category={value} /></> : "All Categories"}
        {value
          ? <LuX size={12} onClick={(e) => { e.stopPropagation(); onChange(""); }} />
          : <LuChevronDown size={12} />}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", zIndex: 1000, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: "6px", minWidth: "160px", maxHeight: "240px", overflowY: "auto" }}>
          <div onClick={() => { onChange(""); setOpen(false); }}
            style={{ padding: "8px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "#6b7280", background: !value ? "#f0fdf4" : "transparent" }}
            onMouseEnter={(e) => { if (value) e.currentTarget.style.background = "#f9fafb"; }}
            onMouseLeave={(e) => { if (value) e.currentTarget.style.background = "transparent"; }}>
            All Categories
          </div>
          {CATEGORIES.map((cat) => (
            <div key={cat.key} onClick={() => { onChange(cat.key); setOpen(false); }}
              style={{ padding: "8px 10px", borderRadius: "8px", cursor: "pointer", background: value === cat.key ? "#f0fdf4" : "transparent" }}
              onMouseEnter={(e) => { if (value !== cat.key) e.currentTarget.style.background = "#f9fafb"; }}
              onMouseLeave={(e) => { if (value !== cat.key) e.currentTarget.style.background = "transparent"; }}>
              <CategoryBadge category={cat.key} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchMedicines(); }, []);

  const fetchMedicines = () => {
    setLoading(true);
    medicinesService.list()
      .then((res) => setMedicines(res?.data?.data || []))
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to fetch medicines."))
      .finally(() => setLoading(false));
  };

  const filtered = medicines.filter((m) => {
    const statusOk = statusFilter === "all" ? true
      : statusFilter === "deleted" ? m.is_deleted === 1
      : statusFilter === "active" ? m.is_deleted === 0 && m.is_active === 1
      : m.is_deleted === 0 && m.is_active === 0;
    const catOk = !categoryFilter || m.category === categoryFilter;
    return statusOk && catOk;
  });

  const stats = {
    total: medicines.length,
    active: medicines.filter((m) => m.is_active === 1 && m.is_deleted === 0).length,
    inactive: medicines.filter((m) => m.is_active === 0 && m.is_deleted === 0).length,
    deleted: medicines.filter((m) => m.is_deleted === 1).length,
  };

  const setField = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };

  const openEdit = (med) => {
    setEditing(med);
    setForm({
      medicine_key: med.medicine_key || "",
      label: med.label || "",
      category: med.category || "",
      description: med.description || "",
      display_order: med.display_order ?? "",
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.medicine_key.trim()) { toast.error("Medicine key is required."); return; }
    if (!form.label.trim()) { toast.error("Label is required."); return; }

    const payload = {
      medicine_key: form.medicine_key.trim().toLowerCase(),
      label: form.label.trim(),
      category: form.category || null,
      description: form.description.trim() || null,
      display_order: form.display_order === "" ? 0 : Number(form.display_order),
    };

    setSaving(true);
    const call = editing
      ? medicinesService.update(editing.id, payload)
      : medicinesService.create(payload);

    call
      .then(() => {
        toast.success(editing ? "Medicine updated!" : "Medicine created!");
        setShowForm(false);
        fetchMedicines();
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Operation failed."))
      .finally(() => setSaving(false));
  };

  const openDelete = (med) => { setDeleteTarget(med); setShowDelete(true); };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    medicinesService.remove(deleteTarget.id)
      .then(() => {
        toast.success("Medicine deleted.");
        setShowDelete(false);
        setDeleteTarget(null);
        fetchMedicines();
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to delete."))
      .finally(() => setDeleting(false));
  };

  const handleRestore = (med) => {
    medicinesService.update(med.id, { is_deleted: 0, is_active: 1 })
      .then(() => { toast.success("Medicine restored."); fetchMedicines(); })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to restore."));
  };

  const handleToggleActive = (med) => {
    const newActive = med.is_active === 1 ? 0 : 1;
    medicinesService.update(med.id, { is_active: newActive })
      .then(() => { toast.success(newActive ? "Medicine activated." : "Medicine deactivated."); fetchMedicines(); })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed."));
  };

  const isPinned = (med) => med?.medicine_key === "other_medicine";

  return (
    <div style={{ padding: "4px 0" }}>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div style={{ width: "4px", height: "28px", background: "linear-gradient(180deg, #1E8E3E, #4ade80)", borderRadius: "4px" }} />
            <h2 style={{ fontWeight: 800, margin: 0, fontSize: "20px" }}>
              <span style={{ color: "#111827" }}>MEDICINES</span>
              <span style={{ color: "#1E8E3E" }}> LIST</span>
            </h2>
          </div>
          <p style={{ color: "#999", marginBottom: 0, paddingLeft: "14px", fontSize: "13px" }}>Manage medicines used in AI diet plan generation — grouped by category.</p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <StatBox label="Total" value={stats.total} color="#6366f1" bg="#f5f3ff" />
          <StatBox label="Active" value={stats.active} color="#16a34a" bg="#f0fdf4" />
          <StatBox label="Inactive" value={stats.inactive} color="#f59e0b" bg="#fffbeb" />
        </div>
      </div>

      {/* Card */}
      <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          {/* Status chips */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {STATUS_FILTERS.map(({ key, label }) => (
              <button key={key} onClick={() => setStatusFilter(key)}
                style={{
                  padding: "7px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1.5px solid",
                  borderColor: statusFilter === key ? "#1E8E3E" : "#e5e7eb",
                  background: statusFilter === key ? "#f0fdf4" : "#fff",
                  color: statusFilter === key ? "#1E8E3E" : "#6b7280",
                  transition: "all 0.15s",
                }}>
                {label}
                {key !== "all" && (
                  <span style={{ marginLeft: "6px", background: statusFilter === key ? "#1E8E3E" : "#e5e7eb", color: statusFilter === key ? "#fff" : "#6b7280", borderRadius: "20px", padding: "1px 7px", fontSize: "10px", fontWeight: 700 }}>
                    {key === "active" ? stats.active : key === "inactive" ? stats.inactive : stats.deleted}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <CategoryFilter value={categoryFilter} onChange={setCategoryFilter} />

          <div style={{ flex: 1 }} />

          <button onClick={openCreate}
            style={{ height: "40px", border: "none", borderRadius: "10px", padding: "0 18px", background: "#1E8E3E", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "13px", color: "#fff", whiteSpace: "nowrap" }}>
            <LuPlus size={15} /> Add Medicine
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div className="spinner-border" style={{ color: "#1E8E3E", width: "2.5rem", height: "2.5rem" }} role="status" />
            <p style={{ marginTop: "16px", color: "#999", fontSize: "14px", fontWeight: 500 }}>Loading medicines...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #edf1ee" }}>
            <Table className="table mb-0" style={{ borderCollapse: "collapse", minWidth: "860px" }}>
              <thead>
                <tr>
                  {["S.No", "Label", "Medicine Key", "Category", "Description", "Order", "Status", "Actions"].map((col) => (
                    <th key={col} style={{ background: "#1E8E3E", color: "#fff", fontWeight: 600, fontSize: "13px", padding: "14px 16px", whiteSpace: "nowrap", borderBottom: "2px solid #166C31", letterSpacing: "0.3px" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={m.id}
                    style={{ borderBottom: "1px solid #edf1ee", background: i % 2 === 0 ? "#fff" : "#fafcfa", opacity: m.is_deleted ? 0.6 : 1 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9f3")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafcfa")}>

                    <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 700, color: "#1E8E3E", verticalAlign: "middle" }}>{i + 1}</td>

                    <td style={{ padding: "12px 16px", verticalAlign: "middle", maxWidth: "200px" }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.label}</p>
                    </td>

                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#6366f1", background: "#f5f3ff", padding: "3px 8px", borderRadius: "6px", border: "1px solid #e0e7ff" }}>{m.medicine_key}</span>
                    </td>

                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      <CategoryBadge category={m.category} />
                    </td>

                    <td style={{ padding: "12px 16px", verticalAlign: "middle", maxWidth: "200px" }}>
                      <p style={{ margin: 0, fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {m.description || <span style={{ color: "#d1d5db" }}>—</span>}
                      </p>
                    </td>

                    <td style={{ padding: "12px 16px", verticalAlign: "middle", textAlign: "center" }}>
                      {isPinned(m) ? (
                        <span title="Pinned at 99 — always last" style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: "20px", padding: "2px 9px", fontSize: "11px", fontWeight: 700 }}>
                          <LuPin size={10} /> 99
                        </span>
                      ) : (
                        <span style={{ fontWeight: 700, fontSize: "13px", color: "#374151" }}>{m.display_order}</span>
                      )}
                    </td>

                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      <StatusBadge is_active={m.is_active} is_deleted={m.is_deleted} />
                    </td>

                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {!m.is_deleted && (
                          <>
                            <ActionBtn title="Edit" bg="#f0f9f3" onClick={() => openEdit(m)}>
                              <LuPencil size={14} color="#1E8E3E" />
                            </ActionBtn>
                            <ActionBtn title={m.is_active ? "Deactivate" : "Activate"} bg={m.is_active ? "#fffbeb" : "#f0fdf4"} onClick={() => handleToggleActive(m)}>
                              <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: m.is_active ? "#f59e0b" : "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff" }} />
                              </span>
                            </ActionBtn>
                            <ActionBtn title="Delete" bg="#fef2f2" onClick={() => openDelete(m)}>
                              <LuTrash2 size={14} color="#ef4444" />
                            </ActionBtn>
                          </>
                        )}
                        {m.is_deleted === 1 && (
                          <ActionBtn title="Restore" bg="#f0fdf4" onClick={() => handleRestore(m)}>
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
              <LuPill size={26} color="#1E8E3E" />
            </div>
            <h5 style={{ fontWeight: 700, color: "#333", marginBottom: "8px" }}>No Medicines Found</h5>
            <p style={{ fontSize: "14px", color: "#999", marginBottom: "16px" }}>
              {statusFilter !== "all" || categoryFilter ? "No medicines match the selected filters." : "No medicines have been added yet."}
            </p>
            {statusFilter === "all" && !categoryFilter && (
              <button onClick={openCreate} style={{ padding: "10px 20px", background: "#1E8E3E", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                Add First Medicine
              </button>
            )}
          </div>
        )}

        {filtered.length > 0 && (
          <p style={{ margin: "12px 0 0", fontSize: "12px", color: "#9ca3af" }}>
            Showing <strong style={{ color: "#111827" }}>{filtered.length}</strong> of <strong style={{ color: "#111827" }}>{medicines.length}</strong> medicines
          </p>
        )}
      </div>

      {/* ══ CREATE / EDIT MODAL ══ */}
      <Modal show={showForm} onHide={() => !saving && setShowForm(false)} size="md" centered>
        <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #1E8E3E 0%, #0f5c26 100%)", color: "#fff", borderBottom: "none", padding: "1.2rem 1.6rem" }}>
          <Modal.Title style={{ fontWeight: 800, fontSize: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LuPill size={16} color="#fff" />
            </div>
            {editing ? `Edit — ${editing.label}` : "Add Medicine"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ padding: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            <div>
              <FieldLabel label="Medicine Key" required />
              <StyledInput icon={LuHash} placeholder="e.g. metformin" value={form.medicine_key}
                onChange={(e) => setField("medicine_key", e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                disabled={!!editing}
                style={{ background: editing ? "#f9fafb" : "#fff", cursor: editing ? "not-allowed" : "text" }} />
              <p style={{ margin: "4px 0 0 2px", fontSize: "11px", color: "#9ca3af" }}>
                {editing ? "Medicine key cannot be changed after creation." : "Unique internal key — auto lowercased, spaces → underscores."}
              </p>
            </div>

            <div>
              <FieldLabel label="Label" required />
              <StyledInput icon={LuAlignLeft} placeholder="e.g. Metformin (Glycomet / Glucophage)" value={form.label}
                onChange={(e) => setField("label", e.target.value)} />
            </div>

            <div>
              <FieldLabel label="Category" />
              <CategorySelect value={form.category} onChange={(v) => setField("category", v)} />
            </div>

            <div>
              <FieldLabel label="Description" />
              <StyledTextarea rows={3} placeholder="e.g. Most common Type 2 diabetes medicine — affects B12 absorption"
                value={form.description} onChange={(e) => setField("description", e.target.value)} />
            </div>

            <div>
              <FieldLabel label="Display Order" />
              {isPinned(editing) ? (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", height: "42px", borderRadius: "10px", border: "1.5px solid #e5e7eb", background: "#f9fafb", padding: "0 12px" }}>
                  <LuPin size={14} color="#0369a1" />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#0369a1" }}>99</span>
                  <span style={{ fontSize: "12px", color: "#9ca3af" }}>— pinned last, cannot be changed</span>
                </div>
              ) : (
                <StyledInput icon={LuArrowUpDown} type="number" min="0" placeholder="e.g. 1 (default: 0)"
                  value={form.display_order} onChange={(e) => setField("display_order", e.target.value)} />
              )}
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
                  : <><LuPill size={14} /> {editing ? "Update Medicine" : "Create Medicine"}</>
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
          <h5 style={{ fontWeight: 700, marginBottom: "8px" }}>Delete Medicine?</h5>
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
