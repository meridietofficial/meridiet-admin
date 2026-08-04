import { useState, useEffect, useRef, useCallback } from "react";
import { Table, Modal, Button } from "react-bootstrap";
import toast from "react-hot-toast";
import {
  LuMail, LuUsers, LuSend, LuSearch, LuX, LuCheckCircle, LuXCircle,
  LuHistory, LuEye, LuAlertTriangle, LuMails, LuStethoscope, LuClock,
} from "react-icons/lu";
import { MdCheckCircle } from "react-icons/md";
import GlobalPagination from "../common/GlobalPagination";
import { fetchRecipients, sendBroadcast, fetchHistory, fetchBroadcastDetail } from "../../services/broadcastService";

// ─── Design system helpers (mirrors CouponTable patterns) ──────────────────────

function Section({ title, icon, children }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
        <span style={{ fontSize: "16px" }}>{icon}</span>
        <span style={{ fontWeight: 800, fontSize: "12px", color: "#374151", textTransform: "uppercase", letterSpacing: "0.8px" }}>{title}</span>
        <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, #e5e7eb, transparent)", marginLeft: "4px" }} />
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ label, required, hint }) {
  return (
    <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>
      {label}{required && <span style={{ color: "#ef4444", marginLeft: "3px" }}>*</span>}
      {hint && <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0, color: "#9ca3af", marginLeft: "6px" }}>({hint})</span>}
    </label>
  );
}

function StyledInput({ icon, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      {icon && (
        <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: focused ? "#1E8E3E" : "#9ca3af", pointerEvents: "none", transition: "color 0.2s", display: "flex" }}>
          {icon}
        </div>
      )}
      <input
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={{
          height: "42px", borderRadius: "10px", width: "100%", fontSize: "13px",
          padding: icon ? "0 12px 0 36px" : "0 12px",
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
        boxShadow: focused ? "0 0 0 3px rgba(30,142,62,0.1)" : "none",
        color: "#111827", lineHeight: 1.7, ...props.style,
      }}
    />
  );
}

const RECIPIENT_TYPES = [
  { value: "all",        label: "All",            sub: "Users + Dietitians", icon: <LuMails size={20} />,       accent: "#6366f1" },
  { value: "users",      label: "Users Only",     sub: "Active users",       icon: <LuUsers size={20} />,       accent: "#0ea5e9" },
  { value: "dietitians", label: "Dietitians Only",sub: "Active dietitians",  icon: <LuStethoscope size={20} />, accent: "#10b981" },
  { value: "selected",   label: "Select People",  sub: "Pick individually",  icon: <LuMail size={20} />,        accent: "#f59e0b" },
];

function RecipientTypeCard({ opt, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      flex: 1, padding: "16px", borderRadius: "14px", cursor: "pointer", transition: "all 0.2s",
      border: `2px solid ${active ? opt.accent : "#e5e7eb"}`,
      background: active ? `${opt.accent}0d` : "#fff",
      boxShadow: active ? `0 4px 16px ${opt.accent}22` : "0 1px 4px rgba(0,0,0,0.04)",
      display: "flex", flexDirection: "column", gap: "8px",
    }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: active ? `${opt.accent}18` : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: active ? opt.accent : "#9ca3af", transition: "all 0.2s" }}>
        {opt.icon}
      </div>
      <div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: active ? opt.accent : "#374151" }}>{opt.label}</p>
        <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af", marginTop: "2px", lineHeight: 1.4 }}>{opt.sub}</p>
      </div>
      <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: `2px solid ${active ? opt.accent : "#d1d5db"}`, background: active ? opt.accent : "#fff", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", marginTop: "2px" }}>
        {active && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff" }} />}
      </div>
    </div>
  );
}

