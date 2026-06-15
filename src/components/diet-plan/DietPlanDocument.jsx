/*
 * DietPlanDocument — full branded recreation of the MeriDiet 12-page diet plan PDF.
 * Each top-level `.dp-page` is an A4 sheet (794 x 1123 px @ 96dpi) so it maps 1:1 to a
 * PDF page when captured with html2canvas. Data-driven pages read from the `/preview`
 * API payload; marketing pages (progress tracker, supplements, dietitians) are static
 * templates that mirror the source design.
 */
import { forwardRef } from "react";
import {
  LuUserCheck, LuSalad, LuTrendingUp, LuHeartPulse, LuFlame,
  LuTarget, LuClipboardList, LuChefHat, LuLeaf, LuBadgeCheck,
} from "react-icons/lu";
import {
  FaHeart, FaCalendarAlt, FaHandHoldingHeart, FaEnvelope, FaPhoneAlt, FaGlobe,
  FaUser, FaHeartbeat, FaBullseye, FaRunning, FaNotesMedical, FaUtensils, FaRegStickyNote,
  FaBirthdayCake, FaVenusMars, FaRulerVertical, FaMapMarkerAlt, FaWeight, FaCalculator,
  FaChartPie, FaFireAlt, FaBolt, FaStethoscope, FaClipboardList, FaDumbbell, FaQuoteLeft, FaPencilAlt,
  FaBriefcase, FaSmoking, FaPills, FaCapsules, FaExclamationTriangle, FaBan, FaPepperHot, FaQuoteRight,
  FaClock, FaTint, FaWalking, FaMoon,
  FaCheckCircle, FaInfoCircle, FaHome, FaExchangeAlt, FaChartLine, FaAppleAlt, FaUtensilSpoon, FaSun,
  FaBreadSlice, FaCheese, FaSeedling, FaTimesCircle, FaLongArrowAltRight,
  FaLightbulb, FaCheck, FaBalanceScale, FaCarrot, FaListOl,
  FaChartBar, FaTrophy, FaRulerCombined, FaStar, FaCamera, FaSmile, FaBrain,
  FaRuler, FaCircleNotch, FaTshirt, FaHandRock,
  FaHeadset, FaUserMd, FaHandshake, FaRobot, FaVideo, FaUsers, FaArrowRight,
} from "react-icons/fa";

const PAGE_W = 794;
const PAGE_H = 1123;

const C = {
  brand: "#1E8E3E",
  dark: "#14532d",
  banner: "#15532a",
  gold: "#C7A14A",
  ink: "#1f2937",
  sub: "#6b7280",
  faint: "#9ca3af",
  line: "#e6efe3",
  card: "#f4f8f0",
  soft: "#eef5ea",
  white: "#ffffff",
};

const FONT = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

// ── data helpers ─────────────────────────────────────────────────────────────
const humanize = (v) => {
  if (v === null || v === undefined || v === "") return "";
  return String(v).split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")} / ${String(d.getMonth() + 1).padStart(2, "0")} / ${d.getFullYear()}`;
};
const list = (v) => {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === "string" && v.trim()) return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
};
const dishes = (arr) => list(arr).map((x) => (x.food || "").replace(/\s*\([^)]*\)/g, "").trim()).filter(Boolean).join(", ");
const none = (arr) => { const l = list(arr).filter((x) => String(x).toLowerCase() !== "none"); return l.length ? l.map(humanize).join(", ") : "None"; };

// ── tiny presentational atoms ────────────────────────────────────────────────
const Leaf = ({ size = 22, color = C.brand, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
    <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
  </svg>
);

const Logo = ({ height = 46 }) => (
  <img src="/images/meridiet-logo-primary.png" alt="MeriDiet — Way to healthy life" crossOrigin="anonymous"
    style={{ height, width: "auto", display: "block" }} />
);

// Stretches text to EXACTLY `width` px with even letter tracking, by distributing
// each character with space-between. Lets two lines of different font-size be forced
// to the same width (e.g. small "YOUR PERSONALIZED" over big "DIET PLAN").
const SpreadText = ({ children, width, style }) => (
  <div style={{ display: "flex", justifyContent: "space-between", width, ...style }}>
    {String(children).split("").map((ch, i) => (
      <span key={i} style={{ whiteSpace: "pre" }}>{ch}</span>
    ))}
  </div>
);

const CaloriePill = ({ text }) => (
  <div style={{ border: `1.5px solid ${C.line}`, borderRadius: 22, padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: 8, background: C.white, fontWeight: 700, color: C.ink, fontSize: 14 }}>
    <LuFlame size={15} color={C.brand} /> {text || "Calorie Plan"}
  </div>
);

const PageHeader = ({ calorie }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
    <Logo />
    <CaloriePill text={calorie} />
  </div>
);

const PageFooter = ({ page, tagline }) => (
  <div style={{ position: "absolute", left: 30, right: 30, bottom: 20 }}>
    {tagline && (
      <div style={{ background: C.banner, borderRadius: 12, padding: "10px 20px", minHeight: 58, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center", color: C.white, marginBottom: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 17 }}>{tagline.main}</div>
        {tagline.sub && <div style={{ fontSize: 13, opacity: 0.92, marginTop: 2 }}>{tagline.sub}</div>}
      </div>
    )}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: C.sub, borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
      {/* left: email + phone on a single line */}
      <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 16 }}>
        <a href="mailto:support@meridiet.in" data-pdf-link style={{ display: "flex", alignItems: "center", gap: 5, color: C.sub, textDecoration: "none" }}><FaEnvelope size={11} color={C.brand} /> support@meridiet.in</a>
        <a href="tel:+919609606009" data-pdf-link style={{ display: "flex", alignItems: "center", gap: 5, color: C.sub, textDecoration: "none" }}><FaPhoneAlt size={11} color={C.brand} /> +91 960 960 6009</a>
      </span>
      {/* center: page number (clean centered numeral) */}
      <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, letterSpacing: 2, color: C.sub }}>{String(page).padStart(2, "0")}</span>
      {/* right: clickable website */}
      <span style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
        <a href="https://www.meridiet.com" target="_blank" rel="noreferrer" data-pdf-link style={{ display: "flex", alignItems: "center", gap: 5, color: C.brand, fontWeight: 700, textDecoration: "none" }}><FaGlobe size={11} /> www.meridiet.com</a>
      </span>
    </div>
  </div>
);

const Page = forwardRef(({ children, bg = C.white, pad = 30 }, ref) => (
  <div className="dp-page" ref={ref}
    style={{ width: PAGE_W, height: PAGE_H, background: bg, position: "relative", overflow: "hidden", fontFamily: FONT, color: C.ink, boxSizing: "border-box", padding: pad, margin: "0 auto 24px", boxShadow: "0 6px 24px rgba(0,0,0,0.12)" }}>
    {children}
  </div>
));
Page.displayName = "Page";

const Title = ({ pre, accent, size = 34, nowrap }) => (
  <div style={{ margin: "16px 0 4px", fontSize: size, fontWeight: 800, color: C.dark, letterSpacing: -0.5, lineHeight: 1.1, whiteSpace: nowrap ? "nowrap" : undefined }}>
    {pre} {accent && <span style={{ color: C.brand }}>{accent}</span>}
  </div>
);

const SectionCard = ({ icon, title, children, style }) => (
  <div style={{ background: C.card, borderRadius: 14, padding: "11px 14px", ...style }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 16, display: "flex", alignItems: "center" }}>{icon}</span>
      <div style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.dark, letterSpacing: 0.3, whiteSpace: "nowrap" }}>{title}</div>
    </div>
    {children}
  </div>
);

const Row = ({ icon, label, value }) => (
  <div style={{ display: "flex", alignItems: "center", fontSize: 11, padding: "4px 0", lineHeight: 1.3 }}>
    {icon && <span style={{ width: 15, display: "flex", justifyContent: "center", color: C.faint, marginRight: 8, flexShrink: 0 }}>{icon}</span>}
    <span style={{ color: C.sub, minWidth: 116, flexShrink: 0 }}>{label}</span>
    <span style={{ color: C.sub, margin: "0 5px" }}>:</span>
    <span style={{ color: C.ink, fontWeight: 600 }}>{value || "—"}</span>
  </div>
);

const Chip = ({ children, bg = C.soft, color = C.brand }) => (
  <span style={{ background: bg, color, borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 700, display: "inline-block" }}>{children}</span>
);

