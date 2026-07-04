import { useState, useEffect, useCallback } from "react";
import { useRouter } from "../../helpers/useRouter";
import { Modal, Button } from "react-bootstrap";
import {
  LuArrowLeft, LuSend, LuSave, LuChevronDown, LuChevronUp,
  LuPlus, LuTrash2, LuPencil, LuCheck, LuX, LuExternalLink,
} from "react-icons/lu";
import toast from "react-hot-toast";
import API from "../../helpers/api";
import axios from "../../helpers/api/instance";
import { useScrollRestoration } from "../../helpers/useScrollRestoration";

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS = {
  generating: { bg: "#FFF8E1", color: "#F59E0B", label: "Generating" },
  completed:  { bg: "#EFF6FF", color: "#3b82f6", label: "Pending Review" },
  failed:     { bg: "#FEF2F2", color: "#EF4444", label: "Failed" },
  sent:       { bg: "#ECFDF5", color: "#10B981", label: "Sent" },
};

const EDITABLE_FIELDS = [
  { key: "client_name",       label: "Client Name",     type: "text" },
  { key: "primary_goal",      label: "Primary Goal",    type: "text" },
  { key: "plan_duration",     label: "Plan Duration",   type: "text" },
  { key: "diet_type",         label: "Diet Type",       type: "text" },
  { key: "calorie_range",     label: "Calorie Range",   type: "text" },
  { key: "protein_target_g",  label: "Protein (g)",     type: "number" },
  { key: "carbs_target_g",    label: "Carbs (g)",       type: "number" },
  { key: "fat_target_g",      label: "Fat (g)",         type: "number" },
  { key: "hydration_guide",   label: "Hydration Guide", type: "textarea" },
];

// ── Small UI helpers ─────────────────────────────────────────────────────────