function RecipientTag({ r, onRemove }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "20px", padding: "4px 8px 4px 6px", fontSize: "12px" }}>
      <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: r.type === "dietitian" ? "#10b981" : "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 800, flexShrink: 0 }}>
        {r.full_name?.[0]?.toUpperCase() || "?"}
      </div>
      <span style={{ fontWeight: 600, color: "#166534" }}>{r.full_name}</span>
      <span style={{ color: "#6b7280" }}>({r.type})</span>
      <button onClick={() => onRemove(r.id)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#9ca3af", display: "flex", lineHeight: 1 }}>
        <LuX size={12} />
      </button>
    </div>
  );
}

function TypeBadge({ type }) {
  const map = { all: ["#6366f1", "#f5f3ff", "All"], users: ["#0ea5e9", "#f0f9ff", "Users"], dietitians: ["#10b981", "#f0fdf4", "Dietitians"], selected: ["#f59e0b", "#fffbeb", "Selected"] };
  const [color, bg, label] = map[type] || ["#6b7280", "#f3f4f6", type];
  return <span style={{ background: bg, color, border: `1px solid ${color}33`, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>{label}</span>;
}

function StatusBadge({ status }) {
  return status === "sent"
    ? <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#dcfce7", color: "#16a34a", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}><LuCheckCircle size={11} />Sent</span>
    : <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#fee2e2", color: "#ef4444", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}><LuXCircle size={11} />Failed</span>;
}

const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}  ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
};

// ─── Compose tab ────────────────────────────────────────────────────────────────

