import { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Table, FormControl, Modal, Button } from "react-bootstrap";
import { FaSort, FaChevronDown, FaEye, FaEyeSlash, FaCheckCircle, FaExternalLinkAlt, FaFileExcel, FaCalendarAlt, FaFilter, FaPlus, FaTrash, FaUserPlus } from "react-icons/fa";
import { MdBlock, MdCheckCircle, MdDelete, MdClose } from "react-icons/md";
import GlobalPagination from "../common/GlobalPagination";
import API from "../../helpers/api";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { IN_STATES } from "../../data/indiaCities";
import { uploadDocuments } from "../../services/dietitianUploadService";

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

const toList = (val) => {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === "string" && val.trim()) return val.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
};

const SORT_OPTIONS = [
  { key: "new", label: "Newest First", sortBy: "created_at", sortOrder: "DESC" },
  { key: "old", label: "Oldest First", sortBy: "created_at", sortOrder: "ASC" },
  { key: "a-z", label: "Name A – Z",  sortBy: "full_name",  sortOrder: "ASC"  },
  { key: "z-a", label: "Name Z – A",  sortBy: "full_name",  sortOrder: "DESC" },
];
const SORT_LABEL = { new: "Newest", old: "Oldest", "a-z": "A – Z", "z-a": "Z – A" };

const DEGREE_GROUPS = [
  {
    group: "Undergraduate",
    options: [
      "B.Sc. Nutrition & Dietetics", "B.Sc. Food Science & Nutrition", "B.Sc. Clinical Nutrition",
      "B.Sc. Dietetics", "B.Sc. Food & Nutrition", "B.Sc. Food Technology",
      "B.Sc. Home Science (Nutrition)", "B.Sc. Home Science (Food & Nutrition)",
      "B.Sc. Biochemistry", "B.Sc. Biotechnology", "B.Sc. Agriculture (Food Science)", "B.H.Sc. Home Science",
    ],
  },
  {
    group: "Postgraduate",
    options: [
      "M.Sc. Nutrition & Dietetics", "M.Sc. Food Science & Nutrition", "M.Sc. Clinical Nutrition",
      "M.Sc. Dietetics", "M.Sc. Food & Nutrition", "M.Sc. Food Technology",
      "M.Sc. Home Science (Nutrition)", "M.Sc. Biochemistry", "M.Sc. Biotechnology",
      "M.Sc. Sports Nutrition", "M.Sc. Public Health Nutrition", "M.Sc. Community Nutrition",
      "M.Sc. Human Nutrition", "M.Sc. Maternal & Child Nutrition", "M.Sc. Applied Nutrition",
    ],
  },
  {
    group: "PG Diploma / Diploma",
    options: [
      "PG Diploma in Dietetics", "PG Diploma in Clinical Nutrition", "PG Diploma in Sports Nutrition",
      "PG Diploma in Food Science", "PG Diploma in Diabetes Education", "PG Diploma in Community Nutrition",
      "PGDDN (IGNOU)", "DNHE", "Diploma in Dietetics & Nutrition",
    ],
  },
  {
    group: "Doctorate",
    options: [
      "Ph.D. Nutrition", "Ph.D. Food Science", "Ph.D. Clinical Nutrition",
      "Ph.D. Nutritional Biochemistry", "Ph.D. Food & Nutrition", "Ph.D. Dietetics", "Ph.D. Home Science",
    ],
  },
  {
    group: "Medical",
    options: ["MBBS", "MD Medicine", "MD Biochemistry", "DNB (General Medicine)"],
  },
  {
    group: "Professional Certifications",
    options: [
      "CDE (Certified Diabetes Educator)", "Certified Sports Nutritionist",
      "CNS (Certified Nutrition Specialist)", "Registered Dietitian (RD)", "Other",
    ],
  },
];

const EXPERIENCE_CHIPS = [
  { label: "< 1 yr",   value: "<1 year"    },
  { label: "1–3 yrs",  value: "1-3 years"  },
  { label: "3–5 yrs",  value: "3-5 years"  },
  { label: "5–10 yrs", value: "5-10 years" },
  { label: "10+ yrs",  value: "10+ years"  },
];

const EMPTY_REGISTER = {
  fullName: "", phone: "", email: "", state: "", city: "", password: "",
  highestDegree: "", registrationNumber: "", experience: "", specialization: [],
  profilePhoto: null, degreeCertificate: null, idProof: null,
  registrationCertificate: null, agreeTerms: false,
};