const InfoChip = ({ label, value, color = "#1E8E3E", bg = "#f0f9f3" }) => (
  <div style={{ background: bg, border: `1px solid ${color}22`, borderRadius: "10px", padding: "10px 14px" }}>
    <p style={{ margin: 0, fontSize: "10px", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
    <p style={{ margin: "2px 0 0", fontSize: "14px", fontWeight: 700, color: "#111827" }}>{value ?? "—"}</p>
  </div>
);

const SectionCard = ({ title, children, style = {} }) => (
  <div style={{ background: "#fff", borderRadius: "14px", padding: "20px 24px", marginBottom: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", ...style }}>
    <h6 style={{ fontWeight: 800, color: "#1E8E3E", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid #edf1ee", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</h6>
    {children}
  </div>
);

const humanize = (v) =>
  v ? String(v).split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "";

const toList = (v) => {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === "string" && v.trim()) return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
};

// ── Accordion ────────────────────────────────────────────────────────────────

function Accordion({ title, children, defaultOpen = false, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: "1px solid #edf1ee", borderRadius: "12px", marginBottom: "10px", overflow: "hidden" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", cursor: "pointer", background: open ? "#f8fdf9" : "#fff", userSelect: "none" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontWeight: 700, fontSize: "13px", color: "#111827" }}>{title}</span>
          {badge && <span style={{ background: "#eff6ff", color: "#3b82f6", borderRadius: "20px", padding: "2px 8px", fontSize: "11px", fontWeight: 700 }}>{badge}</span>}
        </div>
        {open ? <LuChevronUp size={16} color="#6b7280" /> : <LuChevronDown size={16} color="#6b7280" />}
      </div>
      {open && <div style={{ padding: "16px 18px", borderTop: "1px solid #edf1ee", background: "#fafcfa" }}>{children}</div>}
    </div>
  );
}

// ── Editable Meal Section ─────────────────────────────────────────────────────

const MEAL_COLORS = {
  breakfast: { label: "Breakfast", color: "#f59e0b", bg: "#fffbeb", border: "rgba(245,158,11,0.25)" },
  lunch:     { label: "Lunch",     color: "#10b981", bg: "#ecfdf5", border: "rgba(16,185,129,0.25)" },
  snack:     { label: "Snack",     color: "#8b5cf6", bg: "#f5f3ff", border: "rgba(139,92,246,0.25)" },
  dinner:    { label: "Dinner",    color: "#3b82f6", bg: "#eff6ff", border: "rgba(59,130,246,0.25)"  },
};

const LABEL_S = { display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 4, letterSpacing: "0.4px" };
const INPUT_S = { width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e5e5", fontSize: 13, color: "#111827", outline: "none", background: "#fff" };

function EditableMealSection({ mealKey, items = [], onUpdate, onAdd, onRemove }) {
  const mc = MEAL_COLORS[mealKey] || { label: mealKey, color: "#6b7280", bg: "#f9fafb", border: "#e5e5e5" };
  return (
    <div style={{ marginBottom: 14 }}>
      {/* Meal header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: "11px", fontWeight: 800, color: mc.color, textTransform: "uppercase", letterSpacing: "0.5px",
          background: mc.bg, border: `1px solid ${mc.border}`, borderRadius: "20px", padding: "2px 10px" }}>
          {mc.label}
        </span>
        <button
          onClick={onAdd}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, height: 26, padding: "0 10px", borderRadius: 6,
            border: `1px solid ${mc.border}`, background: mc.bg, color: mc.color, cursor: "pointer", fontSize: "11px", fontWeight: 700 }}>
          <LuPlus size={11} /> Add item
        </button>
      </div>

      {items.length === 0 && (
        <p style={{ fontSize: 12, color: "#9ca3af", padding: "6px 10px" }}>No items — click "Add item" to add one.</p>
      )}

      {items.map((item, idx) => (
        <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 80px 70px 28px", gap: 6, alignItems: "center",
          background: "#fff", borderRadius: 8, padding: "6px 8px", marginBottom: 4, border: "1px solid #f0f0f0" }}>
          <input
            value={item.food || ""}
            onChange={(e) => onUpdate(idx, "food", e.target.value)}
            placeholder="Food name"
            style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #e5e5e5", fontSize: 12, color: "#111827", outline: "none", width: "100%" }}
          />
          <input
            value={item.quantity || ""}
            onChange={(e) => onUpdate(idx, "quantity", e.target.value)}
            placeholder="Quantity"
            style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #e5e5e5", fontSize: 12, color: "#555", outline: "none", width: "100%" }}
          />
          <div style={{ position: "relative" }}>
            <input
              type="number"
              min="0"
              value={item.kcal ?? ""}
              onChange={(e) => onUpdate(idx, "kcal", e.target.value)}
              placeholder="kcal"
              style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #e5e5e5", fontSize: 12, color: "#1E8E3E", fontWeight: 700, outline: "none", width: "100%" }}
            />
          </div>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              min="0"
              value={item.protein_g ?? ""}
              onChange={(e) => onUpdate(idx, "protein_g", e.target.value)}
              placeholder="P (g)"
              style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #e5e5e5", fontSize: 12, color: "#3b82f6", fontWeight: 600, outline: "none", width: "100%" }}
            />
          </div>
          <button onClick={() => onRemove(idx)}
            style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "#fef2f2", color: "#ef4444",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <LuTrash2 size={12} />
          </button>
        </div>
      ))}

      {/* Column labels (shown once when there are items) */}
      {items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 80px 70px 28px", gap: 6, padding: "0 8px", marginTop: 2 }}>
          {["Food", "Quantity", "kcal", "Protein g", ""].map((h) => (
            <span key={h} style={{ fontSize: "10px", color: "#9ca3af", fontWeight: 600 }}>{h}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AIDietPlanReview() {
  const router = useRouter();
  const { id } = router.query;

  const [planData, setPlanData]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [sending, setSending]       = useState(false);

  // Editable state
  const [editedFields, setEditedFields] = useState({});
  const [editingTips, setEditingTips]   = useState(false);
  const [tips, setTips]                 = useState([]);
  const [newTip, setNewTip]             = useState("");
  const [editingTipIdx, setEditingTipIdx] = useState(null);
  const [editingTipVal, setEditingTipVal] = useState("");
  const [weeks, setWeeks]               = useState([]);
  const [recipes, setRecipes]           = useState([]);

  // Send confirmation modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendResult, setSendResult]       = useState(null);

  useScrollRestoration(!loading && !!planData);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    API.apiGet("aiDietPlans", `/${id}`)
      .then((res) => {
        const d = res?.data?.data || {};
        setPlanData(d);
        setTips(d.plan?.general_tips || []);
        setWeeks(d.plan?.weeks || []);
        setRecipes(d.plan?.featured_recipes || []);
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to load plan."))
      .finally(() => setLoading(false));
  }, [id]);

  const plan = planData?.plan || null;
  const deliveryInfo = planData?.delivery_info || null;

  // Resolved value: edited field takes priority over plan field
  const fieldVal = useCallback((key) => editedFields[key] !== undefined ? editedFields[key] : (plan?.[key] ?? ""), [editedFields, plan]);

  const weeksChanged   = plan != null && JSON.stringify(weeks)   !== JSON.stringify(plan.weeks            || []);
  const recipesChanged = plan != null && JSON.stringify(recipes) !== JSON.stringify(plan.featured_recipes || []);
  const isDirty = Object.keys(editedFields).length > 0
    || (plan && JSON.stringify(tips) !== JSON.stringify(plan.general_tips || []))
    || weeksChanged
    || recipesChanged;

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!isDirty) return;
    setSaving(true);
    const payload = { ...editedFields };
    if (JSON.stringify(tips) !== JSON.stringify(plan?.general_tips || [])) {
      payload.general_tips = tips;
    }
    if (weeksChanged) {
      payload.weeks = weeks;
    }
    if (recipesChanged) {
      payload.featured_recipes = recipes;
    }
    const tid = toast.loading("Saving changes…");
    try {
      await axios.put(`admin/diet-plans/${id}`, payload);
      // Re-fetch to sync
      const res = await API.apiGet("aiDietPlans", `/${id}`);
      const d = res?.data?.data || {};
      setPlanData(d);
      setTips(d.plan?.general_tips || []);
      setWeeks(d.plan?.weeks || []);
      setRecipes(d.plan?.featured_recipes || []);
      setEditedFields({});
      toast.success("Plan updated.", { id: tid });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed.", { id: tid });
    } finally {
      setSaving(false);
    }
  };

  // ── Send ────────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    setSending(true);
    const tid = toast.loading("Sending plan…");
    try {
      const res = await axios.post(`admin/diet-plans/${id}/send`);
      const result = res?.data?.data || {};
      setSendResult(result);
      toast.success("Plan sent successfully!", { id: tid });
      // Refresh status
      const updated = await API.apiGet("aiDietPlans", `/${id}`);
      setPlanData(updated?.data?.data || planData);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send plan.", { id: tid });
    } finally {
      setSending(false);
      setShowSendModal(false);
    }
  };

  // ── Tip editing ──────────────────────────────────────────────────────────────

  const addTip = () => {
    if (!newTip.trim()) return;
    setTips((t) => [...t, newTip.trim()]);
    setNewTip("");
  };

  const removeTip = (idx) => setTips((t) => t.filter((_, i) => i !== idx));

  const startEditTip = (idx) => { setEditingTipIdx(idx); setEditingTipVal(tips[idx]); };

  const saveTip = () => {
    if (editingTipIdx == null) return;
    setTips((t) => t.map((v, i) => (i === editingTipIdx ? editingTipVal : v)));
    setEditingTipIdx(null);
    setEditingTipVal("");
  };

  // ── Week / meal helpers ───────────────────────────────────────────────────────

  const recalcTotals = (day) => {
    const all = [...(day.breakfast || []), ...(day.lunch || []), ...(day.snack || []), ...(day.dinner || [])];
    day.total_kcal     = all.reduce((s, it) => s + (Number(it.kcal)      || 0), 0);
    day.total_protein_g = all.reduce((s, it) => s + (Number(it.protein_g) || 0), 0);
  };

  const updateMealItem = (wkIdx, dayIdx, meal, itemIdx, field, value) => {
    setWeeks((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const item = next[wkIdx].days[dayIdx][meal][itemIdx];
      item[field] = (field === "kcal" || field === "protein_g")
        ? (value === "" ? 0 : Number(value))
        : value;
      recalcTotals(next[wkIdx].days[dayIdx]);
      return next;
    });
  };

  const addMealItem = (wkIdx, dayIdx, meal) => {
    setWeeks((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[wkIdx].days[dayIdx][meal]) next[wkIdx].days[dayIdx][meal] = [];
      next[wkIdx].days[dayIdx][meal].push({ food: "", quantity: "", kcal: 0, protein_g: 0 });
      return next;
    });
  };

  const removeMealItem = (wkIdx, dayIdx, meal, itemIdx) => {
    setWeeks((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[wkIdx].days[dayIdx][meal].splice(itemIdx, 1);
      recalcTotals(next[wkIdx].days[dayIdx]);
      return next;
    });
  };

  // ── Smart swap helpers ────────────────────────────────────────────────────────

  const addSmartSwap = (wkIdx) =>
    setWeeks((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[wkIdx].smart_swaps = [...(next[wkIdx].smart_swaps || []), { instead_of: "", choose: "" }];
      return next;
    });

  const updateSmartSwap = (wkIdx, swapIdx, field, value) =>
    setWeeks((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[wkIdx].smart_swaps[swapIdx][field] = value;
      return next;
    });

  const removeSmartSwap = (wkIdx, swapIdx) =>
    setWeeks((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[wkIdx].smart_swaps.splice(swapIdx, 1);
      return next;
    });

  // ── Recipe helpers ────────────────────────────────────────────────────────────

  const updateRecipe = (ri, field, value) =>
    setRecipes((prev) => prev.map((r, i) => i === ri ? { ...r, [field]: value } : r));

  const updateRecipeMacro = (ri, macro, value) =>
    setRecipes((prev) => prev.map((r, i) =>
      i === ri ? { ...r, macros: { ...(r.macros || {}), [macro]: value === "" ? 0 : Number(value) } } : r
    ));

  const addRecipeIngredient = (ri) =>
    setRecipes((prev) => prev.map((r, i) =>
      i === ri ? { ...r, ingredients: [...(r.ingredients || []), ""] } : r
    ));

  const updateRecipeIngredient = (ri, ii, value) =>
    setRecipes((prev) => prev.map((r, i) =>
      i === ri ? { ...r, ingredients: r.ingredients.map((v, j) => j === ii ? value : v) } : r
    ));

  const removeRecipeIngredient = (ri, ii) =>
    setRecipes((prev) => prev.map((r, i) =>
      i === ri ? { ...r, ingredients: r.ingredients.filter((_, j) => j !== ii) } : r
    ));

  const addRecipeStep = (ri) =>
    setRecipes((prev) => prev.map((r, i) =>
      i === ri ? { ...r, steps: [...(r.steps || []), ""] } : r
    ));

  const updateRecipeStep = (ri, si, value) =>
    setRecipes((prev) => prev.map((r, i) =>
      i === ri ? { ...r, steps: r.steps.map((v, j) => j === si ? value : v) } : r
    ));

  const removeRecipeStep = (ri, si) =>
    setRecipes((prev) => prev.map((r, i) =>
      i === ri ? { ...r, steps: r.steps.filter((_, j) => j !== si) } : r
    ));

  const addRecipe = () =>
    setRecipes((prev) => [...prev, { name: "New Recipe", cook_time: "", servings: 1, calories: 0, macros: { carbs_g: 0, protein_g: 0, fat_g: 0, fiber_g: 0 }, ingredients: [], steps: [] }]);

  const removeRecipe = (ri) =>
    setRecipes((prev) => prev.filter((_, i) => i !== ri));

  // ── Status badge ─────────────────────────────────────────────────────────────

  const statusInfo = STATUS[plan?.status] || STATUS.completed;
  const canSend = plan?.status === "completed" || plan?.status === "sent";

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px" }}>
        <div className="spinner-border" style={{ color: "#1E8E3E", width: "2.5rem", height: "2.5rem" }} role="status" />
        <p style={{ marginTop: 16, color: "#999", fontSize: 14 }}>Loading plan…</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px", color: "#999" }}>
        <h5 style={{ fontWeight: 700, color: "#333" }}>Plan not found</h5>
        <button onClick={() => router.back()} style={{ marginTop: 16, padding: "8px 20px", borderRadius: "8px", border: "1px solid #e5e5e5", background: "#fff", cursor: "pointer", fontWeight: 600 }}>Go Back</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "4px 0" }}>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button onClick={() => router.back()}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 40, padding: "0 16px", borderRadius: 10, border: "1px solid #e5e5e5", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#444" }}>
            <LuArrowLeft size={16} /> Back
          </button>
          <div>
            <h4 className="fw700 mb-0" style={{ fontSize: "1.1rem" }}>
              <span style={{ color: "#111827" }}>PLAN</span>
              <span style={{ color: "#1E8E3E" }}> #{id}</span>
              {plan.client_name && <span style={{ color: "#999", fontWeight: 500, fontSize: 14 }}> — {plan.client_name}</span>}
            </h4>
          </div>
          <span style={{ background: statusInfo.bg, color: statusInfo.color, borderRadius: "20px", padding: "4px 14px", fontSize: "12px", fontWeight: 700 }}>
            {statusInfo.label}
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {isDirty && (
            <button onClick={handleSave} disabled={saving}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 40, padding: "0 18px", borderRadius: 10, border: "none", background: saving ? "#9cc5a9" : "#1E8E3E", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, boxShadow: "0 2px 8px rgba(30,142,62,0.25)" }}>
              <LuSave size={15} /> {saving ? "Saving…" : "Save Changes"}
            </button>
          )}
          {canSend && (
            <button onClick={() => setShowSendModal(true)} disabled={sending}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 40, padding: "0 18px", borderRadius: 10, border: "none", background: "#3b82f6", color: "#fff", cursor: sending ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, boxShadow: "0 2px 8px rgba(59,130,246,0.3)" }}>
              <LuSend size={15} /> {plan.status === "sent" ? "Re-send to User" : "Send to User"}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* ── Delivery Info ── */}
        <SectionCard title="User & Delivery">
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #1E8E3E, #4ade80)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, flexShrink: 0 }}>
              {(deliveryInfo?.full_name || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#111827" }}>{deliveryInfo?.full_name || "—"}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{deliveryInfo?.email || "—"}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{deliveryInfo?.whatsapp || "—"}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {toList(deliveryInfo?.delivery_method).map((m) => (
              <span key={m} style={{ background: "#eff6ff", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: 700 }}>{humanize(m)}</span>
            ))}
          </div>
          {plan.sent_at && (
            <p style={{ margin: "12px 0 0", fontSize: 12, color: "#10B981", fontWeight: 600 }}>
              Sent: {new Date(plan.sent_at).toLocaleString()}
            </p>
          )}
          {plan.pdf_url && (
            <a href={plan.pdf_url} target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 12, color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>
              <LuExternalLink size={13} /> View PDF
            </a>
          )}
        </SectionCard>

        {/* ── Vitals ── */}
        <SectionCard title="Vitals & Targets">
          {/* Client measurements from form */}
          {plan.form && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #edf1ee" }}>
              <InfoChip label="Age" value={plan.form.age ? `${plan.form.age} yrs` : null} color="#6366f1" bg="#f5f3ff" />
              <InfoChip label="Gender" value={humanize(plan.form.gender)} color="#6366f1" bg="#f5f3ff" />
              <InfoChip label="Date of Birth" value={plan.form.dob || plan.form.date_of_birth || null} color="#6366f1" bg="#f5f3ff" />
              <InfoChip label="Height" value={plan.form.height ? `${plan.form.height} ${plan.form.height_unit || "cm"}` : null} color="#6366f1" bg="#f5f3ff" />
              <InfoChip label="Weight" value={plan.form.weight ? `${plan.form.weight} ${plan.form.weight_unit || "kg"}` : null} color="#6366f1" bg="#f5f3ff" />
              <InfoChip label="Activity" value={humanize(plan.form.activity_level)} color="#6366f1" bg="#f5f3ff" />
              <InfoChip label="Work Type" value={humanize(plan.form.work_type)} color="#6366f1" bg="#f5f3ff" />
            </div>
          )}
          {/* Calculated vitals */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <InfoChip label="BMI" value={plan.bmi ? `${plan.bmi} — ${plan.bmi_category}` : null} />
            <InfoChip label="BMR" value={plan.bmr ? `${plan.bmr} kcal/day` : null} color="#3b82f6" bg="#eff6ff" />
            <InfoChip label="TDEE" value={plan.tdee ? `${plan.tdee} kcal/day` : null} color="#6366f1" bg="#f5f3ff" />
            <InfoChip label="Calorie Range" value={plan.calorie_range} color="#f59e0b" bg="#fffbeb" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 10 }}>
            <InfoChip label="Protein" value={plan.protein_target_g ? `${plan.protein_target_g}g` : null} />
            <InfoChip label="Carbs" value={plan.carbs_target_g ? `${plan.carbs_target_g}g` : null} color="#3b82f6" bg="#eff6ff" />
            <InfoChip label="Fat" value={plan.fat_target_g ? `${plan.fat_target_g}g` : null} color="#f59e0b" bg="#fffbeb" />
          </div>
        </SectionCard>
      </div>

      {/* ── Editable Summary ── */}
      <SectionCard title="Plan Summary (Editable)">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {EDITABLE_FIELDS.filter((f) => f.type !== "textarea").map((f) => (
            <div key={f.key}>
              <label style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", display: "block", marginBottom: 4 }}>{f.label}</label>
              <input
                type={f.type}
                value={fieldVal(f.key)}
                onChange={(e) => setEditedFields((prev) => ({ ...prev, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: `1px solid ${editedFields[f.key] !== undefined ? "#1E8E3E" : "#e5e5e5"}`, fontSize: 13, color: "#111827", outline: "none", background: editedFields[f.key] !== undefined ? "#f0f9f3" : "#fff" }}
              />
            </div>
          ))}
        </div>
        {/* Hydration guide (textarea) */}
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", display: "block", marginBottom: 4 }}>Hydration Guide</label>
          <textarea
            rows={2}
            value={fieldVal("hydration_guide")}
            onChange={(e) => setEditedFields((prev) => ({ ...prev, hydration_guide: e.target.value }))}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: `1px solid ${editedFields.hydration_guide !== undefined ? "#1E8E3E" : "#e5e5e5"}`, fontSize: 13, color: "#111827", outline: "none", background: editedFields.hydration_guide !== undefined ? "#f0f9f3" : "#fff", resize: "vertical" }}
          />
        </div>
        {Object.keys(editedFields).length > 0 && (
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>
            Unsaved changes — click "Save Changes" to apply.
          </p>
        )}
      </SectionCard>

      {/* ── General Tips (Editable) ── */}
      <SectionCard title="General Tips (Editable)">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: "#6b7280" }}>{tips.length} tip{tips.length !== 1 ? "s" : ""}</span>
          <button onClick={() => setEditingTips((v) => !v)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", borderRadius: 8, border: "1px solid #e5e5e5", background: editingTips ? "#1E8E3E" : "#fff", color: editingTips ? "#fff" : "#444", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
            <LuPencil size={13} /> {editingTips ? "Done Editing" : "Edit Tips"}
          </button>
        </div>

        {tips.length === 0 && !editingTips && (
          <p style={{ color: "#9ca3af", fontSize: 13 }}>No general tips yet.</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tips.map((tip, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#f8fdf9", borderRadius: 10, padding: "10px 14px", border: "1px solid #e8f5ec" }}>
              <span style={{ color: "#1E8E3E", fontWeight: 800, fontSize: 14, flexShrink: 0, marginTop: 1 }}>{idx + 1}.</span>
              {editingTips && editingTipIdx === idx ? (
                <>
                  <textarea
                    rows={2}
                    value={editingTipVal}
                    onChange={(e) => setEditingTipVal(e.target.value)}
                    autoFocus
                    style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid #1E8E3E", fontSize: 13, resize: "vertical", outline: "none" }}
                  />
                  <button onClick={saveTip} style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 6, border: "none", background: "#1E8E3E", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><LuCheck size={13} /></button>
                  <button onClick={() => { setEditingTipIdx(null); setEditingTipVal(""); }} style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 6, border: "1px solid #e5e5e5", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><LuX size={13} /></button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{tip}</span>
                  {editingTips && (
                    <>
                      <button onClick={() => startEditTip(idx)} style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 6, border: "1px solid #e5e5e5", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><LuPencil size={12} /></button>
                      <button onClick={() => removeTip(idx)} style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 6, border: "none", background: "#fef2f2", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><LuTrash2 size={12} /></button>
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {editingTips && (
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input
              type="text"
              value={newTip}
              onChange={(e) => setNewTip(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTip()}
              placeholder="Add a new tip and press Enter or click +"
              style={{ flex: 1, padding: "9px 14px", borderRadius: 10, border: "1px solid #e5e5e5", fontSize: 13, outline: "none" }}
            />
            <button onClick={addTip} disabled={!newTip.trim()}
              style={{ height: 40, width: 40, borderRadius: 10, border: "none", background: newTip.trim() ? "#1E8E3E" : "#d1d5db", color: "#fff", cursor: newTip.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LuPlus size={16} />
            </button>
          </div>
        )}
      </SectionCard>

      {/* ── Featured Recipes (Editable) ── */}
      <SectionCard title={`Featured Recipes (${recipes.length})`}>
        {recipesChanged && (
          <p style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600, marginBottom: 12 }}>
            Unsaved recipe changes — click "Save Changes" to apply.
          </p>
        )}
        {recipes.map((recipe, ri) => (
          <Accordion key={ri} title={recipe.name || `Recipe ${ri + 1}`} badge={`${recipe.calories || 0} kcal`} defaultOpen={false}>

            {/* Delete recipe */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
              <button onClick={() => removeRecipe(ri)}
                style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Delete Recipe
              </button>
            </div>

            {/* Name + basic info */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 12 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={LABEL_S}>Recipe Name</label>
                <input value={recipe.name || ""} onChange={(e) => updateRecipe(ri, "name", e.target.value)} style={INPUT_S} />
              </div>
              <div>
                <label style={LABEL_S}>Cook Time</label>
                <input value={recipe.cook_time || ""} onChange={(e) => updateRecipe(ri, "cook_time", e.target.value)} style={INPUT_S} placeholder="e.g. 30 mins" />
              </div>
              <div>
                <label style={LABEL_S}>Servings</label>
                <input type="number" min={1} value={recipe.servings ?? ""} onChange={(e) => updateRecipe(ri, "servings", e.target.value === "" ? "" : Number(e.target.value))} style={INPUT_S} />
              </div>
              <div>
                <label style={LABEL_S}>Calories (kcal)</label>
                <input type="number" min={0} value={recipe.calories ?? ""} onChange={(e) => updateRecipe(ri, "calories", e.target.value === "" ? 0 : Number(e.target.value))} style={INPUT_S} />
              </div>
            </div>

            {/* Macros */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Macros</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {["carbs_g", "protein_g", "fat_g", "fiber_g"].map((macro) => (
                  <div key={macro}>
                    <label style={LABEL_S}>{macro.replace("_g", "").charAt(0).toUpperCase() + macro.replace("_g", "").slice(1)} (g)</label>
                    <input type="number" min={0} value={recipe.macros?.[macro] ?? ""} onChange={(e) => updateRecipeMacro(ri, macro, e.target.value)} style={INPUT_S} />
                  </div>
                ))}
              </div>
            </div>

            {/* Ingredients */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Ingredients</p>
                <button onClick={() => addRecipeIngredient(ri)}
                  style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  + Add
                </button>
              </div>
              {(recipe.ingredients || []).map((ing, ii) => (
                <div key={ii} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <input value={ing} onChange={(e) => updateRecipeIngredient(ri, ii, e.target.value)} style={{ ...INPUT_S, flex: 1 }} placeholder={`Ingredient ${ii + 1}`} />
                  <button onClick={() => removeRecipeIngredient(ri, ii)}
                    style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 6, padding: "0 10px", fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                    ×
                  </button>
                </div>
              ))}
              {!recipe.ingredients?.length && <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>No ingredients. Click + Add to start.</p>}
            </div>

            {/* Steps */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Steps</p>
                <button onClick={() => addRecipeStep(ri)}
                  style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  + Add
                </button>
              </div>
              {(recipe.steps || []).map((step, si) => (
                <div key={si} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "flex-start" }}>
                  <span style={{ minWidth: 22, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "#eff6ff", color: "#3b82f6", borderRadius: 6, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{si + 1}</span>
                  <textarea value={step} onChange={(e) => updateRecipeStep(ri, si, e.target.value)}
                    style={{ ...INPUT_S, flex: 1, resize: "vertical", minHeight: 52, padding: "6px 10px" }} placeholder={`Step ${si + 1}`} />
                  <button onClick={() => removeRecipeStep(ri, si)}
                    style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 6, padding: "0 10px", fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0, height: 30, marginTop: 1 }}>
                    ×
                  </button>
                </div>
              ))}
              {!recipe.steps?.length && <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>No steps. Click + Add to start.</p>}
            </div>
          </Accordion>
        ))}

        <button onClick={addRecipe}
          style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          + Add Recipe
        </button>
      </SectionCard>

      {/* ── Weekly Meal Plan (Editable) ── */}
      {weeks.length > 0 && (
        <SectionCard title={`Weekly Meal Plan (${weeks.length} week${weeks.length !== 1 ? "s" : ""})`}>
          {weeksChanged && (
            <p style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600, marginBottom: 12 }}>
              Unsaved meal changes — click "Save Changes" to apply.
            </p>
          )}
          {weeks.map((week, wkIdx) => (
            <Accordion key={week.week} title={`Week ${week.week}${week.title ? ` — ${week.title}` : ""}`} badge={`${week.days?.length || 0} days`} defaultOpen={week.week === 1}>
              {week.description && <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>{week.description}</p>}
              {week.focus?.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {week.focus.map((f, i) => <span key={i} style={{ background: "#eff6ff", color: "#3b82f6", borderRadius: "20px", padding: "3px 10px", fontSize: "12px", fontWeight: 600 }}>{f}</span>)}
                </div>
              )}

              {week.days?.map((day, dayIdx) => (
                <Accordion key={day.day} title={`Day ${day.day}`} badge={day.total_kcal ? `${day.total_kcal} kcal` : null}>
                  {/* Meal timing (view only) */}
                  {day.meal_timing && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                      {Object.entries(day.meal_timing).map(([meal, time]) => (
                        <span key={meal} style={{ background: "#f8fdf9", border: "1px solid #e8f5ec", borderRadius: "8px", padding: "4px 10px", fontSize: 12, fontWeight: 600, color: "#374151" }}>
                          {humanize(meal)}: <span style={{ color: "#1E8E3E" }}>{time}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Editable meal sections */}
                  {["breakfast", "lunch", "snack", "dinner"].map((meal) => (
                    <EditableMealSection
                      key={meal}
                      mealKey={meal}
                      items={day[meal] || []}
                      onUpdate={(itemIdx, field, value) => updateMealItem(wkIdx, dayIdx, meal, itemIdx, field, value)}
                      onAdd={() => addMealItem(wkIdx, dayIdx, meal)}
                      onRemove={(itemIdx) => removeMealItem(wkIdx, dayIdx, meal, itemIdx)}
                    />
                  ))}

                  {/* Auto-calculated day totals */}
                  <div style={{ display: "flex", gap: 16, marginTop: 10, padding: "10px 14px", background: "#f0f9f3", borderRadius: 8, border: "1px solid rgba(30,142,62,0.15)" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Total kcal</p>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1E8E3E" }}>{day.total_kcal ?? 0}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Protein</p>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#3b82f6" }}>{day.total_protein_g ?? 0}g</p>
                    </div>
                    {day.total_fiber_g != null && (
                      <div>
                        <p style={{ margin: 0, fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Fiber</p>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#6b7280" }}>{day.total_fiber_g}g</p>
                      </div>
                    )}
                    {day.water_liters != null && (
                      <div>
                        <p style={{ margin: 0, fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Water</p>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#6b7280" }}>{day.water_liters}L</p>
                      </div>
                    )}
                  </div>
                </Accordion>
              ))}

              {/* Smart Swaps — editable */}
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Smart Swaps</p>
                  <button onClick={() => addSmartSwap(wkIdx)}
                    style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    + Add
                  </button>
                </div>
                {(week.smart_swaps || []).map((swap, swapIdx) => (
                  <div key={swapIdx} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <input value={swap.instead_of || ""} onChange={(e) => updateSmartSwap(wkIdx, swapIdx, "instead_of", e.target.value)}
                      style={{ ...INPUT_S, flex: 1, color: "#EF4444", textDecoration: "line-through" }} placeholder="Instead of…" />
                    <span style={{ fontSize: 14, color: "#9ca3af", flexShrink: 0 }}>→</span>
                    <input value={swap.choose || ""} onChange={(e) => updateSmartSwap(wkIdx, swapIdx, "choose", e.target.value)}
                      style={{ ...INPUT_S, flex: 1, color: "#1E8E3E", fontWeight: 600 }} placeholder="Choose…" />
                    <button onClick={() => removeSmartSwap(wkIdx, swapIdx)}
                      style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 6, padding: "0 10px", fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0, height: 34 }}>
                      ×
                    </button>
                  </div>
                ))}
                {!week.smart_swaps?.length && <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>No smart swaps. Click + Add to add one.</p>}
              </div>

              {week.weekly_notes?.length > 0 && (
                <div style={{ marginTop: 12, background: "#fffbeb", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", marginBottom: 6 }}>Weekly Notes</p>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: "#374151" }}>
                    {week.weekly_notes.map((note, i) => <li key={i}>{note}</li>)}
                  </ul>
                </div>
              )}
            </Accordion>
          ))}
        </SectionCard>
      )}

      {/* ── Form Data ── */}
      {plan.form && (
        <SectionCard title="Original Form Data">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              ["Name", plan.form.full_name],
              ["Age", plan.form.age ? `${plan.form.age} yrs` : null],
              ["Gender", humanize(plan.form.gender)],
              ["Height", plan.form.height ? `${plan.form.height} ${plan.form.height_unit}` : null],
              ["Weight", plan.form.weight ? `${plan.form.weight} ${plan.form.weight_unit}` : null],
              ["Activity", humanize(plan.form.activity_level)],
              ["Work Type", humanize(plan.form.work_type)],
              ["Workout", humanize(plan.form.workout_type)],
              ["Diet Type", humanize(plan.form.diet_type)],
              ["Digestive", humanize(plan.form.digestive_health)],
              ["Medication", plan.form.on_medication === "yes" ? plan.form.medications || "Yes" : "No"],
              ["Dislikes", plan.form.foods_dislike || "—"],
            ].map(([label, value]) => (
              <InfoChip key={label} label={label} value={value} color="#6b7280" bg="#f9fafb" />
            ))}
          </div>
          {plan.form.medical_conditions?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 6 }}>Medical Conditions</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {toList(plan.form.medical_conditions).map((c) => (
                  <span key={c} style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "20px", padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{humanize(c)}</span>
                ))}
              </div>
            </div>
          )}
          {plan.form.goals?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 6 }}>Goals</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {toList(plan.form.goals).map((g) => (
                  <span key={g} style={{ background: "#eff6ff", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "20px", padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{humanize(g)}</span>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Send Confirmation Modal ── */}
      <Modal show={showSendModal} onHide={() => !sending && setShowSendModal(false)} centered>
        <Modal.Header closeButton style={{ background: "#3b82f6", color: "#fff", borderBottom: "none", padding: "1.25rem 1.75rem" }}>
          <Modal.Title style={{ fontWeight: 700, fontSize: "1rem" }}>Send Plan to User</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "1.5rem" }}>
          {sendResult ? (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
              <h5 style={{ fontWeight: 800, color: "#10B981" }}>Plan Sent!</h5>
              {sendResult.sent_email && <p style={{ fontSize: 13, color: "#374151" }}>Email sent to <strong>{sendResult.delivery_to?.email}</strong></p>}
              {sendResult.sent_whatsapp && <p style={{ fontSize: 13, color: "#374151" }}>WhatsApp sent to <strong>{sendResult.delivery_to?.whatsapp}</strong></p>}
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 14, color: "#374151", marginBottom: 16 }}>This plan will be sent to:</p>
              {toList(deliveryInfo?.delivery_method).includes("email") && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#eff6ff", borderRadius: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>📧</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>Email</p>
                    <p style={{ margin: 0, fontWeight: 700, color: "#111827" }}>{deliveryInfo?.email || "—"}</p>
                  </div>
                </div>
              )}
              {toList(deliveryInfo?.delivery_method).includes("whatsapp") && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#f0f9f3", borderRadius: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>💬</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>WhatsApp</p>
                    <p style={{ margin: 0, fontWeight: 700, color: "#111827" }}>{deliveryInfo?.whatsapp || "—"}</p>
                  </div>
                </div>
              )}
              {plan.status === "sent" && (
                <p style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600, marginTop: 10 }}>This plan was already sent — you are re-sending it.</p>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "1px solid #edf1ee", padding: "1rem 1.5rem" }}>
          {sendResult ? (
            <Button onClick={() => { setShowSendModal(false); setSendResult(null); }} style={{ borderRadius: 8, padding: "8px 20px", fontWeight: 700, background: "#10B981", border: "none" }}>Done</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setShowSendModal(false)} disabled={sending} style={{ borderRadius: 8, padding: "8px 20px", fontWeight: 600 }}>Cancel</Button>
              <Button onClick={handleSend} disabled={sending} style={{ borderRadius: 8, padding: "8px 20px", fontWeight: 700, background: "#3b82f6", border: "none" }}>
                {sending ? "Sending…" : "Confirm Send"}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}