function ComposeTab({ onSent }) {
  const [recipientType, setRecipientType] = useState("all");
  const [subject, setSubject]             = useState("");
  const [message, setMessage]             = useState("");
  const [searchQuery, setSearchQuery]     = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selected, setSelected]           = useState([]);
  const [searching, setSearching]         = useState(false);
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [sending, setSending]             = useState(false);
  const [result, setResult]               = useState(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults([]); setDropdownOpen(false); return; }
    setSearching(true);
    try {
      const res = await fetchRecipients({ type: "all", search: q, limit: 20 });
      const list = res.data?.data || [];
      setSearchResults(list);
      setDropdownOpen(list.length > 0);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(searchQuery), 320);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, doSearch]);

  useEffect(() => {
    const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSend = async () => {
    if (!subject.trim()) { toast.error("Subject is required"); return; }
    if (!message.trim()) { toast.error("Message body is required"); return; }
    if (recipientType === "selected" && selected.length === 0) { toast.error("Please select at least one recipient"); return; }
    setSending(true); setResult(null);
    try {
      const payload = { recipient_type: recipientType, subject: subject.trim(), message: message.trim(), ...(recipientType === "selected" ? { recipient_ids: selected.map(r => r.id) } : {}) };
      const res = await sendBroadcast(payload);
      const d = res.data?.data || {};
      setResult({ sent: d.sent ?? 0, failed: d.failed ?? 0, failed_emails: d.failed_emails || [] });
      toast.success(`Broadcast sent! ${d.sent} delivered.`);
      if (onSent) onSent();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send broadcast");
    } finally { setSending(false); }
  };

  const handleReset = () => { setSubject(""); setMessage(""); setSelected([]); setSearchQuery(""); setResult(null); };

  return (
    <div>
      {/* Result banner */}
      {result && (
        <div style={{ marginBottom: "20px", background: result.failed === 0 ? "#f0fdf4" : "#fffbeb", border: `1px solid ${result.failed === 0 ? "#bbf7d0" : "#fde68a"}`, borderRadius: "12px", padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {result.failed === 0
              ? <MdCheckCircle style={{ color: "#16a34a", fontSize: "22px", flexShrink: 0 }} />
              : <LuAlertTriangle size={20} color="#d97706" style={{ flexShrink: 0 }} />}
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, color: "#111827", fontSize: "14px" }}>
                {result.sent} email{result.sent !== 1 ? "s" : ""} sent successfully
                {result.failed > 0 && ` · ${result.failed} failed`}
              </p>
              {result.failed_emails.length > 0 && (
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#b45309" }}>
                  Failed: {result.failed_emails.join(", ")}
                </p>
              )}
            </div>
            <button onClick={handleReset} style={{ height: "34px", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "0 14px", background: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap" }}>
              New Broadcast
            </button>
          </div>
        </div>
      )}

      {/* Section 1: Recipients */}
      <Section title="Who are you sending to?" icon="👥">
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {RECIPIENT_TYPES.map(opt => (
            <RecipientTypeCard key={opt.value} opt={opt} active={recipientType === opt.value}
              onClick={() => { setRecipientType(opt.value); setSelected([]); }} />
          ))}
        </div>

        {/* Selected mode: search picker */}
        {recipientType === "selected" && (
          <div style={{ marginTop: "16px", background: "#f9fafb", borderRadius: "12px", padding: "16px", border: "1px solid #e5e7eb" }}>
            <FieldLabel label="Search & add recipients" />
            {selected.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                {selected.map(r => <RecipientTag key={r.id} r={r} onRemove={(id) => setSelected(p => p.filter(s => s.id !== id))} />)}
              </div>
            )}
            <div ref={dropdownRef} style={{ position: "relative", maxWidth: "440px" }}>
              <StyledInput
                icon={searching
                  ? <span className="spinner-border spinner-border-sm" style={{ width: "13px", height: "13px", borderWidth: "2px", color: "#9ca3af" }} />
                  : <LuSearch size={15} />}
                type="text" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name or email…"
              />
              {dropdownOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 200, maxHeight: "220px", overflowY: "auto", padding: "6px" }}>
                  {searchResults.map(r => {
                    const already = !!selected.find(s => s.id === r.id);
                    return (
                      <div key={r.id} onClick={() => { if (!already) { setSelected(p => [...p, r]); setSearchQuery(""); setDropdownOpen(false); } }}
                        style={{ padding: "9px 12px", display: "flex", alignItems: "center", gap: "10px", borderRadius: "8px", cursor: already ? "default" : "pointer", opacity: already ? 0.5 : 1, transition: "background 0.15s" }}
                        onMouseEnter={e => { if (!already) e.currentTarget.style.background = "#f0f9f3"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: r.type === "dietitian" ? "#10b981" : "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>
                          {r.full_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.full_name}</p>
                          <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{r.email}</p>
                        </div>
                        <TypeBadge type={r.type === "dietitian" ? "dietitians" : "users"} />
                        {already && <span style={{ fontSize: "10px", color: "#9ca3af", flexShrink: 0 }}>Added</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {selected.length > 0 && (
              <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#1E8E3E", fontWeight: 600 }}>
                {selected.length} recipient{selected.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        )}
      </Section>

      {/* Section 2: Compose */}
      <Section title="Compose Email" icon="✉️">
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <FieldLabel label="Subject" required />
            <StyledInput
              type="text" value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Important update from Meri Diet"
            />
          </div>
          <div>
            <FieldLabel label="Message" required hint="double line-break = new paragraph · single = &lt;br&gt;" />
            <StyledTextarea
              rows={9} value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={"Dear user,\n\nWe wanted to let you know about an important update…"}
            />
          </div>
        </div>
      </Section>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingTop: "4px" }}>
        <button onClick={handleSend} disabled={sending} style={{
          height: "42px", padding: "0 24px", border: "none", borderRadius: "10px",
          background: sending ? "#9ca3af" : "linear-gradient(135deg, #1E8E3E, #166C31)",
          color: "#fff", cursor: sending ? "not-allowed" : "pointer",
          fontWeight: 700, fontSize: "13px", display: "flex", alignItems: "center", gap: "8px",
          boxShadow: sending ? "none" : "0 4px 14px rgba(30,142,62,0.4)", transition: "all 0.2s",
        }}>
          {sending
            ? <><span className="spinner-border spinner-border-sm" style={{ width: "14px", height: "14px", borderWidth: "2px" }} /> Sending…</>
            : <><LuSend size={15} /> Send Broadcast</>}
        </button>
        {(subject || message) && !sending && (
          <button onClick={handleReset} style={{ height: "42px", padding: "0 18px", border: "1px solid #e5e7eb", borderRadius: "10px", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "13px", color: "#6b7280" }}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Detail modal ───────────────────────────────────────────────────────────────

function DetailModal({ id, onClose }) {
  const [data, setData]       = useState(null);
  const [meta, setMeta]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);

  const load = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await fetchBroadcastDetail({ id, page: p, limit: 50 });
      setData(res.data?.data);
      setMeta(res.data?.meta);
    } catch { toast.error("Failed to load broadcast detail"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(page); }, [load, page]);

  return (
    <Modal show onHide={onClose} size="lg" centered scrollable>
      <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #1E8E3E 0%, #0f5c26 100%)", color: "#fff", borderBottom: "none", padding: "1.1rem 1.5rem" }}>
        <Modal.Title style={{ fontWeight: 800, fontSize: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LuMail size={16} color="#fff" />
          </div>
          Broadcast Detail
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ background: "#f0f4f8", padding: "20px" }}>
        {loading && !data ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <div className="spinner-border" style={{ color: "#1E8E3E", width: "2.5rem", height: "2.5rem" }} role="status" />
            <p style={{ marginTop: "14px", color: "#999", fontSize: "14px" }}>Loading…</p>
          </div>
        ) : data ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Meta card */}
            <div style={{ background: "#fff", borderRadius: "14px", padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <div className="row g-3">
                {[
                  { label: "Subject",    value: data.subject },
                  { label: "Sent By",    value: data.admin_name || "Admin" },
                  { label: "Sent To",    value: <TypeBadge type={data.recipient_type} /> },
                  { label: "Date",       value: <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><LuClock size={13} />{fmtDate(data.created_at)}</span> },
                  { label: "Delivered",  value: <span style={{ color: "#16a34a", fontWeight: 700 }}>✓ {data.sent_count}</span> },
                  { label: "Failed",     value: data.failed_count > 0 ? <span style={{ color: "#ef4444", fontWeight: 700 }}>✗ {data.failed_count}</span> : <span style={{ color: "#9ca3af" }}>None</span> },
                ].map(({ label, value }) => (
                  <div className="col-6 col-md-4" key={label}>
                    <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "10px 14px" }}>
                      <small style={{ color: "#aaa", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</small>
                      <div style={{ marginTop: "4px", fontWeight: 600, color: "#111827", fontSize: "13px" }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message */}
              <div style={{ marginTop: "14px" }}>
                <small style={{ color: "#aaa", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Message</small>
                <div style={{ marginTop: "6px", background: "#f8f9fa", borderRadius: "10px", padding: "12px 14px", fontSize: "13px", color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.75, maxHeight: "150px", overflowY: "auto", border: "1px solid #e5e7eb" }}>
                  {data.message}
                </div>
              </div>
            </div>

            {/* Recipients */}
            <div style={{ background: "#fff", borderRadius: "14px", padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <p style={{ margin: "0 0 14px", fontWeight: 800, fontSize: "12px", color: "#374151", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                Recipients ({data.total_recipients})
              </p>

              {!data.detail_available ? (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <LuAlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <p style={{ margin: "0 0 3px", fontWeight: 700, color: "#92400e", fontSize: "13px" }}>Per-recipient details unavailable</p>
                    <p style={{ margin: 0, color: "#b45309", fontSize: "12px" }}>
                      Detailed data is kept for {meta?.recipient_detail_retention_days ?? 30} days after sending. Summary counts above are permanent.
                    </p>
                  </div>
                </div>
              ) : loading ? (
                <div style={{ textAlign: "center", padding: "30px" }}>
                  <div className="spinner-border" style={{ color: "#1E8E3E" }} role="status" />
                </div>
              ) : (
                <>
                  <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #edf1ee" }}>
                    <Table className="table mb-0" style={{ borderCollapse: "collapse", minWidth: "500px" }}>
                      <thead>
                        <tr>
                          {["#", "Name", "Email", "Status"].map(col => (
                            <th key={col} style={{ background: "#1E8E3E", color: "#fff", fontWeight: 600, fontSize: "12px", padding: "12px 14px", whiteSpace: "nowrap", borderBottom: "2px solid #166C31" }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(data.recipients || []).map((r, i) => (
                          <tr key={r.user_id} style={{ borderBottom: "1px solid #edf1ee", background: i % 2 === 0 ? "#fff" : "#fafcfa" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f0f9f3"}
                            onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafcfa"}>
                            <td style={{ padding: "10px 14px", fontSize: "13px", fontWeight: 700, color: "#1E8E3E", verticalAlign: "middle" }}>{(page - 1) * 50 + i + 1}</td>
                            <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827", verticalAlign: "middle" }}>{r.full_name}</td>
                            <td style={{ padding: "10px 14px", color: "#6b7280", fontSize: "13px", verticalAlign: "middle" }}>{r.email}</td>
                            <td style={{ padding: "10px 14px", verticalAlign: "middle" }}><StatusBadge status={r.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                  {meta && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 2px", fontSize: "13px", color: "#888", marginTop: "4px" }}>
                      <span>Total: <strong style={{ color: "#111827" }}>{meta.total}</strong> recipients</span>
                      <span style={{ background: "#f0f9f3", padding: "3px 12px", borderRadius: "20px", fontWeight: 500, color: "#1E8E3E" }}>Page {meta.page} of {meta.totalPages}</span>
                    </div>
                  )}
                  {meta?.totalPages > 1 && <GlobalPagination currentPage={page} totalPages={meta.totalPages} onPageChange={(p) => setPage(p)} />}
                </>
              )}
            </div>
          </div>
        ) : null}
      </Modal.Body>

      <Modal.Footer style={{ background: "#fff", borderTop: "1px solid #e5e7eb" }}>
        <Button variant="outline-secondary" onClick={onClose} style={{ borderRadius: "8px", fontWeight: 600 }}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}

// ─── History tab ────────────────────────────────────────────────────────────────

function HistoryTab() {
  const [rows, setRows]         = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading]   = useState(true);
  const [detailId, setDetailId] = useState(null);

  const load = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await fetchHistory({ page: p, limit: 20 });
      setRows(res.data?.data || []);
      const m = res.data?.meta || {};
      setPagination({ page: m.page || 1, totalPages: m.totalPages || 1, total: m.total || 0 });
    } catch { toast.error("Failed to load broadcast history"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(currentPage); }, [load, currentPage]);

  return (
    <div>
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div className="spinner-border" style={{ color: "#1E8E3E", width: "2.5rem", height: "2.5rem" }} role="status" />
          <p style={{ marginTop: "16px", color: "#999", fontSize: "14px", fontWeight: 500 }}>Loading history…</p>
        </div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", borderRadius: "12px", border: "1px solid #edf1ee" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
          <h5 style={{ fontWeight: 700, color: "#333", marginBottom: "8px" }}>No Broadcasts Sent Yet</h5>
          <p style={{ fontSize: "14px", color: "#999" }}>Your sent broadcast emails will appear here.</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #edf1ee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <Table className="table mb-0" style={{ borderCollapse: "collapse", minWidth: "780px" }}>
              <thead>
                <tr>
                  {["S.No", "Date & Time", "Subject", "Sent To", "Delivered", "Failed", "Actions"].map(col => (
                    <th key={col} style={{ background: "#1E8E3E", color: "#fff", fontWeight: 600, fontSize: "13px", padding: "14px 16px", whiteSpace: "nowrap", borderBottom: "2px solid #166C31", letterSpacing: "0.3px" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id}
                    style={{ borderBottom: "1px solid #edf1ee", background: i % 2 === 0 ? "#fff" : "#fafcfa", transition: "background 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f0f9f3"}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafcfa"}>
                    <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 700, color: "#1E8E3E", verticalAlign: "middle" }}>
                      {(pagination.page - 1) * 20 + i + 1}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "#6b7280", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <LuClock size={13} />{fmtDate(row.created_at)}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", verticalAlign: "middle", maxWidth: "240px" }}>
                      <p style={{ margin: 0, fontWeight: 700, color: "#111827", fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.subject}</p>
                      {row.message_preview && <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.message_preview}</p>}
                    </td>
                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      <TypeBadge type={row.recipient_type} />
                    </td>
                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "#dcfce7", color: "#16a34a", borderRadius: "20px", padding: "4px 10px", fontSize: "12px", fontWeight: 700 }}>
                        ✓ {row.sent_count}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      {row.failed_count > 0
                        ? <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "#fee2e2", color: "#ef4444", borderRadius: "20px", padding: "4px 10px", fontSize: "12px", fontWeight: 700 }}>✗ {row.failed_count}</span>
                        : <span style={{ color: "#9ca3af", fontSize: "13px" }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      <div
                        onClick={() => setDetailId(row.id)}
                        title="View Detail"
                        style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                      >
                        <LuEye style={{ color: "#3b82f6", fontSize: "15px" }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px", fontSize: "13px", color: "#888", marginTop: "4px" }}>
            <span>Showing <strong style={{ color: "#111827" }}>{rows.length}</strong> of <strong style={{ color: "#111827" }}>{pagination.total}</strong> broadcasts</span>
            <span style={{ background: "#f0f9f3", padding: "4px 14px", borderRadius: "20px", fontWeight: 500, color: "#1E8E3E" }}>Page {pagination.page} of {pagination.totalPages}</span>
          </div>
          {pagination.totalPages > 1 && <GlobalPagination currentPage={currentPage} totalPages={pagination.totalPages} onPageChange={setCurrentPage} />}
        </>
      )}

      {detailId && <DetailModal id={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────────

export default function BroadcastEmail() {
  const [tab, setTab]           = useState("compose");
  const [historyKey, setHistoryKey] = useState(0);

  return (
    <div style={{ padding: "4px 0" }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div style={{ width: "4px", height: "28px", background: "linear-gradient(180deg,#1E8E3E,#4ade80)", borderRadius: "4px" }} />
            <h2 className="fw700 mb-0">
              <span style={{ color: "#111827" }}>BROADCAST</span>
              <span style={{ color: "#1E8E3E" }}> EMAIL</span>
            </h2>
          </div>
          <p style={{ color: "#999", marginBottom: 0, paddingLeft: "14px" }}>Send emails to users, dietitians, or a custom selection of recipients.</p>
        </div>
      </div>

      {/* Card */}
      <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        {/* Tab toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid #edf1ee" }}>
          {[
            { id: "compose", label: "Compose",      icon: <LuSend size={14} /> },
            { id: "history", label: "Sent History",  icon: <LuHistory size={14} /> },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              height: "38px", padding: "0 16px", border: `1px solid ${tab === t.id ? "#1E8E3E" : "#e5e7eb"}`,
              borderRadius: "10px", background: tab === t.id ? "#1E8E3E" : "#fff",
              color: tab === t.id ? "#fff" : "#555", fontWeight: tab === t.id ? 700 : 500,
              fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px",
              transition: "all 0.18s",
            }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {tab === "compose" && <ComposeTab onSent={() => setHistoryKey(k => k + 1)} />}
        {tab === "history" && <HistoryTab key={historyKey} />}
      </div>
    </div>
  );
}