function TagInput({ tags, onAdd, onRemove, inputVal, onInputChange, placeholder }) {
  const handleKey = (e) => {
    if ((e.key === "Enter" || e.key === ",") && inputVal.trim()) {
      e.preventDefault();
      onAdd(inputVal.trim().replace(/,+$/, ""));
      onInputChange("");
    }
  };
  const handleBlur = () => {
    if (inputVal.trim()) { onAdd(inputVal.trim()); onInputChange(""); }
  };
  return (
    <div style={{ border: "1px solid #e5e5e5", borderRadius: "8px", padding: "6px 10px", display: "flex", flexWrap: "wrap", gap: "6px", minHeight: "42px", background: "#fff", cursor: "text" }}>
      {tags.map((tag, i) => (
        <span key={i} style={{ background: "#f0f9f3", color: "#1E8E3E", border: "1px solid rgba(30,142,62,0.25)", borderRadius: "20px", padding: "2px 10px", fontSize: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
          {tag}
          <MdClose style={{ cursor: "pointer", fontSize: "13px" }} onClick={() => onRemove(i)} />
        </span>
      ))}
      <input type="text" value={inputVal} onChange={(e) => onInputChange(e.target.value)} onKeyDown={handleKey} onBlur={handleBlur}
        placeholder={tags.length ? "" : placeholder}
        style={{ border: "none", outline: "none", fontSize: "13px", flex: 1, minWidth: "120px", background: "transparent", padding: "2px 4px" }}
      />
    </div>
  );
}

function FileUpload({ label, accept, maxSizeMB, value, onChange, error }) {
  const inputRef = useRef(null);
  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`${label}: File must be under ${maxSizeMB}MB`);
      e.target.value = "";
      return;
    }
    onChange(file);
  };
  const remove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };
  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        style={{ border: `2px dashed ${error ? "#ef4444" : value ? "#1E8E3E" : "#d1d5db"}`, borderRadius: "10px", padding: "16px 20px", cursor: "pointer", background: value ? "#f0f9f3" : "#fafafa", transition: "all 0.2s", textAlign: "center" }}
      >
        {value ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>📄</span>
            <div style={{ flex: 1, textAlign: "left" }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: "#111827", wordBreak: "break-all" }}>{value.name}</p>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#888" }}>{(value.size / 1024).toFixed(0)} KB</p>
            </div>
            <button type="button" onClick={remove} style={{ border: "none", background: "#fef2f2", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", color: "#ef4444", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>Remove</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: "28px", marginBottom: "6px" }}>📁</div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: "#555" }}>Click to upload</p>
            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#9ca3af" }}>{accept.join(" / ")} • Max {maxSizeMB}MB</p>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept.join(",")} style={{ display: "none" }} onChange={handleChange} />
      {error && <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px", marginBottom: 0 }}>{error}</p>}
    </div>
  );
}

const SPECIALIZATIONS = [
  "Weight Management", "Sports Nutrition", "Clinical Nutrition", "Pediatric Nutrition",
  "PCOS / Hormonal Imbalance", "Diabetes Care", "Gut Health & IBS", "General Wellness",
  "Thyroid Management", "Renal / Kidney Nutrition", "Cardiac Nutrition", "Oncology Nutrition",
  "Pre & Postnatal Nutrition", "Geriatric Nutrition", "Eating Disorders",
  "Food Allergy & Intolerance", "Vegan / Plant-Based Nutrition", "Bariatric Nutrition",
  "Immune & Functional Nutrition", "Keto / Low-Carb Nutrition", "Fatty Liver & Liver Health",
  "Cholesterol & Lipid Management", "Hypertension & Heart Health", "Anaemia & Iron Deficiency",
  "Bone Health & Osteoporosis", "Skin & Hair Nutrition", "Mental Health & Nutrition",
];

function SpecializationInput({ selected, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);
  const ref = useRef(null);

  const atLimit    = selected.length >= 8;
  const atSoftWarn = selected.length >= 5 && !atLimit;

  const filtered = SPECIALIZATIONS.filter(
    (s) => s.toLowerCase().includes(query.toLowerCase()) && !selected.includes(s)
  );
  const showCustomAdd =
    query.trim() &&
    !SPECIALIZATIONS.some((s) => s.toLowerCase() === query.trim().toLowerCase()) &&
    !selected.includes(query.trim());

  const add = (val) => {
    if (atLimit) return;
    onChange([...selected, val]);
    setQuery("");
    setOpen(false);
  };
  const remove = (val) => onChange(selected.filter((s) => s !== val));

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref}>
      {/* Selected chips */}
      {selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
          {selected.map((s) => (
            <span key={s} style={{ background: "#f0f9f3", color: "#1E8E3E", border: "1px solid rgba(30,142,62,0.25)", borderRadius: "20px", padding: "4px 10px", fontSize: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "5px" }}>
              {s}
              <MdClose style={{ cursor: "pointer", fontSize: "13px" }} onClick={() => remove(s)} />
            </span>
          ))}
        </div>
      )}

      {/* Soft warn */}
      {atSoftWarn && (
        <p style={{ fontSize: "11px", color: "#f59e0b", fontWeight: 600, margin: "0 0 8px", display: "flex", alignItems: "center", gap: "4px" }}>
          <span>⚠</span> Profiles with focused specializations tend to get more client trust.
        </p>
      )}

      {/* Hard limit */}
      {atLimit ? (
        <p style={{ fontSize: "12px", color: "#ef4444", fontWeight: 600, margin: 0, padding: "9px 12px", border: "1px solid #fecaca", borderRadius: "8px", background: "#fef2f2" }}>
          Maximum 8 specializations reached.
        </p>
      ) : (
        <>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search or type to add a custom specialization…"
            style={{ width: "100%", padding: "9px 12px", fontSize: "13px", outline: "none", background: "#fff", color: "#111827",
              border: "1px solid #e5e5e5",
              borderRadius: open && (filtered.length > 0 || showCustomAdd) ? "8px 8px 0 0" : "8px",
              borderBottom: open && (filtered.length > 0 || showCustomAdd) ? "1px solid #e5e5e5" : undefined,
            }}
          />
          {open && (filtered.length > 0 || showCustomAdd) && (
            <div style={{ border: "1px solid #e5e5e5", borderTop: "none", borderRadius: "0 0 8px 8px", background: "#fff", maxHeight: "180px", overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
              {filtered.map((s) => (
                <div key={s} onClick={() => add(s)}
                  style={{ padding: "9px 14px", cursor: "pointer", fontSize: "13px", color: "#374151", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9f3")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
                  {s}
                </div>
              ))}
              {showCustomAdd && (
                <div onClick={() => add(query.trim())}
                  style={{ padding: "9px 14px", cursor: "pointer", fontSize: "13px", color: "#1E8E3E", fontWeight: 700, borderTop: filtered.length ? "1px solid #edf1ee" : "none", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9f3")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
                  + Add &ldquo;{query.trim()}&rdquo;
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SearchableSelect({ options, value, onChange, placeholder, disabled, loading, error }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const ref = useRef(null);
  const inputRef = useRef(null);

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(query.toLowerCase())
  );

  const updateRect = () => {
    if (ref.current) setRect(ref.current.getBoundingClientRect());
  };

  const handleSelect = (opt) => {
    onChange(opt);
    setQuery("");
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
    setOpen(false);
  };

  const handleContainerClick = () => {
    if (disabled) return;
    updateRect();
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    const reposition = () => updateRect();
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  const dropdown = open && !disabled && rect && ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
        background: "#fff",
        border: "1px solid #1E8E3E",
        borderTop: "none",
        borderRadius: "0 0 8px 8px",
        maxHeight: "200px",
        overflowY: "auto",
        zIndex: 9999,
        boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
      }}
    >
      {filtered.length ? filtered.map((opt) => (
        <div
          key={opt}
          onMouseDown={(e) => { e.preventDefault(); handleSelect(opt); }}
          style={{ padding: "9px 14px", cursor: "pointer", fontSize: "13px", color: opt === value ? "#1E8E3E" : "#374151", fontWeight: opt === value ? 700 : 400, background: opt === value ? "#f0f9f3" : "#fff", transition: "background 0.12s" }}
          onMouseEnter={(e) => { if (opt !== value) e.currentTarget.style.background = "#f9fafb"; }}
          onMouseLeave={(e) => { if (opt !== value) e.currentTarget.style.background = opt === value ? "#f0f9f3" : "#fff"; }}
        >
          {opt}
        </div>
      )) : (
        <div style={{ padding: "14px", fontSize: "13px", color: "#9ca3af", textAlign: "center" }}>No results found</div>
      )}
    </div>,
    document.body
  );

  return (
    <div ref={ref}>
      <div
        onClick={handleContainerClick}
        style={{
          display: "flex", alignItems: "center",
          border: `1px solid ${error ? "#ef4444" : open ? "#1E8E3E" : "#e5e5e5"}`,
          borderRadius: "8px",
          background: disabled ? "#f9fafb" : "#fff",
          padding: "0 10px", cursor: disabled ? "not-allowed" : "text",
          opacity: disabled ? 0.6 : 1, minHeight: "40px",
          transition: "border-color 0.15s",
        }}
      >
        {open ? (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${placeholder}…`}
            onClick={(e) => e.stopPropagation()}
            style={{ border: "none", outline: "none", flex: 1, padding: "9px 0", fontSize: "13px", background: "transparent", color: "#111827" }}
          />
        ) : (
          <span style={{ flex: 1, padding: "9px 0", fontSize: "13px", color: value ? "#111827" : "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {value || placeholder}
          </span>
        )}
        {loading ? (
          <div style={{ width: "14px", height: "14px", border: "2px solid #e5e5e5", borderTopColor: "#1E8E3E", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0, marginLeft: "6px" }} />
        ) : value && !open ? (
          <MdClose
            style={{ color: "#9ca3af", cursor: "pointer", fontSize: "16px", flexShrink: 0, marginLeft: "6px" }}
            onClick={handleClear}
          />
        ) : (
          <FaChevronDown style={{ color: "#9ca3af", fontSize: "12px", flexShrink: 0, marginLeft: "6px", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
        )}
      </div>
      {dropdown}
    </div>
  );
}

// apiKey: "dietitianList" | "dietitianRequests"
// showVerify: true = show Verify button in detail modal
export default function DietitianTable({ apiKey = "dietitianList", showVerify = false }) {
  const [dietitians, setDietitians] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Sort
  const [sortType, setSortType] = useState("");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortRef = useRef(null);

  // Status filter
  const [statusFilter, setStatusFilter] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusRef = useRef(null);

  // Date range
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateRef = useRef(null);

  // Export
  const [isExporting, setIsExporting] = useState(false);

  // Detail modal
  const [showDetail, setShowDetail] = useState(false);
  const [selectedDietitian, setSelectedDietitian] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Block / Delete states
  const [togglingId, setTogglingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Register dietitian modal
  const [showRegister, setShowRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState(EMPTY_REGISTER);
  const [registerErrors, setRegisterErrors] = useState({});
  const [registering, setRegistering] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [registeringMsg, setRegisteringMsg] = useState("");
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setCurrentPage(1); }, 500);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { fetchDietitians(); }, [debouncedSearch, sortType, statusFilter, currentPage, startDate, endDate]);

  const buildParams = (overrides = {}) => {
    const params = new URLSearchParams();

    const s  = overrides.search    !== undefined ? overrides.search    : debouncedSearch;
    const st = overrides.sortType  !== undefined ? overrides.sortType  : sortType;
    const sd = overrides.startDate !== undefined ? overrides.startDate : startDate;
    const ed = overrides.endDate   !== undefined ? overrides.endDate   : endDate;
    const pg = overrides.page      !== undefined ? overrides.page      : currentPage;
    const lm = overrides.limit     !== undefined ? overrides.limit     : pagination.limit;
    const sv = overrides.status    !== undefined ? overrides.status    : statusFilter;

    if (s) params.append("search", s);

    const option = SORT_OPTIONS.find((o) => o.key === st);
    if (option) {
      params.append("sortBy", option.sortBy);
      params.append("sortOrder", option.sortOrder);
    }

    if (sd) params.append("startDate", sd);
    if (ed) params.append("endDate", ed);
    if (sv) params.append("status", sv);

    params.append("page", pg);
    params.append("limit", lm);

    return params.toString();
  };

  const fetchDietitians = () => {
    setLoading(true);
    API.apiGet(apiKey, `?${buildParams()}`)
      .then((res) => {
        const data = res?.data?.data || [];
        const meta = res?.data?.meta || {};
        setDietitians(data);
        setPagination({ page: meta.page || 1, limit: meta.limit || 10, total: meta.total || 0, totalPages: meta.totalPages || 1 });
      })
      .catch(() => toast.error("Failed to fetch dietitians."))
      .finally(() => setLoading(false));
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    API.apiGet(apiKey, `?${buildParams({ page: 1, limit: 10000 })}`)
      .then((res) => {
        const data = res?.data?.data || [];
        if (!data.length) { toast.error("No data to export."); return; }

        const formatAvailability = (avail) => {
          if (!avail || typeof avail !== "object") return "—";
          return ["mon","tue","wed","thu","fri","sat","sun"]
            .map((day) => {
              const slots = avail[day];
              return slots?.length ? `${day.toUpperCase()}: ${slots.join(", ")}` : null;
            })
            .filter(Boolean)
            .join(" | ") || "—";
        };

        const formatDegrees = (degrees) => {
          const list = toList(degrees);
          if (!list.length) return "—";
          return list.map((deg) => {
            const parts = [deg.degree, deg.institute, deg.year].filter(Boolean);
            return parts.join(" – ");
          }).join("; ");
        };

        const formatAwards = (awards) => {
          const list = toList(awards);
          if (!list.length) return "—";
          return list.map((aw) => {
            const parts = [aw.title, aw.organization, aw.year].filter(Boolean);
            return parts.join(" – ");
          }).join("; ");
        };

        const rows = data.map((d, i) => ({
          // ── Identity
          "#":                    i + 1,
          "Full Name":            d.full_name || "N/A",
          "Email":                d.email || "—",
          "Phone":                d.phone_number ? `${d.phone_code || ""} ${d.phone_number}`.trim() : "—",
          "Gender":               d.gender || "—",
          "Date of Birth":        d.date_of_birth ? formatDate(d.date_of_birth) : "—",

          // ── Location
          "City":                 d.city || "—",
          "State":                d.state || "—",

          // ── Professional
          "Experience":           d.experience || "—",
          "Registration No.":     d.registration_number || "—",
          "Specialization":       toList(d.specialization).join(", ") || "—",
          "Languages":            toList(d.languages).join(", ") || "—",
          "Services":             toList(d.services).join(", ") || "—",
          "Bio":                  d.bio || "—",

          // ── Education & Awards
          "Degrees":              formatDegrees(d.degrees),
          "Awards":               formatAwards(d.awards),

          // ── Availability
          "Availability":         formatAvailability(d.availability),

          // ── Status
          "Active Status":        d.is_active ? "Active" : "Blocked",
          "Verified Status":      VERIFY_STATUS[d.is_verified] ?? "Pending",
          "Online":               d.is_online ? "Online" : "Offline",

          // ── Documents (URLs for review)
          "Profile Photo":        d.documents?.profile_photo || "—",
          "Degree Certificate":   d.documents?.degree_certificate || "—",
          "Reg. Certificate":     d.documents?.registration_certificate || "—",
          "ID Proof":             d.documents?.id_proof || "—",
          "Exp. Certificate":     d.documents?.experience_certificate || "—",

          // ── Timestamps
          "Joined":               formatDate(d.created_at),
          "Last Updated":         formatDate(d.updated_at),
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Dietitians");

        ws["!cols"] = [
          { wch: 5  }, { wch: 22 }, { wch: 28 }, { wch: 18 },
          { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
          { wch: 14 }, { wch: 18 }, { wch: 26 }, { wch: 20 },
          { wch: 24 }, { wch: 40 }, { wch: 36 }, { wch: 36 },
          { wch: 50 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
          { wch: 40 }, { wch: 40 }, { wch: 40 }, { wch: 40 },
          { wch: 40 }, { wch: 14 }, { wch: 14 },
        ];

        const dateStr = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(wb, `dietitians_export_${dateStr}.xlsx`);
        toast.success(`Exported ${rows.length} dietitians to Excel.`);
      })
      .catch(() => toast.error("Export failed. Please try again."))
      .finally(() => setIsExporting(false));
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

  const clearDateRange = () => { setStartDate(""); setEndDate(""); setCurrentPage(1); };
  const hasDateFilter = startDate || endDate;

  // ── Register Dietitian handlers ──────────────────────────────────────────
  const setRF = (field, value) => {
    setRegisterForm((prev) => ({ ...prev, [field]: value }));
    if (registerErrors[field]) setRegisterErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const setRFFile = (field, file) => {
    setRegisterForm((prev) => ({ ...prev, [field]: file }));
    if (registerErrors[field]) setRegisterErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const addTag = (field, val) => {
    if (!val) return;
    setRegisterForm((prev) => ({ ...prev, [field]: [...prev[field], val] }));
  };
  const removeTag = (field, idx) => {
    setRegisterForm((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== idx) }));
  };

  const handleStateChange = (stateName) => {
    setRF("state", stateName);
    setRF("city", "");
    setCities([]);
    if (!stateName) return;
    setCitiesLoading(true);
    fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: "India", state: stateName }),
    })
      .then((r) => r.json())
      .then((res) => { if (!res.error) setCities(res.data ?? []); })
      .catch(() => toast.error("Could not load cities. Please try again."))
      .finally(() => setCitiesLoading(false));
  };

  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      if (!registerForm.fullName.trim()) errs.fullName = "Required";
      if (!registerForm.phone.trim()) errs.phone = "Required";
      else if (!/^\d{10}$/.test(registerForm.phone.trim())) errs.phone = "Enter a valid 10-digit number";
      if (!registerForm.email.trim()) errs.email = "Required";
      else if (!/\S+@\S+\.\S+/.test(registerForm.email)) errs.email = "Invalid email";
      if (!registerForm.state.trim()) errs.state = "Required";
      if (!registerForm.city.trim()) errs.city = "Required";
      if (!registerForm.password) errs.password = "Required";
      else if (registerForm.password.length < 8) errs.password = "Minimum 8 characters";
    }
    if (step === 2) {
      if (!registerForm.highestDegree) errs.highestDegree = "Required";
      if (!registerForm.registrationNumber.trim()) errs.registrationNumber = "Required";
      if (!registerForm.experience) errs.experience = "Select an experience level";
    }
    // Step 3 documents are all optional from the admin side
    return errs;
  };

  const handleRegisterNext = () => {
    const errs = validateStep(registerStep);
    if (Object.keys(errs).length) { setRegisterErrors(errs); return; }
    setRegisterErrors({});
    setRegisterStep((s) => s + 1);
  };

  const handleRegisterBack = () => {
    setRegisterErrors({});
    setShowPassword(false);
    setRegisterStep((s) => s - 1);
  };

  const handleRegisterSubmit = async () => {
    const errs = validateStep(3);
    if (Object.keys(errs).length) { setRegisterErrors(errs); return; }

    setRegistering(true);
    try {
      setRegisteringMsg("Uploading documents…");
      const urls = await uploadDocuments({
        profilePhoto: registerForm.profilePhoto,
        degreeCert:   registerForm.degreeCertificate,
        regCert:      registerForm.registrationCertificate || null,
        idProof:      registerForm.idProof,
      });

      setRegisteringMsg("Registering dietitian…");
      const payload = {
        fullName:           registerForm.fullName.trim(),
        phone:              registerForm.phone.trim(),
        email:              registerForm.email.trim(),
        password:           registerForm.password,
        state:              registerForm.state,
        city:               registerForm.city,
        experience:         registerForm.experience,
        registrationNumber: registerForm.registrationNumber.trim(),
        degrees:            [{ degree: registerForm.highestDegree }],
        specialization:     registerForm.specialization,
        documents: {
          profilePhoto:             urls.profilePhoto,
          degreeCertificate:        urls.degreeCert,
          registrationCertificate:  urls.regCert,
          idProof:                  urls.idProof,
        },
      };

      const res = await API.apiPost("registerDietitian", payload);
      toast.success(res?.data?.message || "Dietitian registered successfully.");
      setShowRegister(false);
      setRegisterForm(EMPTY_REGISTER);
      setRegisterErrors({});
      setRegisterStep(1);
      setShowPassword(false);
      setCities([]);
      fetchDietitians();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Registration failed.");
    } finally {
      setRegistering(false);
      setRegisteringMsg("");
    }
  };
  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current   && !sortRef.current.contains(e.target))   setShowSortDropdown(false);
      if (dateRef.current   && !dateRef.current.contains(e.target))   setShowDatePicker(false);
      if (statusRef.current && !statusRef.current.contains(e.target)) setShowStatusDropdown(false);
    };
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
  const columns = ["#", "Dietitian", "Contact", "Location", "Specialization", "Experience", "Access Type", "Active", "Actions"];

  const ACCESS_TYPE_COLORS = {
    pending: { bg: "#FFF8E1", color: "#F59E0B", dot: "#F59E0B" },
    trial: { bg: "#ECFDF5", color: "#10B981", dot: "#10B981" },
    expired: { bg: "#FEF2F2", color: "#EF4444", dot: "#EF4444" },
    paid: { bg: "#EFF6FF", color: "#3B82F6", dot: "#3B82F6" },
  };

  return (
    <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>

        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <svg style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <FormControl
            type="text"
            placeholder="Search by name, email, city, specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ height: "42px", borderRadius: "10px", border: "1px solid #e5e5e5", paddingLeft: "40px", fontSize: "13px", boxShadow: "none" }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ position: "relative" }} ref={statusRef}>
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            style={{ height: "42px", border: `1px solid ${statusFilter ? "#f59e0b" : "#e5e5e5"}`, borderRadius: "10px", padding: "0 14px", background: statusFilter ? "#fffbeb" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", minWidth: "140px", fontWeight: 600, fontSize: "13px", color: statusFilter ? "#d97706" : "#555" }}
          >
            <FaFilter style={{ fontSize: "12px", color: statusFilter ? "#d97706" : "#aaa" }} />
            {statusFilter === "active" ? "Active" : statusFilter === "blocked" ? "Blocked" : "All Status"}
            {statusFilter
              ? <MdClose style={{ marginLeft: "auto", fontSize: "14px", color: "#d97706" }} onClick={(e) => { e.stopPropagation(); setStatusFilter(""); setCurrentPage(1); }} />
              : <FaChevronDown style={{ marginLeft: "auto", fontSize: "11px", color: "#aaa" }} />
            }
          </button>
          {showStatusDropdown && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#fff", border: "1px solid #edf1ee", borderRadius: "12px", minWidth: "155px", zIndex: 1000, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: "6px" }}>
              {[
                { key: "",        label: "All Status", dot: "#6b7280" },
                { key: "active",  label: "Active",     dot: "#16a34a" },
                { key: "blocked", label: "Blocked",    dot: "#ef4444" },
              ].map(({ key, label, dot }) => (
                <div key={key} onClick={() => { setStatusFilter(key); setShowStatusDropdown(false); setCurrentPage(1); }}
                  style={{ padding: "9px 14px", cursor: "pointer", borderRadius: "8px", fontSize: "13px", fontWeight: statusFilter === key ? 700 : 500, color: statusFilter === key ? "#d97706" : "#444", background: statusFilter === key ? "#fffbeb" : "transparent", display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: dot, flexShrink: 0 }} />
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Date Range */}
        <div style={{ position: "relative" }} ref={dateRef}>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            style={{ height: "42px", border: `1px solid ${hasDateFilter ? "#6366f1" : "#e5e5e5"}`, borderRadius: "10px", padding: "0 14px", background: hasDateFilter ? "#f5f3ff" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", fontWeight: 600, fontSize: "13px", color: hasDateFilter ? "#6366f1" : "#555" }}
          >
            <FaCalendarAlt style={{ color: hasDateFilter ? "#6366f1" : "#aaa", fontSize: "13px" }} />
            {hasDateFilter ? `${startDate || "—"} → ${endDate || "—"}` : "Date Range"}
            {hasDateFilter
              ? <MdClose style={{ marginLeft: "4px", color: "#6366f1", fontSize: "14px" }} onClick={(e) => { e.stopPropagation(); clearDateRange(); }} />
              : <FaChevronDown style={{ marginLeft: "4px", fontSize: "11px", color: "#aaa" }} />
            }
          </button>
          {showDatePicker && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#fff", border: "1px solid #edf1ee", borderRadius: "12px", zIndex: 1000, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: "16px", minWidth: "280px" }}>
              <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: "13px", color: "#111827" }}>Filter by Date Range</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "4px" }}>From</label>
                  <input
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #e5e5e5", borderRadius: "8px", fontSize: "13px", color: "#111827" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "4px" }}>To</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #e5e5e5", borderRadius: "8px", fontSize: "13px", color: "#111827" }}
                  />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={clearDateRange} style={{ flex: 1, padding: "8px", border: "1px solid #e5e5e5", borderRadius: "8px", background: "#fff", fontSize: "13px", cursor: "pointer", color: "#6b7280", fontWeight: 600 }}>Clear</button>
                  <button onClick={() => setShowDatePicker(false)} style={{ flex: 1, padding: "8px", border: "none", borderRadius: "8px", background: "#6366f1", fontSize: "13px", cursor: "pointer", color: "#fff", fontWeight: 600 }}>Apply</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sort */}
        <div style={{ position: "relative" }} ref={sortRef}>
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            style={{ height: "42px", border: `1px solid ${sortType ? "#1E8E3E" : "#e5e5e5"}`, borderRadius: "10px", padding: "0 14px", background: sortType ? "#f0f9f3" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", minWidth: "140px", fontWeight: 600, fontSize: "13px", color: sortType ? "#1E8E3E" : "#555" }}
          >
            <FaSort style={{ color: sortType ? "#1E8E3E" : "#aaa", fontSize: "13px" }} />
            {sortType ? `Sort: ${SORT_LABEL[sortType]}` : "Sort By"}
            <FaChevronDown style={{ marginLeft: "auto", fontSize: "11px", color: "#aaa" }} />
          </button>
          {showSortDropdown && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#fff", border: "1px solid #edf1ee", borderRadius: "12px", minWidth: "160px", zIndex: 1000, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: "6px" }}>
              {SORT_OPTIONS.map(({ key, label }) => (
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

        {/* Export Excel */}
        <button
          onClick={handleExportExcel}
          disabled={isExporting}
          style={{ height: "42px", border: "1px solid #16a34a", borderRadius: "10px", padding: "0 16px", background: isExporting ? "#f0f9f3" : "#16a34a", cursor: isExporting ? "wait" : "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "13px", color: isExporting ? "#16a34a" : "#fff", whiteSpace: "nowrap", transition: "all 0.2s" }}
        >
          <FaFileExcel style={{ fontSize: "15px" }} />
          {isExporting ? "Exporting..." : "Export Excel"}
        </button>

        {/* Register Dietitian — only on management view */}
        {!showVerify && (
          <button
            onClick={() => { setShowRegister(true); setRegisterForm(EMPTY_REGISTER); setRegisterErrors({}); setRegisterStep(1); setShowPassword(false); setCities([]); setCitiesLoading(false); }}
            style={{ height: "42px", border: "none", borderRadius: "10px", padding: "0 18px", background: "linear-gradient(135deg, #1E8E3E, #16a34a)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "13px", color: "#fff", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(30,142,62,0.3)", transition: "all 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <FaUserPlus style={{ fontSize: "15px" }} />
            Register Dietitian
          </button>
        )}
      </div>

      {/* Active filters strip */}
      {(hasDateFilter || sortType || statusFilter) && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 600 }}>Active filters:</span>
          {statusFilter && (
            <span style={{ background: "#fffbeb", color: "#d97706", borderRadius: "20px", padding: "3px 10px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: statusFilter === "active" ? "#16a34a" : "#ef4444" }} />
              {statusFilter === "active" ? "Active" : "Blocked"}
              <MdClose style={{ cursor: "pointer", fontSize: "13px" }} onClick={() => { setStatusFilter(""); setCurrentPage(1); }} />
            </span>
          )}
          {hasDateFilter && (
            <span style={{ background: "#f5f3ff", color: "#6366f1", borderRadius: "20px", padding: "3px 10px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
              {startDate || "—"} → {endDate || "—"}
              <MdClose style={{ cursor: "pointer", fontSize: "13px" }} onClick={clearDateRange} />
            </span>
          )}
          {sortType && (
            <span style={{ background: "#f0f9f3", color: "#1E8E3E", borderRadius: "20px", padding: "3px 10px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
              {SORT_LABEL[sortType]}
              <MdClose style={{ cursor: "pointer", fontSize: "13px" }} onClick={() => setSortType("")} />
            </span>
          )}
        </div>
      )}

      {/* ── Table ── */}
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
                    const colWidths = { "#": "48px", "Dietitian": "180px", "Contact": "220px", "Location": "140px", "Specialization": "140px", "Experience": "110px", "Access Type": "110px", "Active": "90px", "Actions": "150px" };
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
                      <td style={{ padding: "10px 14px", fontSize: "13px", fontWeight: 700, color: "#1E8E3E", verticalAlign: "middle", width: "48px", maxWidth: "48px" }}>
                        {(pagination.page - 1) * pagination.limit + i + 1}
                      </td>

                      {/* Dietitian — avatar + name + joined */}
                      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {(d.avatar_url || d.documents?.profile_photo) ? (
                            <img src={d.avatar_url || d.documents?.profile_photo} alt={d.full_name} referrerPolicy="no-referrer" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid #edf1ee", flexShrink: 0 }} />
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

                      {/* Contact — email (top) + phone (bottom) */}
                      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <span style={{ fontSize: "12px", color: "#3b82f6", fontWeight: 500, wordBreak: "break-all" }}>{d.email || "—"}</span>
                          <span style={{ fontSize: "12px", color: "#555", whiteSpace: "nowrap" }}>{d.phone_number ? `${d.phone_code || ""} ${d.phone_number}`.trim() : "—"}</span>
                        </div>
                      </td>

                      {/* Location */}
                      <td style={{ padding: "10px 14px", fontSize: "12px", color: "#555", verticalAlign: "middle", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={[d.city, d.state].filter(Boolean).join(", ")}>{[d.city, d.state].filter(Boolean).join(", ") || "—"}</td>

                      {/* Specialization */}
                      <td style={{ padding: "10px 14px", verticalAlign: "middle", overflow: "hidden" }}>
                        {(() => {
                          const specs = toList(d.specialization);
                          if (!specs.length) return <span style={{ color: "#aaa", fontSize: "11px" }}>N/A</span>;
                          return (
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }} title={specs.join(", ")}>
                              <span style={{ background: "#f0faf8", color: "#0d9488", border: "1px solid rgba(13,148,136,0.2)", borderRadius: "20px", padding: "3px 9px", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100px" }}>{specs[0]}</span>
                              {specs.length > 1 && (
                                <span style={{ background: "#f1f5f9", color: "#64748b", borderRadius: "20px", padding: "3px 8px", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>+{specs.length - 1}</span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Experience */}
                      <td style={{ padding: "10px 14px", fontSize: "11px", color: "#666", verticalAlign: "middle", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={d.experience || ""}>{d.experience || "—"}</td>

                      {/* Access Type */}
                      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                        {(() => {
                          const accessType = d.access_type || "pending";
                          const style = ACCESS_TYPE_COLORS[accessType] || ACCESS_TYPE_COLORS.pending;
                          const label = accessType.charAt(0).toUpperCase() + accessType.slice(1);
                          return (
                            <span style={{ background: style.bg, color: style.color, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: style.dot }} />
                              {label}
                            </span>
                          );
                        })()}
                      </td>

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
                              onClick={() => handleVerifyDirect(d)}
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
          <p style={{ fontSize: "14px", color: "#999" }}>
            {debouncedSearch
              ? `No results for "${debouncedSearch}"`
              : statusFilter === "active"
              ? "No active dietitians found."
              : statusFilter === "blocked"
              ? "No blocked dietitians found."
              : hasDateFilter
              ? "No dietitians found in the selected date range."
              : emptyLabel}
          </p>
        </div>
      )}

      {/* ── Register Dietitian Modal ── */}
      <Modal show={showRegister} onHide={() => { if (!registering) { setShowRegister(false); setRegisterStep(1); setRegisterErrors({}); } }} size="lg" centered scrollable>
        <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #1E8E3E, #16a34a)", color: "#fff", borderBottom: "none", padding: "1.25rem 1.75rem" }}>
          <Modal.Title style={{ fontWeight: 700, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <FaUserPlus /> Register New Dietitian
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: "#f8f9fa", padding: "1.5rem 1.75rem", maxHeight: "72vh", overflowY: "auto" }}>

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "28px" }}>
            {["Basic Info", "Professional", "Documents"].map((label, i) => {
              const n = i + 1;
              const done = n < registerStep;
              const active = n === registerStep;
              return (
                <div key={n} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : undefined }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "13px", background: done || active ? "#1E8E3E" : "#e5e5e5", color: done || active ? "#fff" : "#9ca3af", boxShadow: active ? "0 0 0 4px rgba(30,142,62,0.15)" : "none", transition: "all 0.2s" }}>
                      {done ? "\u2713" : n}
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: active ? 700 : 500, color: active ? "#1E8E3E" : done ? "#374151" : "#9ca3af", marginTop: "5px", whiteSpace: "nowrap" }}>{label}</span>
                  </div>
                  {i < 2 && <div style={{ flex: 1, height: "2px", background: done ? "#1E8E3E" : "#e5e5e5", margin: "0 8px", marginBottom: "16px", transition: "background 0.3s" }} />}
                </div>
              );
            })}
          </div>

          {/* Shared field styles */}
          {(() => {
            const IS = (err) => ({ width: "100%", padding: "9px 12px", border: `1px solid ${err ? "#ef4444" : "#e5e5e5"}`, borderRadius: "8px", fontSize: "13px", outline: "none", background: "#fff", color: "#111827" });
            const LS = { fontSize: "11px", color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "4px" };
            const ES = { fontSize: "11px", color: "#ef4444", marginTop: "3px", marginBottom: 0 };
            const SC = { background: "#fff", borderRadius: "14px", padding: "22px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" };
            const SH = (t) => <h6 style={{ fontWeight: 700, color: "#1E8E3E", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid #edf1ee" }}>{t}</h6>;

            return (
              <>
                {/* ── STEP 1: Basic Information ── */}
                {registerStep === 1 && (
                  <div style={SC}>
                    {SH("Step 1 — Basic Information")}
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label style={LS}>Full Name *</label>
                        <input style={IS(registerErrors.fullName)} value={registerForm.fullName} onChange={(e) => setRF("fullName", e.target.value)} placeholder="Dr. Priya Sharma" />
                        {registerErrors.fullName && <p style={ES}>{registerErrors.fullName}</p>}
                      </div>
                      <div className="col-md-6">
                        <label style={LS}>Mobile Number *</label>
                        <input type="tel" style={IS(registerErrors.phone)} value={registerForm.phone} onChange={(e) => setRF("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" maxLength={10} />
                        {registerErrors.phone && <p style={ES}>{registerErrors.phone}</p>}
                      </div>
                      <div className="col-md-6">
                        <label style={LS}>Email Address *</label>
                        <input type="email" style={IS(registerErrors.email)} value={registerForm.email} onChange={(e) => setRF("email", e.target.value)} placeholder="priya@example.com" />
                        {registerErrors.email && <p style={ES}>{registerErrors.email}</p>}
                      </div>
                      <div className="col-md-6">
                        <label style={LS}>Password * <span style={{ fontSize: "10px", color: "#9ca3af", textTransform: "none", letterSpacing: 0 }}>(min 8 characters)</span></label>
                        <div style={{ position: "relative" }}>
                          <input
                            type={showPassword ? "text" : "password"}
                            style={{ ...IS(registerErrors.password), paddingRight: "40px" }}
                            value={registerForm.password}
                            onChange={(e) => setRF("password", e.target.value)}
                            placeholder="Min. 8 characters"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#9ca3af", display: "flex", alignItems: "center" }}
                            tabIndex={-1}
                          >
                            {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                          </button>
                        </div>
                        {registerErrors.password && <p style={ES}>{registerErrors.password}</p>}
                      </div>
                      <div className="col-md-6">
                        <label style={LS}>State *</label>
                        <SearchableSelect
                          options={IN_STATES.map((s) => s.name)}
                          value={registerForm.state}
                          onChange={handleStateChange}
                          placeholder="Select a state"
                          error={registerErrors.state}
                        />
                        {registerErrors.state && <p style={ES}>{registerErrors.state}</p>}
                      </div>
                      <div className="col-md-6">
                        <label style={LS}>City *</label>
                        <SearchableSelect
                          options={cities}
                          value={registerForm.city}
                          onChange={(v) => setRF("city", v)}
                          placeholder={citiesLoading ? "Loading cities…" : registerForm.state ? "Select a city" : "Select a state first"}
                          disabled={!registerForm.state || citiesLoading}
                          loading={citiesLoading}
                          error={registerErrors.city}
                        />
                        {registerErrors.city && <p style={ES}>{registerErrors.city}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Professional Details ── */}
                {registerStep === 2 && (
                  <div style={SC}>
                    {SH("Step 2 — Professional Details")}
                    <div className="row g-3">
                      <div className="col-md-12">
                        <label style={LS}>Highest Degree *</label>
                        <SearchableSelect
                          options={DEGREE_GROUPS.flatMap(({ options }) => options)}
                          value={registerForm.highestDegree}
                          onChange={(v) => setRF("highestDegree", v)}
                          placeholder="Select a degree"
                          error={registerErrors.highestDegree}
                        />
                        {registerErrors.highestDegree && <p style={ES}>{registerErrors.highestDegree}</p>}
                      </div>
                      <div className="col-md-12">
                        <label style={LS}>Registration Number * <span style={{ fontSize: "10px", color: "#9ca3af", textTransform: "none", letterSpacing: 0 }}>(enter "N/A" if not applicable)</span></label>
                        <input style={IS(registerErrors.registrationNumber)} value={registerForm.registrationNumber} onChange={(e) => setRF("registrationNumber", e.target.value)} placeholder="MH-DT-12345  or  N/A" />
                        {registerErrors.registrationNumber && <p style={ES}>{registerErrors.registrationNumber}</p>}
                      </div>
                      <div className="col-md-12">
                        <label style={LS}>Experience *</label>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "2px" }}>
                          {EXPERIENCE_CHIPS.map(({ label, value }) => {
                            const active = registerForm.experience === value;
                            return (
                              <button key={value} type="button" onClick={() => setRF("experience", value)}
                                style={{ padding: "8px 20px", borderRadius: "24px", border: `1.5px solid ${active ? "#1E8E3E" : registerErrors.experience ? "#ef4444" : "#e5e5e5"}`, background: active ? "#1E8E3E" : "#fff", color: active ? "#fff" : "#555", fontWeight: active ? 700 : 500, fontSize: "13px", cursor: "pointer", transition: "all 0.2s" }}>
                                {label}
                              </button>
                            );
                          })}
                        </div>
                        {registerErrors.experience && <p style={ES}>{registerErrors.experience}</p>}
                      </div>
                      <div className="col-md-12">
                        <label style={LS}>
                          Specializations{" "}
                          <span style={{ fontSize: "10px", color: "#9ca3af", textTransform: "none", letterSpacing: 0 }}>
                            (optional · up to 8)
                          </span>
                        </label>
                        <SpecializationInput
                          selected={registerForm.specialization}
                          onChange={(v) => setRF("specialization", v)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: Document Upload ── */}
                {registerStep === 3 && (
                  <div style={SC}>
                    {SH("Step 3 — Document Upload")}
                    <div className="row g-3">
                      <div className="col-md-12">
                        <label style={LS}>Profile Photo <span style={{ fontSize: "10px", color: "#9ca3af", textTransform: "none", letterSpacing: 0 }}>optional • JPG / PNG • Max 2MB</span></label>
                        <FileUpload label="Profile Photo" accept={["image/jpeg", "image/png"]} maxSizeMB={2} value={registerForm.profilePhoto} onChange={(f) => setRFFile("profilePhoto", f)} error={null} />
                      </div>
                      <div className="col-md-12">
                        <label style={LS}>Degree Certificate <span style={{ fontSize: "10px", color: "#9ca3af", textTransform: "none", letterSpacing: 0 }}>optional • JPG / PNG / PDF • Max 5MB</span></label>
                        <FileUpload label="Degree Certificate" accept={["image/jpeg", "image/png", "application/pdf"]} maxSizeMB={5} value={registerForm.degreeCertificate} onChange={(f) => setRFFile("degreeCertificate", f)} error={null} />
                      </div>
                      <div className="col-md-12">
                        <label style={LS}>ID Proof <span style={{ fontSize: "10px", color: "#9ca3af", textTransform: "none", letterSpacing: 0 }}>optional • JPG / PNG / PDF • Max 5MB</span></label>
                        <FileUpload label="ID Proof" accept={["image/jpeg", "image/png", "application/pdf"]} maxSizeMB={5} value={registerForm.idProof} onChange={(f) => setRFFile("idProof", f)} error={null} />
                      </div>
                      <div className="col-md-12">
                        <label style={LS}>Registration Certificate <span style={{ fontSize: "10px", color: "#9ca3af", textTransform: "none", letterSpacing: 0 }}>optional • JPG / PNG / PDF • Max 5MB</span></label>
                        <FileUpload label="Registration Certificate" accept={["image/jpeg", "image/png", "application/pdf"]} maxSizeMB={5} value={registerForm.registrationCertificate} onChange={(f) => setRFFile("registrationCertificate", f)} error={null} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </Modal.Body>
        <Modal.Footer style={{ background: "#f8f9fa", borderTop: "1px solid #edf1ee", padding: "1rem 1.75rem", gap: "10px", justifyContent: "space-between" }}>
          <div>
            {registerStep > 1 && (
              <Button variant="outline-secondary" onClick={handleRegisterBack} disabled={registering} style={{ borderRadius: "8px", padding: "8px 20px", fontWeight: 600 }}>
                ← Back
              </Button>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Button variant="outline-secondary" onClick={() => { setShowRegister(false); setRegisterStep(1); setRegisterErrors({}); }} disabled={registering} style={{ borderRadius: "8px", padding: "8px 20px", fontWeight: 600 }}>Cancel</Button>
            {registerStep < 3 ? (
              <Button onClick={handleRegisterNext} style={{ background: "linear-gradient(135deg, #1E8E3E, #16a34a)", border: "none", borderRadius: "8px", padding: "8px 24px", fontWeight: 700 }}>
                Next →
              </Button>
            ) : (
              <Button onClick={handleRegisterSubmit} disabled={registering} style={{ background: "linear-gradient(135deg, #1E8E3E, #16a34a)", border: "none", borderRadius: "8px", padding: "8px 24px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", minWidth: "200px", justifyContent: "center" }}>
                {registering ? (
                  <>{registeringMsg || "Processing…"}</>
                ) : (
                  <><FaUserPlus /> Register Dietitian</>
                )}
              </Button>
            )}
          </div>
        </Modal.Footer>
      </Modal>
      {/* ── Delete Confirmation Modal ── */}
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

      {/* ── Detail Modal ── */}
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
                  {(d.avatar_url || d.documents?.profile_photo) ? (
                    <img src={d.avatar_url || d.documents?.profile_photo} alt={d.full_name} referrerPolicy="no-referrer" style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", border: "3px solid #edf1ee" }} />
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
                      { label: "Gender", value: d.gender },
                      { label: "Date of Birth", value: d.date_of_birth ? formatDate(d.date_of_birth) : null },
                      { label: "City", value: d.city },
                      { label: "State", value: d.state },
                      { label: "Specialization", value: toList(d.specialization).join(", ") },
                      { label: "Experience", value: d.experience },
                      { label: "Registration No.", value: d.registration_number },
                      { label: "Online", value: d.is_online ? "Online" : "Offline" },
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
                  {d.bio && (
                    <div style={{ background: "#fafcfa", borderRadius: "10px", padding: "10px 14px", marginTop: "12px" }}>
                      <small style={{ color: "#aaa", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Bio</small>
                      <p style={{ margin: 0, fontWeight: 500, color: "#374151", fontSize: "13px", marginTop: "2px" }}>{d.bio}</p>
                    </div>
                  )}
                </div>

                {/* Skills & Services */}
                {(toList(d.specialization).length > 0 || toList(d.languages).length > 0 || toList(d.services).length > 0) && (
                  <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <h6 style={{ fontWeight: 700, color: "#1E8E3E", marginBottom: "14px", paddingBottom: "8px", borderBottom: "1px solid #edf1ee" }}>Skills & Services</h6>
                    {[
                      { label: "Specialization", items: toList(d.specialization), color: "#0d9488", bg: "#f0faf8", border: "rgba(13,148,136,0.2)" },
                      { label: "Languages", items: toList(d.languages), color: "#7c3aed", bg: "#f5f3ff", border: "rgba(124,58,237,0.2)" },
                      { label: "Services", items: toList(d.services), color: "#2563eb", bg: "#eff6ff", border: "rgba(37,99,235,0.2)" },
                    ].map(({ label, items, color, bg, border }) => (
                      <div key={label} style={{ marginBottom: "12px" }}>
                        <small style={{ color: "#aaa", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</small>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "5px" }}>
                          {items.length ? items.map((it, idx) => (
                            <span key={idx} style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: "20px", padding: "3px 11px", fontSize: "12px", fontWeight: 600 }}>{it}</span>
                          )) : <span style={{ color: "#bbb", fontSize: "12px" }}>None</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Degrees & Awards */}
                {(toList(d.degrees).length > 0 || toList(d.awards).length > 0) && (
                  <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <h6 style={{ fontWeight: 700, color: "#1E8E3E", marginBottom: "14px", paddingBottom: "8px", borderBottom: "1px solid #edf1ee" }}>Education & Awards</h6>
                    {toList(d.degrees).length > 0 && (
                      <div style={{ marginBottom: toList(d.awards).length ? "14px" : 0 }}>
                        <small style={{ color: "#aaa", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Degrees</small>
                        {toList(d.degrees).map((deg, idx) => (
                          <div key={idx} style={{ background: "#fafcfa", borderRadius: "10px", padding: "10px 14px", marginTop: "6px" }}>
                            <p style={{ margin: 0, fontWeight: 700, color: "#111827", fontSize: "13px" }}>{deg.degree || "N/A"}</p>
                            <p style={{ margin: "2px 0 0", color: "#888", fontSize: "12px" }}>
                              {[deg.institute, deg.year].filter(Boolean).join(" • ") || "—"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    {toList(d.awards).length > 0 && (
                      <div>
                        <small style={{ color: "#aaa", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Awards</small>
                        {toList(d.awards).map((aw, idx) => (
                          <div key={idx} style={{ background: "#fafcfa", borderRadius: "10px", padding: "10px 14px", marginTop: "6px" }}>
                            <p style={{ margin: 0, fontWeight: 700, color: "#111827", fontSize: "13px" }}>🏆 {aw.title || "N/A"}</p>
                            <p style={{ margin: "2px 0 0", color: "#888", fontSize: "12px" }}>
                              {[aw.organization, aw.year].filter(Boolean).join(" • ") || "—"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Availability */}
                {d.availability && Object.keys(d.availability).length > 0 && (
                  <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <h6 style={{ fontWeight: 700, color: "#1E8E3E", marginBottom: "14px", paddingBottom: "8px", borderBottom: "1px solid #edf1ee" }}>Availability</h6>
                    <div className="row g-2">
                      {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((day) => {
                        const slots = d.availability[day];
                        return (
                          <div className="col-md-6" key={day}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fafcfa", borderRadius: "10px", padding: "8px 12px" }}>
                              <span style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: 700, color: "#1E8E3E", minWidth: "34px" }}>{day}</span>
                              <span style={{ fontSize: "12px", color: slots?.length ? "#374151" : "#bbb", fontWeight: 500 }}>
                                {slots?.length ? slots.join(", ") : "Unavailable"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Documents */}
                <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <h6 style={{ fontWeight: 700, color: "#1E8E3E", marginBottom: "14px", paddingBottom: "8px", borderBottom: "1px solid #edf1ee" }}>Uploaded Documents</h6>
                  <div className="row g-3">
                    {[
                      { label: "Profile Photo", url: d.documents?.profile_photo },
                      { label: "Degree Certificate", url: d.documents?.degree_certificate },
                      { label: "Registration Certificate", url: d.documents?.registration_certificate },
                      { label: "ID Proof", url: d.documents?.id_proof },
                      { label: "Experience Certificate", url: d.documents?.experience_certificate },
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
