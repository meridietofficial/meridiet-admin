import { useState, useEffect, useRef } from "react";
import { Table, Modal, Button } from "react-bootstrap";
import { FaSearch, FaTimes, FaFilter, FaEye, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { LuChevronDown, LuX, LuBriefcase, LuUsers, LuToggleLeft, LuToggleRight, LuMapPin, LuClock } from "react-icons/lu";
import GlobalPagination from "../common/GlobalPagination";
import * as careerService from "../../services/careerService";
import toast from "react-hot-toast";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const JOB_TYPES = [
  { value: "full_time",  label: "Full Time" },
  { value: "part_time",  label: "Part Time" },
  { value: "contract",   label: "Contract" },
  { value: "internship", label: "Internship" },
];

const APP_STATUSES = [
  { value: "new",         label: "New",         color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  { value: "reviewing",   label: "Reviewing",   color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  { value: "shortlisted", label: "Shortlisted", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { value: "rejected",    label: "Rejected",    color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  { value: "hired",       label: "Hired",       color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
];

const JOB_TYPE_COLORS = {
  full_time:  { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  part_time:  { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  contract:   { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  internship: { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
};

// ── Small reusable components ─────────────────────────────────────────────────
function TH({ children }) {
  return <th style={{ background: "#1E8E3E", color: "#fff", fontWeight: 600, fontSize: "13px", padding: "14px 16px", whiteSpace: "nowrap", borderBottom: "2px solid #166C31", letterSpacing: "0.3px" }}>{children}</th>;
}
function TD({ children, style }) {
  return <td style={{ padding: "12px 16px", verticalAlign: "middle", ...style }}>{children}</td>;
}
function TR({ children, index }) {
  return (
    <tr
      style={{ borderBottom: "1px solid #edf1ee", background: index % 2 === 0 ? "#fff" : "#fafcfa", transition: "background 0.2s" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9f3")}
      onMouseLeave={(e) => (e.currentTarget.style.background = index % 2 === 0 ? "#fff" : "#fafcfa")}
    >
      {children}
    </tr>
  );
}

function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div style={{ position: "relative", minWidth: "220px", flex: "1 1 220px", maxWidth: "340px" }}>
      <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "12px" }} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ height: "40px", width: "100%", border: "1px solid #e5e5e5", borderRadius: "10px", padding: "0 36px 0 34px", fontSize: "13px", outline: "none", color: "#111827" }} />
      {value && <FaTimes onClick={() => onChange("")} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "12px", cursor: "pointer" }} />}
    </div>
  );
}

function FilterDropdown({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const selected = options.find((o) => o.value === value);
  const accent = "#1E8E3E";
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((p) => !p)}
        style={{ height: "40px", border: `1px solid ${value ? accent : "#e5e5e5"}`, borderRadius: "10px", padding: "0 12px", background: value ? `${accent}12` : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", minWidth: "140px", fontWeight: 600, fontSize: "12.5px", color: value ? accent : "#6b7280", whiteSpace: "nowrap" }}>
        <FaFilter style={{ fontSize: "11px", color: value ? accent : "#aaa" }} />
        {selected?.label || placeholder}
        {value
          ? <LuX style={{ marginLeft: "auto", fontSize: "13px" }} onClick={(e) => { e.stopPropagation(); onChange(""); }} />
          : <LuChevronDown style={{ marginLeft: "auto", fontSize: "12px", color: "#aaa" }} />}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#fff", border: "1px solid #edf1ee", borderRadius: "12px", minWidth: "170px", zIndex: 1000, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: "6px" }}>
          {options.map((o) => (
            <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
              style={{ padding: "8px 14px", cursor: "pointer", borderRadius: "8px", fontSize: "13px", fontWeight: value === o.value ? 700 : 500, color: value === o.value ? accent : "#444", background: value === o.value ? `${accent}10` : "transparent" }}>
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Badge({ label, bg, color, border }) {
  return (
    <span style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, textTransform: "capitalize" }}>
      {label}
    </span>
  );
}

function JobTypeBadge({ type }) {
  const s = JOB_TYPE_COLORS[type] || { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };
  const label = JOB_TYPES.find((t) => t.value === type)?.label || type;
  return <Badge label={label} {...s} />;
}

function AppStatusBadge({ status }) {
  const s = APP_STATUSES.find((a) => a.value === status) || { label: status, color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" };
  return <Badge label={s.label} bg={s.bg} color={s.color} border={s.border} />;
}

function ActionBtn({ onClick, title, bg, children }) {
  return (
    <div onClick={onClick} title={title}
      style={{ width: "32px", height: "32px", borderRadius: "8px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform 0.2s" }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
      {children}
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div className="spinner-border" style={{ color: "#1E8E3E", width: "2.5rem", height: "2.5rem" }} role="status" />
      <p style={{ marginTop: "16px", color: "#999", fontSize: "14px", fontWeight: 500 }}>Loading...</p>
    </div>
  );
}

function EmptyState({ icon, title, msg }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", borderRadius: "12px", border: "1px solid #edf1ee" }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>{icon}</div>
      <h5 style={{ fontWeight: 700, color: "#333", marginBottom: "8px" }}>{title}</h5>
      <p style={{ fontSize: "14px", color: "#999" }}>{msg}</p>
    </div>
  );
}

function FormInput({ label, required, children }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>
        {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "10px 14px",
  fontSize: "13px", outline: "none", color: "#111827",
};

// ── Array field (responsibilities / requirements) ──────────────────────────────
function ArrayField({ label, items, onChange, placeholder }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (!v) return;
    onChange([...items, v]);
    setInput("");
  };
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <FormInput label={label} required>
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          style={{ ...inputStyle, flex: 1 }} />
        <button type="button" onClick={add}
          style={{ height: "40px", padding: "0 14px", background: "#1E8E3E", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "12.5px", cursor: "pointer" }}>
          Add
        </button>
      </div>
      {items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f9fafb", borderRadius: "8px", padding: "8px 12px", border: "1px solid #e5e7eb" }}>
              <span style={{ flex: 1, fontSize: "13px", color: "#374151" }}>{item}</span>
              <FaTimes onClick={() => remove(i)} style={{ color: "#ef4444", cursor: "pointer", fontSize: "11px", flexShrink: 0 }} />
            </div>
          ))}
        </div>
      )}
    </FormInput>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  JOB FORM MODAL
// ═════════════════════════════════════════════════════════════════════════════
const EMPTY_FORM = {
  title: "", department: "", location: "", job_type: "full_time",
  experience_required: "", description: "", responsibilities: [],
  requirements: [], salary_range: "", is_active: 1, deadline: "",
};

function JobFormModal({ show, onHide, editJob, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!show) return;
    if (editJob) {
      setForm({
        title: editJob.title || "",
        department: editJob.department || "",
        location: editJob.location || "",
        job_type: editJob.job_type || "full_time",
        experience_required: editJob.experience_required || "",
        description: editJob.description || "",
        responsibilities: editJob.responsibilities || [],
        requirements: editJob.requirements || [],
        salary_range: editJob.salary_range || "",
        is_active: editJob.is_active ?? 1,
        deadline: editJob.deadline ? editJob.deadline.split("T")[0] : "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [show, editJob]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = ["title", "department", "location", "job_type", "experience_required", "description"];
    for (const k of required) {
      if (!form[k]?.trim()) return toast.error(`${k.replace(/_/g, " ")} is required`);
    }
    if (!form.responsibilities.length) return toast.error("Add at least one responsibility");
    if (!form.requirements.length) return toast.error("Add at least one requirement");

    setSaving(true);
    const body = {
      ...form,
      deadline: form.deadline || null,
    };
    try {
      if (editJob) {
        await careerService.updateJob(editJob.id, body);
        toast.success("Job updated");
      } else {
        await careerService.createJob(body);
        toast.success("Job created");
      }
      onSaved();
      onHide();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save job");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #1E8E3E 0%, #0f5c26 100%)", color: "#fff", borderBottom: "none", padding: "1.2rem 1.8rem" }}>
        <Modal.Title style={{ fontWeight: 800, fontSize: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LuBriefcase size={18} color="#fff" />
          </div>
          {editJob ? "Edit Job Posting" : "Create Job Posting"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: "#f8fafc", padding: "24px" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <FormInput label="Job Title" required>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Senior Dietitian" style={inputStyle} />
            </FormInput>
            <FormInput label="Department" required>
              <input value={form.department} onChange={(e) => set("department", e.target.value)} placeholder="e.g. Clinical" style={inputStyle} />
            </FormInput>
            <FormInput label="Location" required>
              <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Remote" style={inputStyle} />
            </FormInput>
            <FormInput label="Job Type" required>
              <select value={form.job_type} onChange={(e) => set("job_type", e.target.value)} style={inputStyle}>
                {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FormInput>
            <FormInput label="Experience Required" required>
              <input value={form.experience_required} onChange={(e) => set("experience_required", e.target.value)} placeholder="e.g. 2-5 years" style={inputStyle} />
            </FormInput>
            <FormInput label="Salary Range">
              <input value={form.salary_range} onChange={(e) => set("salary_range", e.target.value)} placeholder="e.g. 5-8 LPA" style={inputStyle} />
            </FormInput>
            <FormInput label="Deadline">
              <input type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} style={inputStyle} />
            </FormInput>
            <FormInput label="Status">
              <select value={form.is_active} onChange={(e) => set("is_active", Number(e.target.value))} style={inputStyle}>
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </FormInput>
          </div>

          <FormInput label="Description" required>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Job description..." rows={4}
              style={{ ...inputStyle, resize: "vertical" }} />
          </FormInput>

          <ArrayField label="Responsibilities" items={form.responsibilities}
            onChange={(v) => set("responsibilities", v)} placeholder="Add a responsibility and press Enter" />
          <ArrayField label="Requirements" items={form.requirements}
            onChange={(v) => set("requirements", v)} placeholder="Add a requirement and press Enter" />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
            <Button variant="light" onClick={onHide} style={{ fontWeight: 600, borderRadius: "10px" }}>Cancel</Button>
            <Button type="submit" disabled={saving}
              style={{ background: "#1E8E3E", border: "none", borderRadius: "10px", fontWeight: 700, padding: "8px 24px" }}>
              {saving ? "Saving..." : editJob ? "Update Job" : "Create Job"}
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  JOB DETAIL MODAL (view only)
// ═════════════════════════════════════════════════════════════════════════════
function JobDetailModal({ show, onHide, job }) {
  if (!job) return null;
  const jt = JOB_TYPE_COLORS[job.job_type] || { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };
  const jtLabel = JOB_TYPES.find((t) => t.value === job.job_type)?.label || job.job_type;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #1E8E3E 0%, #0f5c26 100%)", color: "#fff", borderBottom: "none", padding: "1.2rem 1.8rem" }}>
        <Modal.Title style={{ fontWeight: 800, fontSize: "1rem" }}>
          {job.title}
          <span style={{ marginLeft: "10px", background: "rgba(255,255,255,0.18)", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px" }}>#{job.id}</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: "24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
          <Badge label={jtLabel} {...jt} />
          <Badge label={job.department} bg="#f0f9ff" color="#0369a1" border="#bae6fd" />
          <Badge label={job.location} bg="#fafaf9" color="#57534e" border="#d6d3d1" />
          {job.experience_required && <Badge label={job.experience_required} bg="#fff7ed" color="#c2410c" border="#fed7aa" />}
          {job.salary_range && <Badge label={job.salary_range} bg="#f0fdf4" color="#16a34a" border="#bbf7d0" />}
          <Badge
            label={job.is_active ? "Active" : "Inactive"}
            bg={job.is_active ? "#f0fdf4" : "#fef2f2"}
            color={job.is_active ? "#16a34a" : "#ef4444"}
            border={job.is_active ? "#bbf7d0" : "#fecaca"}
          />
          {job.deadline && <Badge label={`Deadline: ${fmtDate(job.deadline)}`} bg="#f5f3ff" color="#7c3aed" border="#ddd6fe" />}
        </div>

        <h6 style={{ fontWeight: 800, color: "#374151", marginBottom: "8px" }}>Description</h6>
        <p style={{ fontSize: "13.5px", color: "#374151", lineHeight: 1.7, marginBottom: "20px" }}>{job.description}</p>

        <h6 style={{ fontWeight: 800, color: "#374151", marginBottom: "8px" }}>Responsibilities</h6>
        <ul style={{ paddingLeft: "20px", marginBottom: "20px" }}>
          {(job.responsibilities || []).map((r, i) => <li key={i} style={{ fontSize: "13.5px", color: "#374151", lineHeight: 1.8 }}>{r}</li>)}
        </ul>

        <h6 style={{ fontWeight: 800, color: "#374151", marginBottom: "8px" }}>Requirements</h6>
        <ul style={{ paddingLeft: "20px", marginBottom: "8px" }}>
          {(job.requirements || []).map((r, i) => <li key={i} style={{ fontSize: "13.5px", color: "#374151", lineHeight: 1.8 }}>{r}</li>)}
        </ul>

        <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
          <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px", flex: "1 1 140px" }}>
            <small style={{ color: "#aaa", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>Applications</small>
            <p style={{ margin: "2px 0 0", fontWeight: 700, fontSize: "18px", color: "#1E8E3E" }}>{job.application_count ?? 0}</p>
          </div>
          <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px", flex: "1 1 140px" }}>
            <small style={{ color: "#aaa", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>Posted On</small>
            <p style={{ margin: "2px 0 0", fontWeight: 600, fontSize: "13px", color: "#374151" }}>{fmtDate(job.created_at)}</p>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  APPLICATION DETAIL MODAL
// ═════════════════════════════════════════════════════════════════════════════
function AppDetailModal({ show, onHide, app, onStatusUpdated }) {
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (app) {
      setStatus(app.status || "new");
      setNotes(app.admin_notes || "");
    }
  }, [app]);

  if (!app) return null;

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const body = { status };
      if (notes.trim()) body.admin_notes = notes.trim();
      await careerService.updateApplicationStatus(app.id, body);
      toast.success("Status updated");
      onStatusUpdated();
      onHide();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  const InfoRow = ({ label, value, mono }) => (
    <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px" }}>
      <small style={{ color: "#aaa", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block" }}>{label}</small>
      <p style={{ margin: "2px 0 0", fontWeight: 600, color: "#111827", fontSize: "13px", fontFamily: mono ? "monospace" : "inherit" }}>
        {value ?? <span style={{ color: "#9ca3af" }}>—</span>}
      </p>
    </div>
  );

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #1E8E3E 0%, #0f5c26 100%)", color: "#fff", borderBottom: "none", padding: "1.2rem 1.8rem" }}>
        <Modal.Title style={{ fontWeight: 800, fontSize: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LuUsers size={18} color="#fff" />
          </div>
          {app.full_name}
          <span style={{ background: "rgba(255,255,255,0.18)", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px" }}>#{app.id}</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: "#f8fafc", padding: "24px" }}>
        <div style={{ background: "#fff", borderRadius: "14px", padding: "16px", marginBottom: "16px", border: "1px solid #edf1ee" }}>
          <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>Applied for</p>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#111827" }}>{app.job_title}</p>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6b7280" }}>{app.job_department}{app.job_location ? ` · ${app.job_location}` : ""}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
          <InfoRow label="Full Name" value={app.full_name} />
          <InfoRow label="Email" value={app.email} />
          <InfoRow label="Phone" value={app.phone} />
          <InfoRow label="Current Location" value={app.current_location} />
          <InfoRow label="Total Experience" value={app.total_experience} />
          <InfoRow label="Current Company" value={app.current_company} />
          <InfoRow label="Current CTC" value={app.current_ctc} />
          <InfoRow label="Expected CTC" value={app.expected_ctc} />
          <InfoRow label="Notice Period" value={app.notice_period} />
          <InfoRow label="Applied On" value={fmtDate(app.created_at)} />
        </div>

        {app.cover_letter && (
          <div style={{ marginBottom: "16px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: "6px" }}>Cover Letter</p>
            <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "14px", fontSize: "13.5px", color: "#374151", lineHeight: 1.7 }}>{app.cover_letter}</div>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
          {app.resume_url && (
            <a href={app.resume_url} target="_blank" rel="noopener noreferrer"
              style={{ padding: "8px 16px", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "10px", fontWeight: 700, fontSize: "12.5px", textDecoration: "none" }}>
              View Resume
            </a>
          )}
          {app.linkedin_url && (
            <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer"
              style={{ padding: "8px 16px", background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: "10px", fontWeight: 700, fontSize: "12.5px", textDecoration: "none" }}>
              LinkedIn Profile
            </a>
          )}
        </div>

        <div style={{ background: "#fff", borderRadius: "14px", padding: "16px", border: "1px solid #edf1ee" }}>
          <p style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: "#374151" }}>Update Status</p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
            {APP_STATUSES.map((s) => (
              <button key={s.value} onClick={() => setStatus(s.value)}
                style={{ padding: "6px 14px", borderRadius: "20px", cursor: "pointer", fontWeight: 700, fontSize: "12.5px", border: `1.5px solid ${status === s.value ? s.color : "#e5e7eb"}`, background: status === s.value ? `${s.bg}` : "#fff", color: status === s.value ? s.color : "#6b7280", transition: "all 0.15s" }}>
                {s.label}
              </button>
            ))}
          </div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Admin notes (optional)..." rows={3}
            style={{ ...inputStyle, resize: "vertical", marginBottom: "12px" }} />
          <Button onClick={handleUpdate} disabled={saving}
            style={{ background: "#1E8E3E", border: "none", borderRadius: "10px", fontWeight: 700, padding: "8px 22px" }}>
            {saving ? "Saving..." : "Update Status"}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  DELETE CONFIRM MODAL
// ═════════════════════════════════════════════════════════════════════════════
function DeleteModal({ show, onHide, onConfirm, loading, title }) {
  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Body style={{ padding: "28px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>🗑️</div>
        <h5 style={{ fontWeight: 800, color: "#111827", marginBottom: "8px" }}>Delete Job?</h5>
        <p style={{ fontSize: "13.5px", color: "#6b7280", marginBottom: "20px" }}>
          "{title}" and all its applications will be permanently deleted.
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <Button variant="light" onClick={onHide} style={{ borderRadius: "10px", fontWeight: 600 }}>Cancel</Button>
          <Button onClick={onConfirm} disabled={loading}
            style={{ background: "#ef4444", border: "none", borderRadius: "10px", fontWeight: 700 }}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  JOBS TAB
// ═════════════════════════════════════════════════════════════════════════════
function JobsTab() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const searchTimer = useRef(null);
  const LIMIT = 20;

  const [showForm, setShowForm] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailJob, setDetailJob] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(null);

  const fetchJobs = () => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit: LIMIT });
    if (search) p.append("search", search);
    if (activeFilter !== "") p.append("is_active", activeFilter);
    careerService.listJobs(p.toString())
      .then((res) => {
        const d = res?.data || {};
        setJobs(d.data || []);
        setTotal(d.meta?.total || 0);
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to load jobs"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJobs(); }, [page, search, activeFilter]);

  const handleSearch = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1); }, 500);
  };

  const openDetail = (id) => {
    setDetailJob(null);
    setShowDetail(true);
    setLoadingDetail(true);
    careerService.getJob(id)
      .then((res) => setDetailJob(res?.data?.data || null))
      .catch(() => { toast.error("Failed to load job"); setShowDetail(false); })
      .finally(() => setLoadingDetail(false));
  };

  const handleToggle = (job) => {
    setToggling(job.id);
    careerService.toggleJob(job.id)
      .then((res) => {
        const newActive = res?.data?.data?.is_active;
        toast.success(newActive ? "Job activated" : "Job deactivated");
        fetchJobs();
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to toggle job"))
      .finally(() => setToggling(null));
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    careerService.deleteJob(deleteTarget.id)
      .then(() => { toast.success("Job deleted"); setShowDelete(false); fetchJobs(); })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to delete"))
      .finally(() => setDeleting(false));
  };

  const totalPages = Math.ceil(total / LIMIT);

  const activeOpts = [
    { value: "", label: "All Status" },
    { value: "1", label: "Active" },
    { value: "0", label: "Inactive" },
  ];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <SearchBar value={searchInput} onChange={handleSearch} placeholder="Search jobs..." />
          <FilterDropdown value={activeFilter} onChange={(v) => { setActiveFilter(v); setPage(1); }} options={activeOpts} placeholder="All Status" />
          {(search || activeFilter !== "") && (
            <button onClick={() => { setSearch(""); setSearchInput(""); setActiveFilter(""); setPage(1); }}
              style={{ height: "40px", border: "1px solid #fecaca", borderRadius: "10px", padding: "0 14px", background: "#fef2f2", cursor: "pointer", color: "#ef4444", fontWeight: 600, fontSize: "12.5px", display: "flex", alignItems: "center", gap: "6px" }}>
              <LuX size={13} /> Clear
            </button>
          )}
        </div>
        <button onClick={() => { setEditJob(null); setShowForm(true); }}
          style={{ height: "40px", background: "#1E8E3E", color: "#fff", border: "none", borderRadius: "10px", padding: "0 18px", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px" }}>
          <FaPlus size={11} /> Post Job
        </button>
      </div>

      {loading ? <LoadingState /> : jobs.length === 0 ? (
        <EmptyState icon="💼" title="No Jobs Found" msg="Post your first job opening to get started." />
      ) : (
        <>
          <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #edf1ee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <Table className="table mb-0" style={{ borderCollapse: "collapse", minWidth: "900px" }}>
              <thead>
                <tr>{["S.No", "Title", "Department", "Location", "Type", "Experience", "Deadline", "Apps", "Status", "Actions"].map((c) => <TH key={c}>{c}</TH>)}</tr>
              </thead>
              <tbody>
                {jobs.map((job, i) => (
                  <TR key={job.id} index={i}>
                    <TD style={{ fontWeight: 700, color: "#1E8E3E", fontSize: "13px" }}>{(page - 1) * LIMIT + i + 1}</TD>
                    <TD>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#111827" }}>{job.title}</p>
                      {job.salary_range && <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{job.salary_range}</p>}
                    </TD>
                    <TD style={{ fontSize: "13px", color: "#374151", fontWeight: 600 }}>{job.department}</TD>
                    <TD>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12.5px", color: "#374151" }}>
                        <LuMapPin size={12} color="#9ca3af" /> {job.location}
                      </div>
                    </TD>
                    <TD><JobTypeBadge type={job.job_type} /></TD>
                    <TD>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12.5px", color: "#374151" }}>
                        <LuClock size={12} color="#9ca3af" /> {job.experience_required}
                      </div>
                    </TD>
                    <TD style={{ fontSize: "12px", color: job.deadline ? "#374151" : "#9ca3af" }}>
                      {job.deadline ? fmtDate(job.deadline) : "No deadline"}
                    </TD>
                    <TD>
                      <span style={{ fontWeight: 800, fontSize: "14px", color: "#1E8E3E" }}>{job.application_count ?? 0}</span>
                    </TD>
                    <TD>
                      <Badge
                        label={job.is_active ? "Active" : "Inactive"}
                        bg={job.is_active ? "#f0fdf4" : "#fef2f2"}
                        color={job.is_active ? "#16a34a" : "#ef4444"}
                        border={job.is_active ? "#bbf7d0" : "#fecaca"}
                      />
                    </TD>
                    <TD>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <ActionBtn onClick={() => openDetail(job.id)} title="View" bg="#eff6ff">
                          <FaEye style={{ color: "#3b82f6", fontSize: "13px" }} />
                        </ActionBtn>
                        <ActionBtn onClick={() => { setEditJob(job); setShowForm(true); }} title="Edit" bg="#fffbeb">
                          <FaEdit style={{ color: "#d97706", fontSize: "12px" }} />
                        </ActionBtn>
                        <ActionBtn onClick={() => handleToggle(job)} title={job.is_active ? "Deactivate" : "Activate"} bg={job.is_active ? "#fef2f2" : "#f0fdf4"}>
                          {toggling === job.id
                            ? <div className="spinner-border" style={{ width: "14px", height: "14px", borderWidth: "2px", color: "#6b7280" }} role="status" />
                            : job.is_active
                              ? <LuToggleRight style={{ color: "#16a34a", fontSize: "16px" }} />
                              : <LuToggleLeft style={{ color: "#9ca3af", fontSize: "16px" }} />
                          }
                        </ActionBtn>
                        <ActionBtn onClick={() => { setDeleteTarget(job); setShowDelete(true); }} title="Delete" bg="#fef2f2">
                          <FaTrash style={{ color: "#ef4444", fontSize: "11px" }} />
                        </ActionBtn>
                      </div>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px", fontSize: "13px", color: "#888", marginTop: "4px" }}>
            <span>Showing <strong style={{ color: "#111827" }}>{jobs.length}</strong> of <strong style={{ color: "#111827" }}>{total}</strong></span>
            <span style={{ background: "#f0f9f3", padding: "4px 14px", borderRadius: "20px", fontWeight: 500, color: "#1E8E3E" }}>Page {page} of {totalPages || 1}</span>
          </div>
          {totalPages > 1 && <GlobalPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
        </>
      )}

      <JobFormModal show={showForm} onHide={() => setShowForm(false)} editJob={editJob} onSaved={fetchJobs} />

      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="lg" centered scrollable>
        {loadingDetail ? (
          <Modal.Body style={{ padding: "60px", textAlign: "center" }}>
            <div className="spinner-border" style={{ color: "#1E8E3E" }} role="status" />
          </Modal.Body>
        ) : (
          <JobDetailModal show={showDetail} onHide={() => setShowDetail(false)} job={detailJob} />
        )}
      </Modal>

      <DeleteModal show={showDelete} onHide={() => setShowDelete(false)} onConfirm={handleDelete}
        loading={deleting} title={deleteTarget?.title} />
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  APPLICATIONS TAB
// ═════════════════════════════════════════════════════════════════════════════
function ApplicationsTab({ jobs }) {
  const [apps, setApps] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const searchTimer = useRef(null);
  const LIMIT = 20;

  const [showDetail, setShowDetail] = useState(false);
  const [detailApp, setDetailApp] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchApps = () => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit: LIMIT });
    if (search) p.append("search", search);
    if (statusFilter) p.append("status", statusFilter);
    if (jobFilter) p.append("job_id", jobFilter);
    careerService.listApplications(p.toString())
      .then((res) => {
        const d = res?.data || {};
        setApps(d.data || []);
        setTotal(d.meta?.total || 0);
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to load applications"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchApps(); }, [page, search, statusFilter, jobFilter]);

  const handleSearch = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1); }, 500);
  };

  const openDetail = (id) => {
    setDetailApp(null);
    setShowDetail(true);
    setLoadingDetail(true);
    careerService.getApplication(id)
      .then((res) => setDetailApp(res?.data?.data || null))
      .catch(() => { toast.error("Failed to load application"); setShowDetail(false); })
      .finally(() => setLoadingDetail(false));
  };

  const totalPages = Math.ceil(total / LIMIT);
  const hasFilters = search || statusFilter || jobFilter;

  const statusOpts = [{ value: "", label: "All Status" }, ...APP_STATUSES.map((s) => ({ value: s.value, label: s.label }))];
  const jobOpts = [{ value: "", label: "All Jobs" }, ...jobs.map((j) => ({ value: String(j.id), label: j.title }))];

  return (
    <>
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <SearchBar value={searchInput} onChange={handleSearch} placeholder="Search name, email, phone..." />
        <FilterDropdown value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={statusOpts} placeholder="All Status" />
        <FilterDropdown value={jobFilter} onChange={(v) => { setJobFilter(v); setPage(1); }} options={jobOpts} placeholder="All Jobs" />
        {hasFilters && (
          <button onClick={() => { setSearch(""); setSearchInput(""); setStatusFilter(""); setJobFilter(""); setPage(1); }}
            style={{ height: "40px", border: "1px solid #fecaca", borderRadius: "10px", padding: "0 14px", background: "#fef2f2", cursor: "pointer", color: "#ef4444", fontWeight: 600, fontSize: "12.5px", display: "flex", alignItems: "center", gap: "6px" }}>
            <LuX size={13} /> Clear
          </button>
        )}
      </div>

      {loading ? <LoadingState /> : apps.length === 0 ? (
        <EmptyState icon="📋" title="No Applications Found" msg={hasFilters ? "Try adjusting your filters." : "Applications will appear here when candidates apply."} />
      ) : (
        <>
          <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #edf1ee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <Table className="table mb-0" style={{ borderCollapse: "collapse", minWidth: "1000px" }}>
              <thead>
                <tr>{["S.No", "Candidate", "Job", "Experience", "CTC", "Notice", "Status", "Applied On", "Action"].map((c) => <TH key={c}>{c}</TH>)}</tr>
              </thead>
              <tbody>
                {apps.map((app, i) => (
                  <TR key={app.id} index={i}>
                    <TD style={{ fontWeight: 700, color: "#1E8E3E", fontSize: "13px" }}>{(page - 1) * LIMIT + i + 1}</TD>
                    <TD>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#111827" }}>{app.full_name}</p>
                      <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{app.email}</p>
                      <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{app.phone}</p>
                    </TD>
                    <TD>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "12.5px", color: "#111827" }}>{app.job_title}</p>
                      <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{app.job_department}</p>
                    </TD>
                    <TD style={{ fontSize: "12.5px", color: "#374151", fontWeight: 600 }}>{app.total_experience || "—"}</TD>
                    <TD>
                      <p style={{ margin: 0, fontSize: "12px", color: "#374151" }}>Current: {app.current_ctc || "—"}</p>
                      <p style={{ margin: 0, fontSize: "12px", color: "#374151" }}>Expected: {app.expected_ctc || "—"}</p>
                    </TD>
                    <TD style={{ fontSize: "12.5px", color: "#374151" }}>{app.notice_period || "—"}</TD>
                    <TD><AppStatusBadge status={app.status} /></TD>
                    <TD style={{ fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap" }}>{fmtDate(app.created_at)}</TD>
                    <TD>
                      <ActionBtn onClick={() => openDetail(app.id)} title="View Application" bg="#eff6ff">
                        <FaEye style={{ color: "#3b82f6", fontSize: "13px" }} />
                      </ActionBtn>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px", fontSize: "13px", color: "#888", marginTop: "4px" }}>
            <span>Showing <strong style={{ color: "#111827" }}>{apps.length}</strong> of <strong style={{ color: "#111827" }}>{total}</strong></span>
            <span style={{ background: "#f0f9f3", padding: "4px 14px", borderRadius: "20px", fontWeight: 500, color: "#1E8E3E" }}>Page {page} of {totalPages || 1}</span>
          </div>
          {totalPages > 1 && <GlobalPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
        </>
      )}

      <Modal show={showDetail && !loadingDetail} onHide={() => setShowDetail(false)} size="lg" centered scrollable>
        <AppDetailModal show={showDetail && !loadingDetail} onHide={() => setShowDetail(false)} app={detailApp} onStatusUpdated={fetchApps} />
      </Modal>

      {showDetail && loadingDetail && (
        <Modal show onHide={() => setShowDetail(false)} centered>
          <Modal.Body style={{ padding: "60px", textAlign: "center" }}>
            <div className="spinner-border" style={{ color: "#1E8E3E" }} role="status" />
          </Modal.Body>
        </Modal>
      )}
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  ROOT COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const TABS = [
  { value: "jobs",         label: "Job Postings",  icon: LuBriefcase },
  { value: "applications", label: "Applications",  icon: LuUsers },
];

export default function CareerManagement() {
  const [tab, setTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    careerService.listJobs("limit=200")
      .then((res) => setJobs(res?.data?.data || []))
      .catch(() => {});
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h4 style={{ fontWeight: 800, color: "#111827", margin: 0 }}>Career Management</h4>
        <p style={{ margin: "4px 0 0", color: "#9ca3af", fontSize: "13.5px" }}>Manage job postings and review candidate applications</p>
      </div>

      <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", borderBottom: "2px solid #f0f0f0", marginBottom: "24px", gap: "2px" }}>
          {TABS.map((t) => {
            const active = tab === t.value;
            const Icon = t.icon;
            return (
              <button key={t.value} onClick={() => setTab(t.value)}
                style={{ padding: "10px 24px", border: "none", background: "none", cursor: "pointer", fontWeight: active ? 700 : 500, fontSize: "13.5px", color: active ? "#1E8E3E" : "#6b7280", borderBottom: `2.5px solid ${active ? "#1E8E3E" : "transparent"}`, marginBottom: "-2px", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "7px" }}>
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "jobs" && <JobsTab />}
        {tab === "applications" && <ApplicationsTab jobs={jobs} />}
      </div>
    </div>
  );
}
