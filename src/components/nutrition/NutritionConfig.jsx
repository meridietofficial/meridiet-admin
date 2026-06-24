import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axiosInstance from "../../helpers/api/instance";
import toast from "react-hot-toast";
import { MdEdit, MdDelete, MdAdd } from "react-icons/md";

const GREEN = "#1E8E3E";

const TABS = [
  { key: "bmi", label: "BMI Categories" },
  { key: "activity", label: "Activity Multipliers" },
  { key: "goals", label: "Goal Settings" },
  { key: "floors", label: "Calorie Floors" },
  { key: "medical", label: "Medical Adjustments" },
  { key: "general", label: "General Settings" },
];

// ── Shared UI atoms ──────────────────────────────────────────────────────────

const TableHeader = ({ cols }) => (
  <thead>
    <tr>
      {cols.map((col) => (
        <th
          key={col}
          style={{
            background: GREEN,
            color: "#fff",
            fontWeight: 600,
            fontSize: "12px",
            padding: "12px 14px",
            whiteSpace: "nowrap",
            letterSpacing: "0.3px",
            borderBottom: `2px solid #166C31`,
          }}
        >
          {col}
        </th>
      ))}
    </tr>
  </thead>
);

const ActiveBadge = ({ value }) => (
  <span
    style={{
      background: value ? "#dcfce7" : "#fee2e2",
      color: value ? "#16a34a" : "#ef4444",
      borderRadius: "20px",
      padding: "3px 10px",
      fontSize: "11px",
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
    }}
  >
    <span
      style={{
        width: "5px",
        height: "5px",
        borderRadius: "50%",
        background: value ? "#16a34a" : "#ef4444",
      }}
    />
    {value ? "Active" : "Inactive"}
  </span>
);

const ActionBtn = ({ icon: Icon, color, bg, onClick, title }) => (
  <div
    title={title}
    onClick={onClick}
    style={{
      width: "32px",
      height: "32px",
      borderRadius: "8px",
      background: bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      transition: "all 0.2s",
      flexShrink: 0,
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
  >
    <Icon style={{ color, fontSize: "16px" }} />
  </div>
);

const LoadingState = () => (
  <div style={{ textAlign: "center", padding: "60px 20px" }}>
    <div
      className="spinner-border"
      style={{ color: GREEN, width: "2.5rem", height: "2.5rem" }}
      role="status"
    />
    <p style={{ marginTop: "16px", color: "#999", fontSize: "14px", fontWeight: 500 }}>
      Loading...
    </p>
  </div>
);

const EmptyState = ({ label }) => (
  <div
    style={{
      textAlign: "center",
      padding: "60px 20px",
      borderRadius: "12px",
      border: "1px solid #edf1ee",
    }}
  >
    <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
    <h5 style={{ fontWeight: 700, color: "#333", marginBottom: "8px" }}>No Data Found</h5>
    <p style={{ fontSize: "14px", color: "#999" }}>{label}</p>
  </div>
);

const TableWrap = ({ children }) => (
  <div
    style={{
      borderRadius: "12px",
      border: "1px solid #edf1ee",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      overflow: "hidden",
    }}
  >
    <table style={{ width: "100%", borderCollapse: "collapse" }}>{children}</table>
  </div>
);

const Td = ({ children, style }) => (
  <td
    style={{
      padding: "10px 14px",
      fontSize: "13px",
      color: "#374151",
      verticalAlign: "middle",
      borderBottom: "1px solid #edf1ee",
      ...style,
    }}
  >
    {children}
  </td>
);

const SectionHeader = ({ title, onAdd, addLabel }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px",
    }}
  >
    <div>
      <h6 style={{ fontWeight: 700, color: "#111827", margin: 0 }}>{title}</h6>
    </div>
    {onAdd && (
      <button
        onClick={onAdd}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: GREEN,
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "8px 16px",
          fontWeight: 600,
          fontSize: "13px",
          cursor: "pointer",
        }}
      >
        <MdAdd size={16} /> {addLabel}
      </button>
    )}
  </div>
);

const ModalHeader = ({ title }) => (
  <Modal.Header
    closeButton
    style={{ background: GREEN, color: "#fff", borderBottom: "none", padding: "1.1rem 1.5rem" }}
  >
    <Modal.Title style={{ fontWeight: 700, fontSize: "1rem" }}>{title}</Modal.Title>
  </Modal.Header>
);