// ── page-2 (profile) atoms: section card with a circled icon + rows with mini icons ──
const InfoCard = ({ icon, title, children, style }) => (
  <div style={{ background: C.card, borderRadius: 14, padding: "12px 15px", ...style }}>
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8, paddingBottom: 7, borderBottom: `1px solid ${C.line}` }}>
      <span style={{ width: 19, height: 19, borderRadius: "50%", border: `1.5px solid ${C.brand}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.brand, flexShrink: 0 }}>{icon}</span>
      <div style={{ margin: 0, fontSize: 10.5, fontWeight: 800, color: C.dark, letterSpacing: 0.4, whiteSpace: "nowrap" }}>{title}</div>
    </div>
    {children}
  </div>
);

const IconRow = ({ icon, label, value }) => (
  <div style={{ display: "flex", alignItems: "center", fontSize: 11, padding: "3.5px 0", lineHeight: 1.25, whiteSpace: "nowrap" }}>
    {icon && <span style={{ width: 14, display: "flex", justifyContent: "center", color: C.faint, marginRight: 7, flexShrink: 0 }}>{icon}</span>}
    <span style={{ color: C.sub, minWidth: icon ? 90 : 104, flexShrink: 0 }}>{label}</span>
    <span style={{ color: C.sub, margin: "0 4px", flexShrink: 0 }}>:</span>
    <span style={{ color: C.ink, fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{value || "—"}</span>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// PAGE 1 — COVER
// ════════════════════════════════════════════════════════════════════════════
const CoverPage = ({ plan }) => {
  const s = plan?.summary || {};
  const p = plan?.client_profile?.personal_information || {};
  const name = humanize(s.client_name || p.full_name || "Client");
  const features = [
    { Icon: LuUserCheck, t: "Personalized for You", d: "A plan tailored to your goals, preferences & lifestyle." },
    { Icon: LuSalad, t: "Balanced Nutrition", d: "Wholesome, nourishing & sustainable meals." },
    { Icon: LuTrendingUp, t: "Visible Results", d: "Small steps today, lasting transformation tomorrow." },
    { Icon: LuHeartPulse, t: "Complete Wellness", d: "Better food, better habits, better you." },
  ];
  const bottom = [
    { Icon: LuTarget, a: "Goal-Based", b: "Approach" },
    { Icon: LuClipboardList, a: "Easy & Simple", b: "Meal Plans" },
    { Icon: LuChefHat, a: "Delicious &", b: "Indian Meals" },
    { Icon: LuLeaf, a: "Clean Ingredients", b: "Better Health" },
    { Icon: LuBadgeCheck, a: "Consistent Support", b: "Every Step" },
  ];
  return (
    <Page pad={0}>
      {/* full-page background photo (oversized & top-anchored so the PNG's empty
          bottom strip is clipped off the page; cream fallback prevents any white gap) */}
      <div style={{ position: "absolute", inset: 0, background: "#eef1e8", overflow: "hidden" }}>
        <img src="/images/cover-bowl.png" alt="" crossOrigin="anonymous"
          style={{ position: "absolute", top: 0, left: 0, width: PAGE_W, height: PAGE_H }} />
      </div>

      <div style={{ position: "relative", padding: 40 }}>
        <Logo height={120} />
        <div style={{ position: "absolute", right: 40, top: 44 }}><CaloriePill text={s.calorie_range} /></div>

        {/* both headings forced to EXACTLY the same width (420px) via SpreadText */}
        <SpreadText width={420} style={{ marginTop: 42, fontSize: 37, fontWeight: 800, color: C.dark }}>YOUR PERSONALIZED</SpreadText>
        <SpreadText width={420} style={{ marginTop: 2, fontSize: 70, fontWeight: 900, color: C.brand, lineHeight: 1.05 }}>DIET PLAN</SpreadText>
        <div style={{ display: "flex", alignItems: "center", gap: 8, width: 420, margin: "16px 0" }}>
          <div style={{ flex: 1, height: 2.5, background: C.brand, borderRadius: 2 }} />
          <Leaf size={20} color={C.brand} />
          <div style={{ flex: 1, height: 2.5, background: C.brand, borderRadius: 2 }} />
        </div>
        <p style={{ fontSize: 17, color: C.ink, lineHeight: 1.5, maxWidth: 360 }}>Designed for You.<br />Backed by Science. Driven by Results.</p>

        <div style={{ marginTop: 20, maxWidth: 380 }}>
          {features.map(({ Icon, t, d }) => (
            <div key={t} style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: C.soft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={18} color={C.brand} strokeWidth={1.7} /></div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: C.dark, lineHeight: 1.2 }}>{t}</div>
                <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.35, maxWidth: 215 }}>{d}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 8, maxWidth: 380, background: "rgba(255,255,255,0.55)", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
          <img src="/images/heart-leaf.png" alt="" crossOrigin="anonymous" style={{ width: 44, height: 44, flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: C.ink, lineHeight: 1.4 }}>This is more than a plan. It's a partnership towards a healthier, happier you. <b style={{ color: C.brand }}>Let's begin this journey together!</b></div>
        </div>

        <div style={{ fontFamily: "'Segoe Script','Brush Script MT',cursive", color: C.dark, fontSize: 24, position: "absolute", right: 46, top: 150, textAlign: "center", lineHeight: 1.3, fontStyle: "italic" }}>Good nutrition<br />isn't a diet,<br />it's a lifestyle.</div>
      </div>

      {/* bottom feature row — soft cream backdrop that fades into the photo (not a hard box) */}
      <div style={{ position: "absolute", left: 40, right: 40, bottom: 150, display: "flex", padding: "16px 10px", borderRadius: 16, background: "linear-gradient(90deg, rgba(241,241,234,0) 0%, rgba(241,241,234,0.92) 16%, rgba(241,241,234,0.92) 84%, rgba(241,241,234,0) 100%)" }}>
        {bottom.map(({ Icon, a, b }, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", padding: "0 8px", borderLeft: i ? `1px solid ${C.line}` : "none" }}>
            <div style={{ marginBottom: 7, display: "flex", justifyContent: "center" }}><Icon size={34} color={C.brand} strokeWidth={1.6} /></div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.dark, lineHeight: 1.25 }}>{a}</div>
            <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.25 }}>{b}</div>
          </div>
        ))}
      </div>

      {/* prepared-for banner */}
      <div style={{ position: "absolute", left: 40, right: 40, bottom: 44, background: C.banner, borderRadius: 12, padding: "16px 22px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.85, display: "flex", alignItems: "center", gap: 5 }}>Prepared Especially For <FaHeart size={11} /></div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{name}</div>
        </div>
        <div style={{ width: 1, height: 40, background: "rgba(255,255,255,0.3)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, opacity: 0.85, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><FaCalendarAlt size={11} /> Plan Duration</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{s.plan_duration || "—"}</div>
        </div>
        <div style={{ width: 1, height: 40, background: "rgba(255,255,255,0.3)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FaHandHoldingHeart size={26} style={{ opacity: 0.9 }} />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13, opacity: 0.9 }}>Your Health.</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Our Commitment.</div>
          </div>
        </div>
      </div>
      {/* page-1 contact footer (matches the other pages; links are clickable in the PDF) */}
      <div style={{ position: "absolute", left: 40, right: 40, bottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10.5, color: C.sub }}>
        <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 16 }}>
          <a href="mailto:support@meridiet.in" data-pdf-link style={{ display: "flex", alignItems: "center", gap: 5, color: C.sub, textDecoration: "none" }}><FaEnvelope size={10} color={C.brand} /> support@meridiet.in</a>
          <a href="tel:+919609606009" data-pdf-link style={{ display: "flex", alignItems: "center", gap: 5, color: C.sub, textDecoration: "none" }}><FaPhoneAlt size={10} color={C.brand} /> +91 960 960 6009</a>
        </span>
        <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, letterSpacing: 2, color: C.sub }}>01</span>
        <span style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          <a href="https://www.meridiet.com" target="_blank" rel="noreferrer" data-pdf-link style={{ display: "flex", alignItems: "center", gap: 5, color: C.brand, fontWeight: 700, textDecoration: "none" }}><FaGlobe size={10} /> www.meridiet.com</a>
        </span>
      </div>
    </Page>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// PAGE 2 — CLIENT PROFILE & VITALS
// ════════════════════════════════════════════════════════════════════════════
const ProfilePage = ({ plan, page }) => {
  const cp = plan?.client_profile || {};
  const p = cp.personal_information || {};
  const v = cp.current_vitals || {};
  const g = cp.health_and_fitness_goals || {};
  const lf = cp.lifestyle_overview || {};
  const md = cp.medical_information || {};
  const di = cp.dietary_information || {};
  const s = plan?.summary || {};
  return (
    <Page>
      <PageHeader calorie={s.calorie_range} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <Title pre="CLIENT PROFILE & VITALS" />
          <p style={{ fontSize: 13, color: C.sub, margin: "2px 0 0" }}>Here's a summary of the information you provided.<br />We'll use this to personalize your plan and track your progress.</p>
        </div>
      </div>
      <div style={{ position: "absolute", right: 40, top: 96, background: C.soft, borderRadius: 12, padding: "10px 16px", fontSize: 11.5, color: C.ink }}>
        <div>📅 Date of Assessment: <b>{fmtDate(p.date_of_birth ? new Date().toISOString() : null) === "—" ? "—" : fmtDate(new Date().toISOString())}</b></div>
        <div style={{ marginTop: 6 }}>Plan / Client ID: <b>QN-MD-{String(plan?.form_id || "0000").padStart(4, "0")}</b></div>
      </div>

      <div style={{ width: 60, height: 3, background: C.brand, borderRadius: 3, margin: "14px 0 16px" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <SectionCard icon={<FaUser size={14} color={C.brand} />} title="PERSONAL INFORMATION">
          <Row icon={<FaUser size={11} />} label="Full Name" value={humanize(p.full_name)} />
          <Row icon={<FaBirthdayCake size={11} />} label="Age" value={p.age ? `${p.age} Years` : null} />
          <Row icon={<FaVenusMars size={11} />} label="Gender" value={humanize(p.gender)} />
          <Row icon={<FaCalendarAlt size={11} />} label="Date of Birth" value={p.date_of_birth ? fmtDate(p.date_of_birth) : null} />
          <Row icon={<FaRulerVertical size={11} />} label="Height" value={p.height} />
          <Row icon={<FaPhoneAlt size={11} />} label="Phone Number" value={p.phone} />
          <Row icon={<FaEnvelope size={11} />} label="Email ID" value={p.email} />
          <Row icon={<FaMapMarkerAlt size={11} />} label="Address" value={[p.city, p.state].filter(Boolean).join(", ")} />
        </SectionCard>

        <SectionCard icon={<FaHeartbeat size={14} color={C.brand} />} title="CURRENT VITALS">
          <Row icon={<FaWeight size={11} />} label="Weight" value={v.weight_kg ? `${v.weight_kg} kg` : null} />
          <Row icon={<FaRulerVertical size={11} />} label="Height" value={v.height_cm ? `${v.height_cm} cm` : null} />
          <Row icon={<FaCalculator size={11} />} label="BMI" value={v.bmi != null ? `${v.bmi}` : null} />
          <Row icon={<FaChartPie size={11} />} label="BMI Category" value={v.bmi_category} />
          <Row icon={<FaFireAlt size={11} />} label="BMR" value={v.bmr_kcal ? `${v.bmr_kcal} kcal/day` : null} />
          <Row icon={<FaBolt size={11} />} label="TDEE" value={v.tdee_kcal ? `${v.tdee_kcal} kcal/day` : null} />
          <Row icon={<FaRunning size={11} />} label="Activity Level" value={humanize(lf.activity_level)} />
          <Row icon={<FaStethoscope size={11} />} label="Digestive Health" value={humanize(lf.digestive_health)} />
        </SectionCard>

        <SectionCard icon={<FaBullseye size={14} color={C.brand} />} title="HEALTH & FITNESS GOALS">
          <Row icon={<FaBullseye size={11} />} label="Primary Goal" value={list(g.goals).map(humanize).join(", ") || humanize(s.primary_goal)} />
          <Row icon={<FaClipboardList size={11} />} label="Plan Type" value={g.plan_type} />
          <Row icon={<FaFireAlt size={11} />} label="Calorie Target" value={s.calorie_range} />
          <Row icon={<FaDumbbell size={11} />} label="Protein Target" value={s.protein_target_g ? `${s.protein_target_g} g/day` : null} />
          <Row icon={<FaNotesMedical size={11} />} label="Health Notes" value={g.health_notes} />
          <Row icon={<FaRegStickyNote size={11} />} label="Final Notes" value={g.final_notes} />
        </SectionCard>

        <SectionCard icon={<FaRunning size={14} color={C.brand} />} title="LIFESTYLE OVERVIEW">
          <Row icon={<FaBriefcase size={11} />} label="Work Type" value={humanize(lf.work_type)} />
          <Row icon={<FaDumbbell size={11} />} label="Workout Type" value={humanize(lf.workout_type)} />
          <Row icon={<FaRunning size={11} />} label="Activity Level" value={humanize(lf.activity_level)} />
          <Row icon={<FaSmoking size={11} />} label="Smoke / Alcohol" value={humanize(lf.smoke_alcohol)} />
          <Row icon={<FaStethoscope size={11} />} label="Digestive Health" value={humanize(lf.digestive_health)} />
        </SectionCard>

        <SectionCard icon={<FaNotesMedical size={14} color={C.brand} />} title="MEDICAL INFORMATION">
          <Row icon={<FaNotesMedical size={11} />} label="Medical Conditions" value={none(md.medical_conditions)} />
          <Row icon={<FaHeartbeat size={11} />} label="Other Condition" value={md.other_condition} />
          <Row icon={<FaPills size={11} />} label="On Medication" value={humanize(md.on_medication)} />
          <Row icon={<FaCapsules size={11} />} label="Medications" value={md.medications} />
          <Row icon={<FaExclamationTriangle size={11} />} label="Allergies / Intolerances" value={none(md.food_allergies)} />
        </SectionCard>

        <SectionCard icon={<FaUtensils size={14} color={C.brand} />} title="DIETARY INFORMATION">
          <Row icon={<FaUtensils size={11} />} label="Diet Type" value={humanize(di.diet_type)} />
          <Row icon={<FaPepperHot size={11} />} label="Cuisine Preference" value={list(di.cuisine_preference).map(humanize).join(", ")} />
          <Row icon={<FaHeart size={11} />} label="Favorite Foods" value={di.favorite_foods} />
          <Row icon={<FaBan size={11} />} label="Foods Disliked / Avoided" value={di.foods_dislike} />
        </SectionCard>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 14, alignItems: "stretch" }}>
        <div style={{ flex: 1.9, background: C.soft, borderRadius: 14, padding: "14px 18px" }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: C.dark, marginBottom: 5, display: "flex", alignItems: "center", gap: 8 }}><FaRegStickyNote size={13} color={C.brand} /> ADDITIONAL NOTES</div>
          <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>{g.final_notes || g.health_notes || "Prefers simple, sustainable meals with Indian food options. Motivated to stay consistent and follow the plan."}</div>
        </div>
        <div style={{ flex: 1, background: C.soft, borderRadius: 14, padding: "14px 18px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", color: C.brand }}>
          <FaQuoteLeft size={15} style={{ opacity: 0.55, alignSelf: "flex-start" }} />
          <div style={{ fontFamily: "'Segoe Script',cursive", fontStyle: "italic", fontSize: 14, lineHeight: 1.4, margin: "4px 0" }}>Your health journey is unique. We're here to support you every step of the way.</div>
          <FaQuoteRight size={15} style={{ opacity: 0.55, alignSelf: "flex-end" }} />
        </div>
      </div>

      <PageFooter page={page} tagline={{ main: "Let's build a healthier, happier you!", sub: "Your goals. Our guidance. Real results." }} />
    </Page>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// PAGE 3 — HOW TO USE + PLAN OVERVIEW
// ════════════════════════════════════════════════════════════════════════════
const OverviewPage = ({ plan, page }) => {
  const s = plan?.summary || {};
  const weeks = plan?.weeks || [];
  const steps = [
    { Icon: FaClock, t: "Eat On Time", d: "Follow meal timings consistently for better energy and digestion." },
    { Icon: FaTint, t: "Stay Hydrated", d: "Drink 2.5–3L water daily throughout your transformation journey." },
    { Icon: FaWalking, t: "Stay Active", d: "Aim for 7000–10000 steps daily along with light exercise." },
    { Icon: FaMoon, t: "Sleep Well", d: "Maintain 7–8 hours of quality sleep for recovery and fat loss." },
  ];
  const weekColors = [C.brand, "#2f9e44", "#1b7a39", C.gold];
  const includes = [[FaClipboardList, "Daily meal plans"], [FaHome, "Indian home-style recipes"], [FaUtensilSpoon, "Portion guidance"], [FaFireAlt, "Calorie-aware meals"], [FaAppleAlt, "Healthy snack ideas"], [FaTint, "Hydration support"], [FaExchangeAlt, "Smart food swaps"], [FaChartLine, "Progress tracking"]];
  const notes = ["One cheat meal allowed weekly.", "Avoid processed sugar as much as possible.", "Portion sizes may vary slightly based on your needs.", "Consistency matters more than perfection.", "Listen to your body and make mindful choices."];
  return (
    <Page>
      <PageHeader calorie={s.calorie_range} />
      <Title pre="HOW TO USE" accent="THIS PLAN" />
      <p style={{ fontSize: 13, color: C.sub, margin: "2px 0 16px" }}>Simple steps to follow for the best results</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        {steps.map(({ Icon, t, d }) => (
          <div key={t} style={{ background: C.card, borderRadius: 12, padding: "13px 12px", textAlign: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.soft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}><Icon size={16} color={C.brand} /></div>
            <div style={{ fontWeight: 800, fontSize: 12.5, color: C.dark, marginBottom: 3 }}>{t}</div>
            <div style={{ fontSize: 10.5, color: C.sub, lineHeight: 1.35 }}>{d}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "14px 0 3px" }}>
        <Leaf size={18} color={C.brand} />
        <span style={{ fontSize: 22, fontWeight: 800, color: C.dark }}>{weeks.length ? `${weeks.length * 7}-DAY` : "30-DAY"} PLAN OVERVIEW</span>
        <Leaf size={18} color={C.brand} />
      </div>
      <p style={{ textAlign: "center", fontSize: 12, color: C.sub, margin: "0 0 10px" }}>A structured approach to transform your lifestyle</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(weeks.length ? weeks : [0, 1, 2, 3]).map((w, i) => {
          const wk = typeof w === "object" ? w : null;
          const fallbackTitles = ["Reset & Cleanse", "Balance & Nourish", "Strength & Sustain", "Transform & Maintain"];
          return (
            <div key={i} style={{ display: "flex", background: C.card, borderRadius: 12, overflow: "hidden", minHeight: 74 }}>
              <div style={{ width: 70, background: weekColors[i % 4], color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, opacity: 0.85 }}>WEEK</div>
                <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1 }}>{wk?.week || i + 1}</div>
              </div>
              <div style={{ flex: 1, padding: "9px 14px", display: "flex", gap: 14 }}>
                <div style={{ flex: 1.4 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: C.brand }}>{wk?.title || fallbackTitles[i]}</div>
                  <div style={{ fontSize: 10.5, color: C.sub, lineHeight: 1.35, marginTop: 2 }}>{wk?.description || "A structured week to progress your nutrition and habits."}</div>
                </div>
                <div style={{ flex: 1, borderLeft: `1px solid ${C.line}`, paddingLeft: 14 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: C.brand, marginBottom: 3 }}>FOCUS</div>
                  <ul style={{ margin: 0, paddingLeft: 14, fontSize: 10, color: C.sub, lineHeight: 1.4 }}>
                    {(list(wk?.focus).length ? list(wk?.focus) : ["Balanced meals", "Hydration", "Consistency"]).slice(0, 4).map((f, k) => <li key={k}>{f}</li>)}
                  </ul>
                </div>
                <div style={{ flex: 0.9, borderLeft: `1px solid ${C.line}`, paddingLeft: 14 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: C.gold, marginBottom: 3 }}>WHAT TO EXPECT</div>
                  <div style={{ fontSize: 10, color: C.sub, lineHeight: 1.35 }}>{wk?.what_to_expect || "Steady progress toward your goal."}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14, marginTop: 12 }}>
        <SectionCard icon={<FaCheckCircle size={14} color={C.brand} />} title="WHAT THIS PLAN INCLUDES">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 10px" }}>
            {includes.map(([Ic, label]) => <div key={label} style={{ fontSize: 11, color: C.ink, display: "flex", alignItems: "center", gap: 7 }}><Ic size={11} color={C.brand} />{label}</div>)}
          </div>
        </SectionCard>
        <SectionCard icon={<FaInfoCircle size={14} color={C.brand} />} title="IMPORTANT NOTES">
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: C.sub, lineHeight: 1.55 }}>
            {notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </SectionCard>
      </div>

      <PageFooter page={page} tagline={{ main: "Small healthy choices repeated daily create long-term transformation." }} />
    </Page>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// WEEKLY MEAL PLAN PAGE (one per week)
// ════════════════════════════════════════════════════════════════════════════
const MEALS = [
  { key: "breakfast", label: "Breakfast", Icon: FaSun },
  { key: "lunch", label: "Lunch", Icon: FaUtensils },
  { key: "snack", label: "Snack", Icon: FaAppleAlt },
  { key: "dinner", label: "Dinner", Icon: FaMoon },
];

const DayCard = ({ d }) => (
  <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.line}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
    {/* header: day number + calories */}
    <div style={{ background: C.brand, color: "#fff", padding: "5px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontWeight: 800, fontSize: 11, letterSpacing: 0.3 }}>DAY {d.day}</span>
      {d.total_kcal != null && <span style={{ fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}><FaFireAlt size={8} /> {d.total_kcal} kcal</span>}
    </div>
    {/* meals: each meal a labelled block, each food on its own line with portion */}
    <div style={{ padding: "7px 9px", flex: 1 }}>
      {MEALS.map((m) => {
        const items = list(d[m.key]);
        if (!items.length) return null;
        const time = d.meal_timing?.[m.key];
        return (
          <div key={m.key} style={{ marginBottom: 7 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 8.5, fontWeight: 800, color: C.brand, letterSpacing: 0.3, marginBottom: 2 }}>
              <m.Icon size={8} /> <span>{m.label.toUpperCase()}</span>
              {time && <span style={{ marginLeft: "auto", color: C.faint, fontWeight: 700 }}>{time}</span>}
            </div>
            {items.map((it, k) => (
              <div key={k} style={{ display: "flex", gap: 5, fontSize: 8.5, color: C.ink, lineHeight: 1.3, paddingLeft: 2 }}>
                <span style={{ color: C.brand, flexShrink: 0 }}>•</span>
                <span style={{ flex: 1 }}>{(it.food || "").replace(/\s*\([^)]*\)/g, "").trim()}{it.quantity ? <span style={{ color: C.sub }}> — {it.quantity}</span> : ""}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
    {/* footer: protein + water */}
    <div style={{ borderTop: `1px solid ${C.line}`, padding: "5px 9px", display: "flex", justifyContent: "space-between", fontSize: 9, fontWeight: 700 }}>
      {d.total_protein_g != null && <span style={{ color: C.brand, display: "flex", alignItems: "center", gap: 3 }}><FaDumbbell size={8} /> {d.total_protein_g}g protein</span>}
      {d.water_liters != null && <span style={{ color: "#2563eb", display: "flex", alignItems: "center", gap: 3 }}><FaTint size={8} /> {d.water_liters}L water</span>}
    </div>
  </div>
);

const WeekPage = ({ week, weekIndex, plan, page }) => {
  const s = plan?.summary || {};
  const days = week?.days || [];
  const startDay = days[0]?.day || weekIndex * 7 + 1;
  const endDay = days[days.length - 1]?.day || startDay + days.length - 1;
  const swaps = list(week?.smart_swaps);
  const wnotes = list(week?.weekly_notes);
  return (
    <Page>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Logo />
        <Chip bg={C.soft} color={C.brand}><span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}><FaBullseye size={11} /> Goal: {humanize(s.primary_goal)}</span></Chip>
      </div>
      <Title pre={`WEEK ${week?.week || weekIndex + 1} –`} accent="SAMPLE MEAL PLAN" />
      <p style={{ fontSize: 12.5, color: C.sub, margin: "2px 0 10px" }}>
        Days {startDay}–{endDay} structured nutrition plan{week?.title ? ` — ${week.title}.` : "."}
      </p>

      {/* daily macro targets */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[
          { Icon: FaFireAlt, label: "Calories", val: s.calorie_range ? s.calorie_range.replace("/day", "").trim() : null, color: C.gold },
          { Icon: FaDumbbell, label: "Protein", val: s.protein_target_g ? `${parseFloat(s.protein_target_g)} g` : null, color: C.brand },
          { Icon: FaBreadSlice, label: "Carbs", val: s.carbs_target_g ? `${parseFloat(s.carbs_target_g)} g` : null, color: "#d97706" },
          { Icon: FaCheese, label: "Fat", val: s.fat_target_g ? `${parseFloat(s.fat_target_g)} g` : null, color: "#dc2626" },
        ].filter((x) => x.val).map(({ Icon, label, val, color }) => (
          <div key={label} style={{ flex: 1, background: C.card, borderRadius: 10, padding: "6px 11px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 24, height: 24, borderRadius: "50%", background: C.soft, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}><Icon size={11} /></span>
            <div>
              <div style={{ fontSize: 8.5, color: C.sub, fontWeight: 700, letterSpacing: 0.3 }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: C.dark }}>{val}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 9 }}>
        {days.map((d) => <DayCard key={d.day} d={d} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
        <SectionCard icon={<FaRegStickyNote size={13} color={C.brand} />} title="WEEKLY NOTES" style={{ padding: "10px 13px" }}>
          <ul style={{ margin: 0, paddingLeft: 15, fontSize: 9.5, color: C.sub, lineHeight: 1.45 }}>
            {(wnotes.length ? wnotes : ["Drink at least 3L water daily.", "Avoid sugary drinks and deep-fried foods.", "Eat mindfully and stop when 80% full."]).map((n, i) => <li key={i}>{n}</li>)}
          </ul>
          {week?.what_to_expect && <div style={{ marginTop: 6, background: C.soft, borderRadius: 8, padding: "6px 9px", fontSize: 9.5, color: C.ink, lineHeight: 1.35 }}><b style={{ color: C.brand }}>What to expect: </b>{week.what_to_expect}</div>}
        </SectionCard>
        <SectionCard icon={<FaExchangeAlt size={13} color={C.brand} />} title="SMART SWAPS" style={{ padding: "10px 13px" }}>
          {swaps.length ? (
            <div>
              <div style={{ display: "flex", fontSize: 9, fontWeight: 800, marginBottom: 4 }}>
                <span style={{ flex: 1, color: "#c0392b" }}>INSTEAD OF</span>
                <span style={{ width: 22, flexShrink: 0 }} />
                <span style={{ flex: 1, color: C.brand }}>CHOOSE THIS</span>
              </div>
              {swaps.slice(0, 5).map((sw, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", fontSize: 9.5, padding: "3px 0", borderBottom: `1px solid ${C.line}`, lineHeight: 1.25 }}>
                  <span style={{ flex: 1, color: C.sub, display: "flex", alignItems: "center", gap: 4 }}><FaTimesCircle size={9} color="#c0392b" style={{ flexShrink: 0 }} /> {sw.instead_of}</span>
                  <FaLongArrowAltRight size={12} color={C.faint} style={{ margin: "0 5px", flexShrink: 0 }} />
                  <span style={{ flex: 1, color: C.brand, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><FaCheckCircle size={9} color={C.brand} style={{ flexShrink: 0 }} /> {sw.choose}</span>
                </div>
              ))}
            </div>
          ) : <div style={{ fontSize: 10, color: C.faint }}>No swaps listed.</div>}
        </SectionCard>
      </div>

      <PageFooter page={page} tagline={{ main: "You've got this!", sub: "Consistency today, transformation tomorrow." }} />
    </Page>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// FEATURED RECIPES PAGE
// ════════════════════════════════════════════════════════════════════════════
const RECIPE_MACROS = [
  { Icon: FaBreadSlice, label: "Carbs", key: "carbs_g" },
  { Icon: FaDumbbell, label: "Protein", key: "protein_g" },
  { Icon: FaCheese, label: "Fat", key: "fat_g" },
  { Icon: FaSeedling, label: "Fiber", key: "fiber_g" },
];

const RecipeCard = ({ r, idx }) => (
  <div style={{ background: C.white, borderRadius: 12, padding: "9px 12px", border: `1px solid ${C.line}`, display: "flex", flexDirection: "column" }}>
    <div style={{ fontWeight: 800, fontSize: 13, color: C.brand, lineHeight: 1.15, marginBottom: 3 }}>{r.name}</div>
    <div style={{ display: "flex", flexWrap: "nowrap", gap: 12, fontSize: 9.5, color: C.sub, marginBottom: 7, whiteSpace: "nowrap" }}>
      {r.cook_time && <span style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}><FaClock size={9} color={C.brand} /> {r.cook_time}</span>}
      {r.servings && <span style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}><FaUtensils size={9} color={C.brand} /> {r.servings} Serving{r.servings > 1 ? "s" : ""}</span>}
      {r.calories && <span style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}><FaFireAlt size={9} color={C.gold} /> {r.calories} kcal</span>}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 13, flex: 1 }}>
      <div>
        <div style={{ fontSize: 9.5, fontWeight: 800, color: C.dark, marginBottom: 2 }}>Ingredients</div>
        <ul style={{ margin: 0, paddingLeft: 13, fontSize: 9, color: C.sub, lineHeight: 1.3 }}>
          {list(r.ingredients).map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      </div>
      <div>
        <div style={{ fontSize: 9.5, fontWeight: 800, color: C.dark, marginBottom: 2 }}>How to make</div>
        <div style={{ fontSize: 9, color: C.sub, lineHeight: 1.4 }}>{list(r.steps).slice(0, 6).join(" ")}</div>
      </div>
    </div>
    {r.macros && (
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, paddingTop: 6, borderTop: `1px solid ${C.line}` }}>
        {RECIPE_MACROS.map(({ Icon, label, key }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 18, height: 18, borderRadius: "50%", background: C.soft, display: "flex", alignItems: "center", justifyContent: "center", color: C.brand, flexShrink: 0 }}><Icon size={9} /></span>
            <div style={{ lineHeight: 1.05 }}>
              <div style={{ fontSize: 7.5, color: C.faint, fontWeight: 700 }}>{label}</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.dark }}>{r.macros[key]}g</div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const RecipesPage = ({ plan, page }) => {
  const s = plan?.summary || {};
  const recipes = list(plan?.featured_recipes).slice(0, 4);
  const tips = ["Use minimal oil for cooking.", "Steam or boil vegetables to retain nutrients.", "Choose whole grains over refined grains.", "Add more herbs & spices for flavor.", "Stay consistent with portion sizes."];
  const portions = [
    { Icon: FaBreadSlice, t: "1 cup cooked grains" },
    { Icon: FaCarrot, t: "1 cup vegetables" },
    { Icon: FaDumbbell, t: "1 palm protein (paneer, dal, chana, etc.)" },
    { Icon: FaSeedling, t: "1 thumb healthy fats (nuts, seeds, oil)" },
  ];
  return (
    <Page>
      <PageHeader calorie={s.calorie_range} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <Title pre="FEATURED RECIPES" size={27} />
          <p style={{ fontSize: 12.5, color: C.sub, margin: "2px 0 10px" }}>Simple, delicious &amp; nutritious recipes from your {plan?.weeks?.length || 4}-week meal plan.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.soft, borderRadius: 10, padding: "8px 12px", maxWidth: 230, marginTop: 8, flexShrink: 0 }}>
          <FaLightbulb size={14} color={C.brand} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: C.sub, lineHeight: 1.35 }}>All recipes are home-style, easy to make &amp; calorie-conscious.</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, gridAutoRows: "1fr" }}>
        {recipes.map((r, i) => <RecipeCard key={i} r={r} idx={i} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 12, marginTop: 11 }}>
        <SectionCard icon={<LuChefHat size={14} color={C.brand} />} title="COOKING TIPS" style={{ padding: "10px 13px" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "stretch" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7, justifyContent: "center" }}>
              {tips.map((t) => <div key={t} style={{ fontSize: 9.5, color: C.ink, display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}><FaCheckCircle size={11} color={C.brand} style={{ flexShrink: 0 }} />{t}</div>)}
            </div>
            <div style={{ width: 165, flexShrink: 0, background: C.soft, borderRadius: 12, padding: "10px 13px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <Leaf size={15} color={C.brand} />
              <div style={{ fontFamily: "'Segoe Script','Brush Script MT',cursive", fontStyle: "italic", fontSize: 18, color: C.brand, margin: "0 0 3px", lineHeight: 1 }}>Remember</div>
              <div style={{ fontSize: 9.5, color: C.ink, lineHeight: 1.35 }}>Good food choices today create a healthier you tomorrow.</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, color: C.brand }}>
                <div style={{ width: 24, height: 1, background: C.line }} />
                <FaHeart size={8} />
                <div style={{ width: 24, height: 1, background: C.line }} />
              </div>
            </div>
          </div>
        </SectionCard>
        <SectionCard icon={<FaBalanceScale size={13} color={C.brand} />} title="PORTION GUIDE (1 SERVING)" style={{ padding: "10px 13px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "flex-start" }}>
            {portions.map(({ Icon, t }) => (
              <div key={t} style={{ fontSize: 9.5, color: C.ink, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: C.soft, display: "flex", alignItems: "center", justifyContent: "center", color: C.brand, flexShrink: 0 }}><Icon size={9} /></span>
                {t}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <PageFooter page={page} tagline={{ main: "Small steps every day lead to big transformations.", sub: "Eat clean, stay active, and trust the process." }} />
    </Page>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SMART SWAPS & HYDRATION GUIDE PAGE
// ════════════════════════════════════════════════════════════════════════════
const HydrationPage = ({ plan, page }) => {
  const s = plan?.summary || {};
  const allSwaps = (plan?.weeks || []).flatMap((w) => list(w.smart_swaps));
  const seen = new Set();
  const swaps = allSwaps.filter((sw) => { const k = (sw.instead_of || "") + (sw.choose || ""); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 8);
  const schedule = [["🌅", "After Waking Up", "1 glass (Warm water)"], ["🍳", "Before Breakfast", "1 glass"], ["💼", "Mid-Morning", "1 glass"], ["🍱", "Before Lunch", "1 glass"], ["🕒", "Mid-Afternoon", "1 glass"], ["🏋️", "Before Workout / Evening", "1 glass"], ["🥗", "Before Dinner", "1 glass"], ["🌙", "Before Bed", "1 glass"]];
  const tips = list(plan?.general_tips);
  return (
    <Page>
      <PageHeader calorie={s.calorie_range} />
      <Title pre="SMART SWAPS &" accent="HYDRATION GUIDE" />
      <p style={{ fontSize: 13, color: C.sub, margin: "2px 0 16px" }}>Small swaps today. Big transformation tomorrow.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <SectionCard icon={<FaExchangeAlt size={14} color={C.brand} />} title="SMART SWAPS FOR BETTER CHOICES">
          <div style={{ display: "flex", fontSize: 10, fontWeight: 800, color: C.brand, padding: "4px 0", borderBottom: `1px solid ${C.line}` }}><span style={{ flex: 1 }}>INSTEAD OF</span><span style={{ flex: 1 }}>CHOOSE THIS</span></div>
          {(swaps.length ? swaps : [{ instead_of: "Chips", choose: "Roasted Makhana" }, { instead_of: "Cola / Soft Drinks", choose: "Lemon / Herbal Water" }, { instead_of: "White Bread", choose: "Whole Wheat Bread" }, { instead_of: "Sugar", choose: "Jaggery / Honey" }, { instead_of: "Fried Snacks", choose: "Roasted Chana" }, { instead_of: "Ice Cream", choose: "Greek Yogurt / Fruit Bowl" }, { instead_of: "White Rice", choose: "Brown Rice / Millets" }]).map((sw, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", fontSize: 11.5, padding: "7px 0", borderBottom: `1px solid ${C.line}` }}>
              <span style={{ flex: 1, color: C.ink }}>{sw.instead_of}</span>
              <span style={{ color: C.brand, fontWeight: 800, margin: "0 6px" }}>→</span>
              <span style={{ flex: 1, color: C.brand, fontWeight: 700 }}>{sw.choose}</span>
            </div>
          ))}
        </SectionCard>

        <SectionCard icon={<FaTint size={14} color={C.brand} />} title="HYDRATION GUIDE">
          <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 8 }}>{plan?.hydration_guide || "Water is essential for fat loss, metabolism, digestion and glowing skin."}</div>
          <div style={{ background: C.soft, borderRadius: 8, padding: "8px 12px", textAlign: "center", fontWeight: 800, color: C.brand, fontSize: 12, marginBottom: 10 }}>DAILY GOAL: 8–10 GLASSES (2.5–3 LITRES)</div>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: C.dark, textAlign: "center", marginBottom: 6 }}>HOW TO SPREAD YOUR WATER INTAKE</div>
          {schedule.map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", fontSize: 11, padding: "5px 0", borderBottom: `1px solid ${C.line}` }}>
              <span style={{ width: 24 }}>{row[0]}</span>
              <span style={{ flex: 1, color: C.ink }}>{row[1]}</span>
              <span style={{ color: C.sub }}>{row[2]}</span>
              <span style={{ marginLeft: 8 }}>🥛</span>
            </div>
          ))}
        </SectionCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 14 }}>
        <SectionCard icon={<FaTint size={14} color={C.brand} />} title="BENEFITS OF HYDRATION">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {["Boosts Metabolism", "Detoxifies Body", "Improves Digestion", "Enhances Skin Health", "Improves Energy Levels"].map((b) => (
              <div key={b} style={{ fontSize: 10.5, color: C.sub, display: "flex", alignItems: "center", gap: 7 }}><FaCheckCircle size={9} color={C.brand} style={{ flexShrink: 0 }} /> {b}</div>
            ))}
          </div>
        </SectionCard>
        <SectionCard icon={<FaStethoscope size={14} color={C.brand} />} title="GENERAL TIPS">
          <ul style={{ margin: 0, paddingLeft: 14, fontSize: 10, color: C.sub, lineHeight: 1.45 }}>
            {(tips.length ? tips : ["Prioritize protein at every meal.", "Include colorful vegetables and fruits.", "Stay consistent with meal timings.", "Listen to hunger and fullness cues."]).slice(0, 5).map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </SectionCard>
        <SectionCard icon={<FaCheckCircle size={14} color={C.brand} />} title="HYDRATION CHECKLIST">
          <div style={{ fontSize: 10.5, color: C.sub, lineHeight: 1.7 }}>✓ Drank 8–10 glasses today<br />✓ Avoided sugary drinks<br />✓ Included herbal / infused water<br />✓ Made hydration a daily habit</div>
        </SectionCard>
      </div>

      <PageFooter page={page} tagline={{ main: "Hydrate well, nourish well, live well!", sub: "Consistency is your superpower." }} />
    </Page>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// PROGRESS TRACKER PAGE (static template)
// ════════════════════════════════════════════════════════════════════════════
const ProgressPage = ({ plan, page }) => {
  const s = plan?.summary || {};
  const weeksN = (plan?.weeks?.length || 4);
  const wk = Array.from({ length: Math.max(weeksN, 4) }, (_, i) => `Week ${i + 1}`);
  const track = [
    { Icon: FaUtensils, t: "Followed Meal Plan", sub: "(80% or more)" },
    { Icon: FaTint, t: "Stayed Hydrated", sub: "(8-10 glasses/day)" },
    { Icon: FaDumbbell, t: "Worked Out", sub: "(3-5 times/week)" },
    { Icon: FaMoon, t: "Slept Well", sub: "(7-8 hours/night)" },
    { Icon: FaSmile, t: "Stress Managed", sub: "(Mindful & Positive)" },
  ];
  const measures = [
    { Icon: FaWeight, t: "Weight (kg)" },
    { Icon: FaCircleNotch, t: "Waist (cm)" },
    { Icon: FaRuler, t: "Hips (cm)" },
    { Icon: FaTshirt, t: "Chest (cm)" },
    { Icon: FaHandRock, t: "Arms (cm)" },
    { Icon: FaWalking, t: "Thighs (cm)" },
  ];
  const howTo = [
    { Icon: FaCircleNotch, t: "Waist", d: "Measure around the narrowest part of your waist." },
    { Icon: FaRuler, t: "Hips", d: "Measure around the widest part of your hips." },
    { Icon: FaTshirt, t: "Chest", d: "Measure around the fullest part of your chest." },
    { Icon: FaHandRock, t: "Arms", d: "Measure around the relaxed bicep." },
    { Icon: FaWalking, t: "Thighs", d: "Measure around the thickest part of your thigh." },
  ];
  const victories = [
    "More energy throughout the day", "Stronger and fitter body",
    "Better sleep quality", "Better mood & focus",
    "Improved digestion", "Reduced cravings",
    "Fitting into old clothes", "More confidence",
    "Clearer skin", "Healthy habits stick!",
  ];
  return (
    <Page>
      <PageHeader calorie={s.calorie_range} />
      <Title pre="PROGRESS TRACKER &" accent="MEASUREMENTS" />
      <p style={{ fontSize: 12.5, color: C.sub, margin: "2px 0 12px" }}>Track your journey. Celebrate small wins. Stay consistent!</p>

      {/* row 1: weekly progress (+notes) | weight tracker (+graph) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <SectionCard icon={<FaChartBar size={14} color={C.brand} />} title="WEEKLY PROGRESS TRACKER" style={{ padding: "11px 13px" }}>
          <div style={{ fontSize: 9, color: C.sub, marginBottom: 7 }}>Rate your progress each week on a scale of 1–5<br />(1 = Needs Improvement, 5 = Excellent)</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9.5 }}>
            <thead>
              <tr style={{ background: C.brand }}>
                <th style={{ textAlign: "left", color: "#fff", padding: "5px 8px", whiteSpace: "nowrap", fontSize: 9, borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }}>AREAS TO TRACK</th>
                {wk.map((w, i) => <th key={w} style={{ textAlign: "center", color: "#fff", padding: "5px 3px", fontSize: 9, borderTopRightRadius: i === wk.length - 1 ? 6 : 0, borderBottomRightRadius: i === wk.length - 1 ? 6 : 0 }}>{w}</th>)}
              </tr>
            </thead>
            <tbody>{track.map(({ Icon, t, sub }) => <tr key={t}><td style={{ padding: "3.5px 8px", color: C.ink, whiteSpace: "nowrap", borderBottom: `1px solid ${C.line}` }}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon size={11} color={C.brand} style={{ flexShrink: 0 }} /><div><div style={{ fontWeight: 600 }}>{t}</div><div style={{ fontSize: 7.5, color: C.faint }}>{sub}</div></div></div></td>{wk.map((w) => <td key={w} style={{ textAlign: "center", color: C.faint, padding: "5px 3px", whiteSpace: "nowrap", letterSpacing: 0, borderBottom: `1px solid ${C.line}`, fontSize: 8.5 }}>① ② ③ ④ ⑤</td>)}</tr>)}</tbody>
          </table>
          <div style={{ marginTop: 9, background: C.soft, borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.dark, marginBottom: 6 }}>NOTES: <span style={{ fontWeight: 400, color: C.sub }}>Write down what went well and what you can improve next week.</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              {wk.map((w) => (
                <div key={w}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: C.brand, marginBottom: 6, textAlign: "center" }}>{w.toUpperCase()}</div>
                  <div style={{ borderBottom: `1px solid ${C.faint}`, height: 11 }} />
                  <div style={{ borderBottom: `1px solid ${C.faint}`, height: 11 }} />
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={<FaWeight size={14} color={C.brand} />} title="WEIGHT TRACKER" style={{ padding: "11px 13px" }}>
          <div style={{ fontSize: 9, color: C.sub, marginBottom: 7 }}>Track your weight trend over {wk.length} weeks.</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9.5, tableLayout: "fixed" }}>
            <thead>
              <tr style={{ background: C.brand }}>
                {["Week", "Date", "Weight (kg)", "Change (kg)"].map((h, i) => (
                  <th key={h} style={{ color: "#fff", padding: "5px 8px", textAlign: i === 0 ? "left" : "center", fontSize: 9, borderTopLeftRadius: i === 0 ? 6 : 0, borderBottomLeftRadius: i === 0 ? 6 : 0, borderTopRightRadius: i === 3 ? 6 : 0, borderBottomRightRadius: i === 3 ? 6 : 0 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>{wk.map((w) => <tr key={w}><td style={{ padding: "3px 8px", color: C.ink, borderBottom: `1px solid ${C.line}` }}>{w}</td>{[0, 1, 2].map((c) => <td key={c} style={{ padding: "3px 8px", textAlign: "center", color: C.faint, borderBottom: `1px solid ${C.line}` }}>____</td>)}</tr>)}</tbody>
          </table>
          {/* weight progress graph (blank grid to plot) */}
          <div style={{ marginTop: 9 }}>
            <div style={{ fontSize: 8.5, fontWeight: 800, color: C.dark, textAlign: "center", marginBottom: 3 }}>WEIGHT PROGRESS GRAPH</div>
            <svg viewBox="0 0 320 150" preserveAspectRatio="none" style={{ width: "100%", height: 104, display: "block" }}>
              {[0, 1, 2, 3, 4].map((g) => <line key={g} x1="30" y1={14 + g * 28} x2="314" y2={14 + g * 28} stroke={C.line} strokeWidth="1" />)}
              <line x1="30" y1="14" x2="30" y2="126" stroke={C.faint} strokeWidth="1" />
              <line x1="30" y1="126" x2="314" y2="126" stroke={C.faint} strokeWidth="1" />
              {[90, 85, 80, 75, 70].map((v, g) => <text key={v} x="25" y={17 + g * 28} textAnchor="end" fontSize="8" fill={C.faint}>{v}</text>)}
              {wk.map((w, i) => <text key={w} x={30 + (i + 0.5) * (284 / wk.length)} y="139" textAnchor="middle" fontSize="8" fill={C.sub}>{w}</text>)}
              <text x="9" y="70" fontSize="8" fill={C.sub} transform="rotate(-90 9 70)" textAnchor="middle">Weight (kg)</text>
            </svg>
          </div>
          <div style={{ marginTop: 8, background: C.soft, borderRadius: 8, padding: "7px 10px", fontSize: 9.5, color: C.ink, display: "flex", alignItems: "center", gap: 7 }}><FaTrophy size={12} color={C.gold} style={{ flexShrink: 0 }} /><span><b style={{ color: C.brand }}>Remember:</b> Progress is progress, no matter how small. You're becoming a better version of you!</span></div>
        </SectionCard>
      </div>

      {/* row 2: measurements table | how to measure */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 12, marginTop: 12 }}>
        <SectionCard icon={<FaRulerCombined size={14} color={C.brand} />} title="MEASUREMENTS TRACKER" style={{ padding: "11px 13px" }}>
          <div style={{ fontSize: 9, color: C.sub, marginBottom: 8 }}>Track your body measurements to see real changes beyond the scale.</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9.5, tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "23%" }} />
              {wk.map((w) => <col key={w} style={{ width: `${52 / wk.length}%` }} />)}
              <col style={{ width: "25%" }} />
            </colgroup>
            <thead>
              <tr style={{ background: C.brand }}>
                {["MEASUREMENTS", ...wk, `Change (W1-W${wk.length})`].map((h, i, arr) => (
                  <th key={h} style={{ textAlign: i === 0 ? "left" : "center", color: "#fff", padding: "5px 5px", fontSize: 8, whiteSpace: "nowrap", borderTopLeftRadius: i === 0 ? 6 : 0, borderBottomLeftRadius: i === 0 ? 6 : 0, borderTopRightRadius: i === arr.length - 1 ? 6 : 0, borderBottomRightRadius: i === arr.length - 1 ? 6 : 0 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>{measures.map(({ Icon, t }) => <tr key={t}><td style={{ padding: "5px 6px", color: C.ink, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon size={10} color={C.brand} /> {t}</span></td>{[...wk, "Δ"].map((w) => <td key={w} style={{ textAlign: "center", color: C.faint, borderBottom: `1px solid ${C.line}`, padding: "5px 6px" }}>____</td>)}</tr>)}</tbody>
          </table>
        </SectionCard>
        <SectionCard icon={<FaRuler size={14} color={C.brand} />} title="HOW TO MEASURE?" style={{ padding: "11px 13px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {howTo.map(({ Icon, t, d }) => (
              <div key={t} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: C.soft, display: "flex", alignItems: "center", justifyContent: "center", color: C.brand, flexShrink: 0, marginTop: 1 }}><Icon size={10} /></span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: C.dark, lineHeight: 1.2 }}>{t}</div>
                  <div style={{ fontSize: 9, color: C.sub, lineHeight: 1.3 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* row 3: victories | quote | photos */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.8fr 1.1fr", gap: 12, marginTop: 12 }}>
        <SectionCard icon={<FaStar size={14} color={C.brand} />} title="NON-SCALE VICTORIES" style={{ padding: "11px 13px" }}>
          <div style={{ fontSize: 8.5, color: C.sub, marginBottom: 6 }}>Celebrate the changes that truly matter!</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 10px" }}>
            {victories.map((v) => <div key={v} style={{ fontSize: 9, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}><FaCheckCircle size={9} color={C.brand} style={{ flexShrink: 0 }} />{v}</div>)}
          </div>
        </SectionCard>
        <div style={{ background: C.soft, borderRadius: 14, padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", color: C.brand }}>
          <FaQuoteLeft size={14} style={{ opacity: 0.55, alignSelf: "flex-start" }} />
          <div style={{ fontFamily: "'Segoe Script','Brush Script MT',cursive", fontStyle: "italic", fontSize: 13.5, lineHeight: 1.35, margin: "3px 0" }}>It's not about being perfect. It's about being consistent.</div>
          <FaQuoteRight size={14} style={{ opacity: 0.55, alignSelf: "flex-end" }} />
        </div>
        <SectionCard icon={<FaCamera size={14} color={C.brand} />} title="PHOTOS SPEAK LOUDER!" style={{ padding: "11px 13px" }}>
          <div style={{ fontSize: 8.5, color: C.sub, marginBottom: 7 }}>Click your progress photos once a week and see the amazing transformation.</div>
          <div style={{ display: "flex", gap: 6 }}>{wk.map((w) => <div key={w} style={{ flex: 1, height: 46, background: C.soft, borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, fontSize: 7.5, color: C.faint }}><FaCamera size={12} /><span>{w}</span></div>)}</div>
        </SectionCard>
      </div>

      <PageFooter page={page} tagline={{ main: "Keep going, you're doing great!", sub: "Small steps. Consistent choices. Big transformation." }} />
    </Page>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SUPPLEMENTS PAGE (static — Quantum Nutrition)
// ════════════════════════════════════════════════════════════════════════════
const SupplementsPage = ({ plan, page }) => {
  const s = plan?.summary || {};
  const groups = [
    { icon: "💪", title: "PROTEIN ESSENTIALS", sub: "Build strength. Support recovery.", items: [{ n: "Vegan Protein", d: "24g Plant Protein • Complete Amino Acids • Easy Digestion • No Added Sugar" }, { n: "ISO Protein", d: "25g Protein • Low Carb, Low Fat • Fast Absorption • Zero Added Sugar" }] },
    { icon: "🛡️", title: "VITAMINS & DAILY HEALTH", sub: "Fill the gaps. Strengthen immunity.", items: [{ n: "Multivitamin", d: "Daily nutrient support, boosts immunity & energy" }, { n: "Vitamin D3", d: "Improves calcium absorption, supports bones" }, { n: "Omega 3", d: "Supports heart, brain & joint health" }, { n: "Magnesium Glycinate", d: "Supports muscle function, reduces fatigue" }] },
    { icon: "🏃", title: "RECOVERY & PERFORMANCE", sub: "Recover faster. Perform every day.", items: [{ n: "BCAA 2:1:1", d: "Reduces soreness, supports muscle recovery" }, { n: "L-Glutamine", d: "Supports gut health & recovery" }, { n: "Creatine Monohydrate", d: "Increases strength & power" }, { n: "Electrolytes", d: "Replenishes lost minerals, keeps you hydrated" }] },
  ];
  return (
    <Page>
      <PageHeader calorie={s.calorie_range} />
      <Title pre="RECOMMENDED BY" accent="QUANTUM NUTRITION" />
      <p style={{ fontSize: 13, color: C.sub, margin: "2px 0 4px" }}>Premium nutrition. Proven results. Trusted by thousands.</p>
      <p style={{ fontSize: 12, color: C.brand, margin: "0 0 16px" }}>🌿 Fuel your body with high-quality, clean & effective supplements to support your health and fitness journey.</p>

      {groups.map((g) => (
        <div key={g.title} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>{g.icon}</span>
            <div><div style={{ fontWeight: 800, fontSize: 14, color: C.dark }}>{g.title}</div><div style={{ fontSize: 11, color: C.sub }}>{g.sub}</div></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${g.items.length}, 1fr)`, gap: 10 }}>
            {g.items.map((it) => (
              <div key={it.n} style={{ background: C.card, borderRadius: 12, padding: 12, textAlign: "center" }}>
                <div style={{ width: 50, height: 64, margin: "0 auto 8px", background: "linear-gradient(160deg,#1f2937,#111827)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🧴</div>
                <div style={{ fontWeight: 800, fontSize: 12, color: C.dark }}>{it.n}</div>
                <div style={{ fontSize: 9.5, color: C.sub, lineHeight: 1.4, marginTop: 3 }}>{it.d}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ background: C.banner, borderRadius: 12, padding: "14px 20px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>Good nutrition + Right supplements + Consistency = TRANSFORMATION</div>
        <div style={{ fontSize: 12, textAlign: "right" }}>Explore the full range at<br /><b>www.quantumnutrition.in</b></div>
      </div>

      <PageFooter page={page} tagline={null} />
    </Page>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// DIETITIANS PAGE (static)
// ════════════════════════════════════════════════════════════════════════════
const DietitiansPage = ({ plan, page }) => {
  const s = plan?.summary || {};
  const docs = [
    { img: "/images/dietitian-priya.jpg", n: "Dt. Priya Sharma", r: "Clinical Dietitian & Nutritionist", pts: ["6+ Years of Experience", "Specialization: Weight Management, PCOS, Gut Health", "Helps clients build a healthy relationship with food."] },
    { img: "/images/dietitian-neha.jpg", n: "Dt. Neha Verma", r: "Sports Nutritionist", pts: ["5+ Years of Experience", "Specialization: Sports Nutrition, Muscle Gain, Fat Loss", "Passionate about performance fueling and recovery."] },
    { img: "/images/dietitian-anjali.jpg", n: "Dt. Anjali Mehta", r: "Holistic Nutritionist", pts: ["7+ Years of Experience", "Specialization: Hormonal Health, Thyroid, Weight Loss", "Believes in healing through balanced nutrition."] },
    { img: "/images/dietitian-rahul.png", n: "Dt. Rahul Gupta", r: "Nutrition Consultant", pts: ["4+ Years of Experience", "Specialization: Diabetes Care, Heart Health, Family Nutrition", "Focused on long-term health and disease reversal."] },
  ];
  const about = [
    "Personalized diet plans based on your goals",
    "Expert guidance from certified dietitians",
    "Science-backed nutrition for real results",
    "Thousands of success stories across India",
  ];
  const why = [
    { Icon: FaHeadset, t: "One-on-one expert attention" },
    { Icon: FaClipboardList, t: "Personalized advice based on your progress" },
    { Icon: FaBullseye, t: "Faster results with professional support" },
    { Icon: FaSeedling, t: "Sustainable habits that last a lifetime" },
    { Icon: FaChartLine, t: "Track, adjust & achieve your goals" },
  ];
  return (
    <Page>
      <PageHeader calorie={s.calorie_range} />
      {/* heading + about box */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: C.dark, lineHeight: 1.1 }}>WE'RE HERE TO GUIDE YOU,</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: C.gold, lineHeight: 1.1 }}>EVERY STEP OF THE WAY.</div>
          <p style={{ fontSize: 12, color: C.sub, margin: "12px 0 0", maxWidth: 360, lineHeight: 1.5 }}>At MeriDiet, we believe that the right guidance makes all the difference. Our expert dietitians are here to help you eat better, feel better and live better.</p>
        </div>
        <div style={{ width: 250, flexShrink: 0, background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "13px 15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
            <img src="/images/heart-leaf.png" alt="" crossOrigin="anonymous" style={{ width: 22, height: 22, flexShrink: 0 }} />
            <div style={{ fontWeight: 800, fontSize: 12.5, color: C.dark }}>ABOUT MERIDIET</div>
          </div>
          <div style={{ fontSize: 10, color: C.sub, lineHeight: 1.45, marginBottom: 8 }}>MeriDiet is India's trusted online nutrition platform that makes healthy living simple, sustainable and personalized.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {about.map((a) => <div key={a} style={{ fontSize: 9.5, color: C.ink, display: "flex", alignItems: "flex-start", gap: 6 }}><FaCheckCircle size={9} color={C.brand} style={{ flexShrink: 0, marginTop: 1.5 }} />{a}</div>)}
          </div>
        </div>
      </div>

      {/* dietitians */}
      <div style={{ textAlign: "center", fontSize: 16, fontWeight: 800, color: C.brand, margin: "16px 0 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}><Leaf size={15} color={C.brand} /> MEET OUR EXPERT DIETITIANS <Leaf size={15} color={C.brand} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 11 }}>
        {docs.map((d) => (
          <div key={d.n} style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.line}`, overflow: "hidden" }}>
            <div style={{ width: "100%", height: 110, backgroundImage: `url(${d.img})`, backgroundSize: "cover", backgroundPosition: "center top" }} />
            <div style={{ padding: "9px 10px 10px" }}>
              <div style={{ fontWeight: 800, fontSize: 12, color: C.dark }}>{d.n}</div>
              <div style={{ fontSize: 9.5, color: C.brand, marginBottom: 6, paddingBottom: 6, borderBottom: `1px solid ${C.line}` }}>{d.r}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {d.pts.map((p, i) => <div key={i} style={{ fontSize: 8.5, color: C.sub, lineHeight: 1.3, display: "flex", gap: 5 }}><FaCheckCircle size={8} color={C.brand} style={{ flexShrink: 0, marginTop: 1.5 }} /><span>{p}</span></div>)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* sessions banner */}
      <div style={{ background: C.banner, borderRadius: 14, padding: "16px 22px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <FaVideo size={30} style={{ opacity: 0.9 }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>TAKE PERSONALIZED SESSIONS</div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>WITH OUR EXPERT DIETITIANS</div>
            <div style={{ fontSize: 11.5, opacity: 0.9, marginTop: 3 }}>Get clarity. Get guidance. Get results.</div>
          </div>
        </div>
        <div style={{ background: C.gold, borderRadius: 12, padding: "10px 20px", textAlign: "center", color: C.dark, flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700 }}>ONLY</div>
          <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>₹2499</div>
          <div style={{ fontSize: 8.5, fontWeight: 700, marginTop: 2 }}>FOR 2 SESSIONS IN A MONTH</div>
        </div>
      </div>

      {/* why */}
      <div style={{ textAlign: "center", fontSize: 14, fontWeight: 800, color: C.dark, margin: "22px 0 16px" }}>WHY TAKE DIETITIAN SESSIONS?</div>
      <div style={{ display: "flex", justifyContent: "space-between", margin: "0 0 34px", gap: 8 }}>
        {why.map(({ Icon, t }) => (
          <div key={t} style={{ textAlign: "center", flex: 1 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", margin: "0 auto 6px", background: C.soft, display: "flex", alignItems: "center", justifyContent: "center", color: C.brand }}><Icon size={16} /></div>
            <div style={{ fontSize: 9.5, color: C.sub, lineHeight: 1.35 }}>{t}</div>
          </div>
        ))}
      </div>

      {/* CTA with QR */}
      <div style={{ background: C.soft, borderRadius: 12, padding: "13px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: C.dark, display: "flex", alignItems: "center", gap: 7 }}><FaGlobe size={13} color={C.brand} /> Ready to Transform Your Health?</div>
          <div style={{ fontSize: 11, color: C.sub, margin: "2px 0 9px" }}>Book your personalized sessions now on our website</div>
          <a href="https://www.meridiet.com" target="_blank" rel="noreferrer" data-pdf-link style={{ background: C.brand, color: "#fff", borderRadius: 20, padding: "8px 24px", fontWeight: 800, fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7 }}>www.meridiet.com <FaArrowRight size={11} /></a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <img src="/images/qr-meridiet.png" alt="QR — meridiet.in" crossOrigin="anonymous" style={{ width: 62, height: 62, background: "#fff", padding: 4, borderRadius: 8, border: `1px solid ${C.line}` }} />
          <div style={{ fontSize: 10, color: C.sub, lineHeight: 1.35, maxWidth: 110 }}>Scan the QR code to visit our website and book your sessions now!</div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <div style={{ fontFamily: "'Segoe Script','Brush Script MT',cursive", fontStyle: "italic", color: C.brand, fontSize: 20, lineHeight: 1.2 }}>You don't have to do it alone.</div>
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <FaHeart size={13} color={C.brand} />
          <span style={{ fontSize: 16, fontWeight: 900, color: C.brand, letterSpacing: 1 }}>We're here for you!</span>
          <FaHeart size={13} color={C.brand} />
        </div>
      </div>

      <PageFooter page={page} tagline={null} />
    </Page>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// DOCUMENT — assembles all pages
// ════════════════════════════════════════════════════════════════════════════
const DietPlanDocument = forwardRef(({ plan }, ref) => {
  if (!plan) return null;
  const weeks = plan.weeks || [];
  let pageNo = 1;
  const next = () => ++pageNo; // first content page after cover is "2"

  return (
    <div ref={ref} style={{ width: PAGE_W, margin: "0 auto" }}>
      <CoverPage plan={plan} />
      <ProfilePage plan={plan} page={next()} />
      <OverviewPage plan={plan} page={next()} />
      {weeks.map((w, i) => <WeekPage key={i} week={w} weekIndex={i} plan={plan} page={next()} />)}
      <RecipesPage plan={plan} page={next()} />
      <HydrationPage plan={plan} page={next()} />
      <ProgressPage plan={plan} page={next()} />
      {/* Supplements page (RECOMMENDED BY QUANTUM NUTRITION) hidden for now */}
      {/* <SupplementsPage plan={plan} page={next()} /> */}
      <DietitiansPage plan={plan} page={next()} />
    </div>
  );
});
DietPlanDocument.displayName = "DietPlanDocument";

export default DietPlanDocument;
export { PAGE_W, PAGE_H };