const DeleteConfirmModal = ({ show, onHide, name, onConfirm, deleting }) => (
  <Modal show={show} onHide={onHide} size="sm" centered>
    <Modal.Body style={{ padding: "32px 24px", textAlign: "center" }}>
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "#fef2f2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
        }}
      >
        <MdDelete style={{ color: "#ef4444", fontSize: "28px" }} />
      </div>
      <h5 style={{ fontWeight: 700, marginBottom: "8px" }}>Delete?</h5>
      <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>
        Delete <strong>{name}</strong>? This cannot be undone.
      </p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <Button variant="outline-secondary" onClick={onHide} disabled={deleting}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={deleting}
          style={{ background: "#ef4444", border: "none", fontWeight: 600 }}
        >
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </Modal.Body>
  </Modal>
);

// ── BMI Categories ────────────────────────────────────────────────────────────

function BmiCategories() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    min_bmi: "",
    max_bmi: "",
    category_name: "",
    display_order: "",
    is_active: true,
  });
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    axiosInstance
      .get("admin/nutrition/bmi-categories")
      .then((res) => setData(res.data?.data || []))
      .catch(() => toast.error("Failed to load BMI categories."))
      .finally(() => setLoading(false));
  };

  const handleSave = () => {
    setSaving(true);
    const { id, min_bmi, max_bmi, category_name, display_order, is_active } = editItem;
    axiosInstance
      .put(`admin/nutrition/bmi-categories/${id}`, {
        min_bmi: parseFloat(min_bmi),
        max_bmi: parseFloat(max_bmi),
        category_name,
        display_order: parseInt(display_order),
        is_active,
      })
      .then(() => {
        toast.success("BMI category updated.");
        setEditItem(null);
        fetchData();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Update failed."))
      .finally(() => setSaving(false));
  };

  const handleAdd = () => {
    setAdding(true);
    axiosInstance
      .post("admin/nutrition/bmi-categories", {
        ...addForm,
        min_bmi: parseFloat(addForm.min_bmi),
        max_bmi: parseFloat(addForm.max_bmi),
        display_order: parseInt(addForm.display_order),
      })
      .then(() => {
        toast.success("BMI category added.");
        setShowAdd(false);
        setAddForm({ min_bmi: "", max_bmi: "", category_name: "", display_order: "", is_active: true });
        fetchData();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Add failed."))
      .finally(() => setAdding(false));
  };

  const handleDelete = () => {
    setDeleting(true);
    axiosInstance
      .delete(`admin/nutrition/bmi-categories/${deleteTarget.id}`)
      .then(() => {
        toast.success("BMI category deleted.");
        setDeleteTarget(null);
        fetchData();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Delete failed."))
      .finally(() => setDeleting(false));
  };

  const BmiForm = ({ values, onChange }) => (
    <Form>
      <Form.Group className="mb-3">
        <Form.Label style={{ fontWeight: 600, fontSize: "13px" }}>Category Name</Form.Label>
        <Form.Control
          value={values.category_name}
          onChange={(e) => onChange({ ...values, category_name: e.target.value })}
          placeholder="e.g. Obese"
        />
      </Form.Group>
      <div className="row">
        <div className="col-6">
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: 600, fontSize: "13px" }}>Min BMI</Form.Label>
            <Form.Control
              type="number"
              step="0.1"
              value={values.min_bmi}
              onChange={(e) => onChange({ ...values, min_bmi: e.target.value })}
            />
          </Form.Group>
        </div>
        <div className="col-6">
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: 600, fontSize: "13px" }}>Max BMI</Form.Label>
            <Form.Control
              type="number"
              step="0.1"
              value={values.max_bmi}
              onChange={(e) => onChange({ ...values, max_bmi: e.target.value })}
            />
          </Form.Group>
        </div>
      </div>
      <Form.Group className="mb-3">
        <Form.Label style={{ fontWeight: 600, fontSize: "13px" }}>Display Order</Form.Label>
        <Form.Control
          type="number"
          value={values.display_order}
          onChange={(e) => onChange({ ...values, display_order: e.target.value })}
        />
      </Form.Group>
      <Form.Check
        type="switch"
        label="Active"
        checked={!!values.is_active}
        onChange={(e) => onChange({ ...values, is_active: e.target.checked })}
      />
    </Form>
  );

  return (
    <div>
      <SectionHeader title="BMI Categories" onAdd={() => setShowAdd(true)} addLabel="Add Category" />

      {loading ? (
        <LoadingState />
      ) : data.length === 0 ? (
        <EmptyState label="No BMI categories found." />
      ) : (
        <TableWrap>
          <TableHeader cols={["#", "Category Name", "Min BMI", "Max BMI", "Order", "Active", "Actions"]} />
          <tbody>
            {data.map((item, i) => (
              <tr key={item.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafcfa" }}>
                <Td style={{ fontWeight: 700, color: GREEN }}>#{item.id}</Td>
                <Td style={{ fontWeight: 600 }}>{item.category_name}</Td>
                <Td>{item.min_bmi ?? "—"}</Td>
                <Td>{item.max_bmi ?? "—"}</Td>
                <Td>{item.display_order}</Td>
                <Td>
                  <ActiveBadge value={item.is_active} />
                </Td>
                <Td>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <ActionBtn
                      icon={MdEdit}
                      color="#3b82f6"
                      bg="#EFF6FF"
                      title="Edit"
                      onClick={() => setEditItem({ ...item })}
                    />
                    <ActionBtn
                      icon={MdDelete}
                      color="#ef4444"
                      bg="#fef2f2"
                      title="Delete"
                      onClick={() => setDeleteTarget(item)}
                    />
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Modal show={!!editItem} onHide={() => setEditItem(null)} centered>
        <ModalHeader title="Edit BMI Category" />
        <Modal.Body>{editItem && <BmiForm values={editItem} onChange={setEditItem} />}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditItem(null)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            style={{ background: GREEN, border: "none", fontWeight: 700 }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showAdd} onHide={() => setShowAdd(false)} centered>
        <ModalHeader title="Add BMI Category" />
        <Modal.Body>
          <BmiForm values={addForm} onChange={setAddForm} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAdd(false)} disabled={adding}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={adding}
            style={{ background: GREEN, border: "none", fontWeight: 700 }}
          >
            {adding ? "Adding..." : "Add Category"}
          </Button>
        </Modal.Footer>
      </Modal>

      <DeleteConfirmModal
        show={!!deleteTarget}
        onHide={() => setDeleteTarget(null)}
        name={deleteTarget?.category_name}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}

// ── Activity Multipliers ──────────────────────────────────────────────────────

function ActivityMultipliers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    axiosInstance
      .get("admin/nutrition/activity-multipliers")
      .then((res) => setData(res.data?.data || []))
      .catch(() => toast.error("Failed to load activity multipliers."))
      .finally(() => setLoading(false));
  };

  const handleSave = () => {
    setSaving(true);
    const { id, multiplier, label, description, is_active } = editItem;
    axiosInstance
      .put(`admin/nutrition/activity-multipliers/${id}`, {
        multiplier: parseFloat(multiplier),
        label,
        description,
        is_active,
      })
      .then(() => {
        toast.success("Activity multiplier updated.");
        setEditItem(null);
        fetchData();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Update failed."))
      .finally(() => setSaving(false));
  };

  return (
    <div>
      <SectionHeader title="Activity Multipliers" />

      {loading ? (
        <LoadingState />
      ) : data.length === 0 ? (
        <EmptyState label="No activity multipliers found." />
      ) : (
        <TableWrap>
          <TableHeader cols={["#", "Label", "Multiplier", "Description", "Active", "Actions"]} />
          <tbody>
            {data.map((item, i) => (
              <tr key={item.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafcfa" }}>
                <Td style={{ fontWeight: 700, color: GREEN }}>#{item.id}</Td>
                <Td style={{ fontWeight: 600 }}>{item.label}</Td>
                <Td>
                  <span
                    style={{
                      background: "#f0f9f3",
                      color: GREEN,
                      borderRadius: "6px",
                      padding: "2px 8px",
                      fontWeight: 700,
                      fontSize: "12px",
                    }}
                  >
                    ×{item.multiplier}
                  </span>
                </Td>
                <Td style={{ color: "#6b7280", maxWidth: "280px" }}>{item.description || "—"}</Td>
                <Td>
                  <ActiveBadge value={item.is_active} />
                </Td>
                <Td>
                  <ActionBtn
                    icon={MdEdit}
                    color="#3b82f6"
                    bg="#EFF6FF"
                    title="Edit"
                    onClick={() => setEditItem({ ...item })}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Modal show={!!editItem} onHide={() => setEditItem(null)} centered>
        <ModalHeader title="Edit Activity Multiplier" />
        <Modal.Body>
          {editItem && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: 600, fontSize: "13px" }}>Label</Form.Label>
                <Form.Control
                  value={editItem.label}
                  onChange={(e) => setEditItem({ ...editItem, label: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: 600, fontSize: "13px" }}>Multiplier</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={editItem.multiplier}
                  onChange={(e) => setEditItem({ ...editItem, multiplier: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: 600, fontSize: "13px" }}>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={editItem.description || ""}
                  onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                />
              </Form.Group>
              <Form.Check
                type="switch"
                label="Active"
                checked={!!editItem.is_active}
                onChange={(e) => setEditItem({ ...editItem, is_active: e.target.checked })}
              />
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditItem(null)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            style={{ background: GREEN, border: "none", fontWeight: 700 }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

// ── Goal Settings ─────────────────────────────────────────────────────────────

function GoalSettings() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    axiosInstance
      .get("admin/nutrition/goal-settings")
      .then((res) => setData(res.data?.data || []))
      .catch(() => toast.error("Failed to load goal settings."))
      .finally(() => setLoading(false));
  };

  const handleSave = () => {
    setSaving(true);
    const {
      id,
      calorie_min_offset,
      calorie_max_offset,
      protein_per_kg,
      label,
      description,
      is_active,
    } = editItem;
    axiosInstance
      .put(`admin/nutrition/goal-settings/${id}`, {
        calorie_min_offset: parseInt(calorie_min_offset),
        calorie_max_offset: parseInt(calorie_max_offset),
        protein_per_kg: parseFloat(protein_per_kg),
        label,
        description,
        is_active,
      })
      .then(() => {
        toast.success("Goal setting updated.");
        setEditItem(null);
        fetchData();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Update failed."))
      .finally(() => setSaving(false));
  };

  return (
    <div>
      <SectionHeader title="Goal Settings" />

      {loading ? (
        <LoadingState />
      ) : data.length === 0 ? (
        <EmptyState label="No goal settings found." />
      ) : (
        <TableWrap>
          <TableHeader
            cols={["#", "Label", "Cal Min Offset", "Cal Max Offset", "Protein/kg", "Active", "Actions"]}
          />
          <tbody>
            {data.map((item, i) => (
              <tr key={item.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafcfa" }}>
                <Td style={{ fontWeight: 700, color: GREEN }}>#{item.id}</Td>
                <Td style={{ fontWeight: 600 }}>{item.label}</Td>
                <Td>{item.calorie_min_offset ?? "—"}</Td>
                <Td>{item.calorie_max_offset ?? "—"}</Td>
                <Td>{item.protein_per_kg ?? "—"}</Td>
                <Td>
                  <ActiveBadge value={item.is_active} />
                </Td>
                <Td>
                  <ActionBtn
                    icon={MdEdit}
                    color="#3b82f6"
                    bg="#EFF6FF"
                    title="Edit"
                    onClick={() => setEditItem({ ...item })}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Modal show={!!editItem} onHide={() => setEditItem(null)} centered>
        <ModalHeader title="Edit Goal Setting" />
        <Modal.Body>
          {editItem && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: 600, fontSize: "13px" }}>Label</Form.Label>
                <Form.Control
                  value={editItem.label}
                  onChange={(e) => setEditItem({ ...editItem, label: e.target.value })}
                />
              </Form.Group>
              <div className="row">
                <div className="col-6">
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: 600, fontSize: "13px" }}>
                      Calorie Min Offset
                    </Form.Label>
                    <Form.Control
                      type="number"
                      value={editItem.calorie_min_offset}
                      onChange={(e) =>
                        setEditItem({ ...editItem, calorie_min_offset: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
                <div className="col-6">
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: 600, fontSize: "13px" }}>
                      Calorie Max Offset
                    </Form.Label>
                    <Form.Control
                      type="number"
                      value={editItem.calorie_max_offset}
                      onChange={(e) =>
                        setEditItem({ ...editItem, calorie_max_offset: e.target.value })
                      }
                    />
                  </Form.Group>
                </div>
              </div>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: 600, fontSize: "13px" }}>
                  Protein per kg (g)
                </Form.Label>
                <Form.Control
                  type="number"
                  step="0.1"
                  value={editItem.protein_per_kg}
                  onChange={(e) => setEditItem({ ...editItem, protein_per_kg: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: 600, fontSize: "13px" }}>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={editItem.description || ""}
                  onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                />
              </Form.Group>
              <Form.Check
                type="switch"
                label="Active"
                checked={!!editItem.is_active}
                onChange={(e) => setEditItem({ ...editItem, is_active: e.target.checked })}
              />
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditItem(null)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            style={{ background: GREEN, border: "none", fontWeight: 700 }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

// ── Calorie Floors ────────────────────────────────────────────────────────────

function CalorieFloors() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    axiosInstance
      .get("admin/nutrition/calorie-floors")
      .then((res) => setData(res.data?.data || []))
      .catch(() => toast.error("Failed to load calorie floors."))
      .finally(() => setLoading(false));
  };

  const handleSave = () => {
    const cal = parseInt(editItem.min_calories);
    if (cal < 800 || cal > 3000) {
      toast.error("Min calories must be between 800 and 3000.");
      return;
    }
    setSaving(true);
    axiosInstance
      .put(`admin/nutrition/calorie-floors/${editItem.id}`, {
        min_calories: cal,
        description: editItem.description,
      })
      .then(() => {
        toast.success("Calorie floor updated.");
        setEditItem(null);
        fetchData();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Update failed."))
      .finally(() => setSaving(false));
  };

  return (
    <div>
      <SectionHeader title="Calorie Floors" />

      {loading ? (
        <LoadingState />
      ) : data.length === 0 ? (
        <EmptyState label="No calorie floors found." />
      ) : (
        <TableWrap>
          <TableHeader cols={["#", "Description", "Min Calories", "Actions"]} />
          <tbody>
            {data.map((item, i) => (
              <tr key={item.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafcfa" }}>
                <Td style={{ fontWeight: 700, color: GREEN }}>#{item.id}</Td>
                <Td style={{ fontWeight: 600 }}>{item.description || item.gender || "—"}</Td>
                <Td>
                  <span
                    style={{
                      background: "#fff7ed",
                      color: "#ea580c",
                      borderRadius: "6px",
                      padding: "2px 10px",
                      fontWeight: 700,
                      fontSize: "13px",
                    }}
                  >
                    {item.min_calories} kcal
                  </span>
                </Td>
                <Td>
                  <ActionBtn
                    icon={MdEdit}
                    color="#3b82f6"
                    bg="#EFF6FF"
                    title="Edit"
                    onClick={() => setEditItem({ ...item })}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Modal show={!!editItem} onHide={() => setEditItem(null)} centered>
        <ModalHeader title="Edit Calorie Floor" />
        <Modal.Body>
          {editItem && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: 600, fontSize: "13px" }}>
                  Min Calories (800 – 3000)
                </Form.Label>
                <Form.Control
                  type="number"
                  min={800}
                  max={3000}
                  value={editItem.min_calories}
                  onChange={(e) => setEditItem({ ...editItem, min_calories: e.target.value })}
                />
                <Form.Text className="text-muted">Must be between 800 and 3000 kcal.</Form.Text>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: 600, fontSize: "13px" }}>Description</Form.Label>
                <Form.Control
                  value={editItem.description || ""}
                  onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditItem(null)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            style={{ background: GREEN, border: "none", fontWeight: 700 }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

// ── Medical Adjustments ───────────────────────────────────────────────────────

const BLANK_MEDICAL = {
  condition_label: "",
  detection_keywords: "",
  priority: "",
  fat_percent: "",
  protein_per_kg_override: "",
  carb_max_percent: "",
  prompt_note: "",
  is_active: true,
};

function MedicalAdjustments() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(BLANK_MEDICAL);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    axiosInstance
      .get("admin/nutrition/medical-adjustments")
      .then((res) => setData(res.data?.data || []))
      .catch(() => toast.error("Failed to load medical adjustments."))
      .finally(() => setLoading(false));
  };

  const toKeywordsString = (val) => {
    if (Array.isArray(val)) return val.join(", ");
    return val || "";
  };

  const toKeywordsArray = (str) =>
    str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const buildPayload = (form) => ({
    condition_label: form.condition_label,
    detection_keywords: toKeywordsArray(form.detection_keywords),
    priority: parseInt(form.priority) || 0,
    fat_percent: parseFloat(form.fat_percent) || null,
    protein_per_kg_override: parseFloat(form.protein_per_kg_override) || null,
    carb_max_percent: parseFloat(form.carb_max_percent) || null,
    prompt_note: form.prompt_note,
    is_active: form.is_active,
  });

  const handleSave = () => {
    setSaving(true);
    axiosInstance
      .put(`admin/nutrition/medical-adjustments/${editItem.id}`, buildPayload(editItem))
      .then(() => {
        toast.success("Medical adjustment updated.");
        setEditItem(null);
        fetchData();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Update failed."))
      .finally(() => setSaving(false));
  };

  const handleAdd = () => {
    setAdding(true);
    axiosInstance
      .post("admin/nutrition/medical-adjustments", buildPayload(addForm))
      .then(() => {
        toast.success("Medical adjustment added.");
        setShowAdd(false);
        setAddForm(BLANK_MEDICAL);
        fetchData();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Add failed."))
      .finally(() => setAdding(false));
  };

  const handleDelete = () => {
    setDeleting(true);
    axiosInstance
      .delete(`admin/nutrition/medical-adjustments/${deleteTarget.id}`)
      .then(() => {
        toast.success("Medical adjustment deleted.");
        setDeleteTarget(null);
        fetchData();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Delete failed."))
      .finally(() => setDeleting(false));
  };

  const MedicalForm = ({ values, onChange }) => (
    <Form>
      <Form.Group className="mb-3">
        <Form.Label style={{ fontWeight: 600, fontSize: "13px" }}>Condition Label</Form.Label>
        <Form.Control
          value={values.condition_label}
          onChange={(e) => onChange({ ...values, condition_label: e.target.value })}
          placeholder="e.g. Diabetes"
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label style={{ fontWeight: 600, fontSize: "13px" }}>
          Detection Keywords{" "}
          <small style={{ color: "#aaa", fontWeight: 400 }}>(comma-separated)</small>
        </Form.Label>
        <Form.Control
          value={toKeywordsString(values.detection_keywords)}
          onChange={(e) => onChange({ ...values, detection_keywords: e.target.value })}
          placeholder="e.g. diabetes, diabetic, sugar"
        />
      </Form.Group>
      <div className="row">
        <div className="col-4">
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: 600, fontSize: "13px" }}>Priority</Form.Label>
            <Form.Control
              type="number"
              value={values.priority}
              onChange={(e) => onChange({ ...values, priority: e.target.value })}
            />
          </Form.Group>
        </div>
        <div className="col-4">
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: 600, fontSize: "13px" }}>Fat %</Form.Label>
            <Form.Control
              type="number"
              step="0.1"
              value={values.fat_percent}
              onChange={(e) => onChange({ ...values, fat_percent: e.target.value })}
            />
          </Form.Group>
        </div>
        <div className="col-4">
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: 600, fontSize: "13px" }}>Carb Max %</Form.Label>
            <Form.Control
              type="number"
              step="0.1"
              value={values.carb_max_percent}
              onChange={(e) => onChange({ ...values, carb_max_percent: e.target.value })}
            />
          </Form.Group>
        </div>
      </div>
      <Form.Group className="mb-3">
        <Form.Label style={{ fontWeight: 600, fontSize: "13px" }}>Protein Override (per kg)</Form.Label>
        <Form.Control
          type="number"
          step="0.1"
          value={values.protein_per_kg_override}
          onChange={(e) => onChange({ ...values, protein_per_kg_override: e.target.value })}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label style={{ fontWeight: 600, fontSize: "13px" }}>Prompt Note (AI)</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={values.prompt_note || ""}
          onChange={(e) => onChange({ ...values, prompt_note: e.target.value })}
          placeholder="Instructions for the AI diet planner..."
        />
      </Form.Group>
      <Form.Check
        type="switch"
        label="Active"
        checked={!!values.is_active}
        onChange={(e) => onChange({ ...values, is_active: e.target.checked })}
      />
    </Form>
  );

  return (
    <div>
      <SectionHeader
        title="Medical Adjustments"
        onAdd={() => setShowAdd(true)}
        addLabel="Add Condition"
      />

      {loading ? (
        <LoadingState />
      ) : data.length === 0 ? (
        <EmptyState label="No medical adjustments found." />
      ) : (
        <TableWrap>
          <TableHeader
            cols={["#", "Condition", "Priority", "Fat %", "Protein Override", "Carb Max %", "Active", "Actions"]}
          />
          <tbody>
            {data.map((item, i) => (
              <tr key={item.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafcfa" }}>
                <Td style={{ fontWeight: 700, color: GREEN }}>#{item.id}</Td>
                <Td style={{ fontWeight: 600 }}>{item.condition_label}</Td>
                <Td>{item.priority ?? "—"}</Td>
                <Td>{item.fat_percent != null ? `${item.fat_percent}%` : "—"}</Td>
                <Td>
                  {item.protein_per_kg_override != null ? `${item.protein_per_kg_override} g/kg` : "—"}
                </Td>
                <Td>{item.carb_max_percent != null ? `${item.carb_max_percent}%` : "—"}</Td>
                <Td>
                  <ActiveBadge value={item.is_active} />
                </Td>
                <Td>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <ActionBtn
                      icon={MdEdit}
                      color="#3b82f6"
                      bg="#EFF6FF"
                      title="Edit"
                      onClick={() =>
                        setEditItem({
                          ...item,
                          detection_keywords: toKeywordsString(item.detection_keywords),
                        })
                      }
                    />
                    <ActionBtn
                      icon={MdDelete}
                      color="#ef4444"
                      bg="#fef2f2"
                      title="Delete"
                      onClick={() => setDeleteTarget(item)}
                    />
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Modal show={!!editItem} onHide={() => setEditItem(null)} centered size="lg">
        <ModalHeader title="Edit Medical Adjustment" />
        <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {editItem && <MedicalForm values={editItem} onChange={setEditItem} />}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditItem(null)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            style={{ background: GREEN, border: "none", fontWeight: 700 }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showAdd} onHide={() => setShowAdd(false)} centered size="lg">
        <ModalHeader title="Add Medical Adjustment" />
        <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
          <MedicalForm values={addForm} onChange={setAddForm} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAdd(false)} disabled={adding}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={adding}
            style={{ background: GREEN, border: "none", fontWeight: 700 }}
          >
            {adding ? "Adding..." : "Add Condition"}
          </Button>
        </Modal.Footer>
      </Modal>

      <DeleteConfirmModal
        show={!!deleteTarget}
        onHide={() => setDeleteTarget(null)}
        name={deleteTarget?.condition_label}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}

// ── General Settings ──────────────────────────────────────────────────────────

function GeneralSettings() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    axiosInstance
      .get("admin/nutrition/general-settings")
      .then((res) => {
        const raw = res.data?.data;
        // Handle both flat array and grouped object formats
        if (Array.isArray(raw)) {
          setData(raw);
        } else if (raw && typeof raw === "object") {
          const flat = Object.entries(raw).flatMap(([category, items]) =>
            Array.isArray(items) ? items.map((it) => ({ ...it, category })) : []
          );
          setData(flat);
        } else {
          setData([]);
        }
      })
      .catch(() => toast.error("Failed to load general settings."))
      .finally(() => setLoading(false));
  };

  const handleSave = () => {
    setSaving(true);
    axiosInstance
      .put(`admin/nutrition/general-settings/${editItem.id}`, { value: editItem.value })
      .then(() => {
        toast.success("Setting updated.");
        setEditItem(null);
        fetchData();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Update failed."))
      .finally(() => setSaving(false));
  };

  return (
    <div>
      <SectionHeader title="General Settings" />

      {loading ? (
        <LoadingState />
      ) : data.length === 0 ? (
        <EmptyState label="No general settings found." />
      ) : (
        <TableWrap>
          <TableHeader cols={["#", "Key", "Category", "Value", "Data Type", "Actions"]} />
          <tbody>
            {data.map((item, i) => (
              <tr key={item.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafcfa" }}>
                <Td style={{ fontWeight: 700, color: GREEN }}>#{item.id}</Td>
                <Td style={{ fontWeight: 600, fontFamily: "monospace", fontSize: "12px" }}>
                  {item.key || item.setting_key || "—"}
                </Td>
                <Td>
                  {item.category ? (
                    <span
                      style={{
                        background: "#f0f9f3",
                        color: GREEN,
                        borderRadius: "20px",
                        padding: "2px 10px",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      {item.category}
                    </span>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td style={{ fontWeight: 600 }}>{item.value ?? "—"}</Td>
                <Td>
                  <span
                    style={{
                      background: "#f8fafc",
                      color: "#64748b",
                      borderRadius: "6px",
                      padding: "2px 8px",
                      fontSize: "11px",
                      fontWeight: 600,
                      fontFamily: "monospace",
                    }}
                  >
                    {item.data_type || "—"}
                  </span>
                </Td>
                <Td>
                  <ActionBtn
                    icon={MdEdit}
                    color="#3b82f6"
                    bg="#EFF6FF"
                    title="Edit"
                    onClick={() => setEditItem({ ...item })}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Modal show={!!editItem} onHide={() => setEditItem(null)} centered>
        <ModalHeader title="Edit Setting" />
        <Modal.Body>
          {editItem && (
            <Form>
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  marginBottom: "16px",
                }}
              >
                <small style={{ color: "#aaa", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                  Key
                </small>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontWeight: 700,
                    fontSize: "13px",
                    fontFamily: "monospace",
                    color: "#111827",
                  }}
                >
                  {editItem.key || editItem.setting_key}
                </p>
                {editItem.data_type && (
                  <>
                    <small
                      style={{
                        color: "#aaa",
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        display: "block",
                        marginTop: "8px",
                      }}
                    >
                      Data Type
                    </small>
                    <p style={{ margin: "2px 0 0", fontFamily: "monospace", fontSize: "13px", color: "#64748b" }}>
                      {editItem.data_type}
                    </p>
                  </>
                )}
              </div>
              <Form.Group>
                <Form.Label style={{ fontWeight: 600, fontSize: "13px" }}>Value</Form.Label>
                <Form.Control
                  type={editItem.data_type === "int" || editItem.data_type === "float" ? "number" : "text"}
                  step={editItem.data_type === "float" ? "0.01" : "1"}
                  value={editItem.value}
                  onChange={(e) => setEditItem({ ...editItem, value: e.target.value })}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditItem(null)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            style={{ background: GREEN, border: "none", fontWeight: 700 }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

// ── Root NutritionConfig component ───────────────────────────────────────────

export default function NutritionConfig() {
  const [activeTab, setActiveTab] = useState("bmi");

  const SECTION_MAP = {
    bmi: <BmiCategories />,
    activity: <ActivityMultipliers />,
    goals: <GoalSettings />,
    floors: <CalorieFloors />,
    medical: <MedicalAdjustments />,
    general: <GeneralSettings />,
  };

  return (
    <div style={{ padding: "0" }}>
      {/* Page title */}
      <div style={{ marginBottom: "24px" }}>
        <h4 style={{ fontWeight: 800, color: "#111827", margin: 0 }}>Nutrition Config</h4>
        <p style={{ color: "#6b7280", fontSize: "14px", margin: "4px 0 0" }}>
          Manage BMI categories, activity multipliers, goal settings, calorie floors, medical
          adjustments, and general settings.
        </p>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          borderBottom: "2px solid #edf1ee",
          marginBottom: "24px",
          overflowX: "auto",
          paddingBottom: "0",
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: "none",
                border: "none",
                borderBottom: isActive ? `2px solid ${GREEN}` : "2px solid transparent",
                marginBottom: "-2px",
                padding: "10px 16px",
                fontWeight: isActive ? 700 : 500,
                fontSize: "13px",
                color: isActive ? GREEN : "#6b7280",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "color 0.15s",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
      >
        {SECTION_MAP[activeTab]}
      </div>
    </div>
  );
}
