/*
 * DietPlanDocument — full branded recreation of the MeriDiet 12-page diet plan PDF.
 * Each top-level `.dp-page` is an A4 sheet (794 x 1123 px @ 96dpi) so it maps 1:1 to a
 * PDF page when captured with html2canvas. Data-driven pages read from the `/preview`
 * API payload; marketing pages (progress tracker, supplements, dietitians) are static
 * templates that mirror the source design.
 */
import { forwardRef } from "react";

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

const Logo = ({ scale = 1, dark }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 * scale }}>
    <div>
      <div style={{ fontSize: 26 * scale, fontWeight: 800, color: dark ? C.white : C.dark, letterSpacing: -0.5, lineHeight: 1, display: "flex", alignItems: "center", gap: 4 }}>
        MeriDiet <Leaf size={20 * scale} color={dark ? "#9be8a8" : C.brand} />
      </div>
      <div style={{ fontSize: 11 * scale, fontStyle: "italic", color: dark ? "#cde9d3" : C.brand, marginTop: 2 }}>Better Choices, Better You!</div>
    </div>
  </div>
);

const CaloriePill = ({ text }) => (
  <div style={{ border: `1.5px solid ${C.line}`, borderRadius: 22, padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: 8, background: C.white, fontWeight: 700, color: C.ink, fontSize: 14 }}>
    <span style={{ fontSize: 15 }}>🔥</span> {text || "Calorie Plan"}
  </div>
);

const PageHeader = ({ calorie }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
    <Logo />
    <CaloriePill text={calorie} />
  </div>
);

const PageFooter = ({ page, tagline }) => (
  <div style={{ position: "absolute", left: 40, right: 40, bottom: 22 }}>
    {tagline && (
      <div style={{ background: C.banner, borderRadius: 12, padding: "14px 20px", textAlign: "center", color: C.white, marginBottom: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 17 }}>{tagline.main}</div>
        {tagline.sub && <div style={{ fontSize: 13, opacity: 0.92, marginTop: 2 }}>{tagline.sub}</div>}
      </div>
    )}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: C.sub, borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><b style={{ color: C.dark }}>MeriDiet</b> <Leaf size={11} /> – Better Choices, Better You!</span>
      <span>🌐 www.meridiet.in</span>
      <span>Page <b style={{ background: C.brand, color: "#fff", borderRadius: 12, padding: "1px 8px" }}>{page}</b></span>
    </div>
  </div>
);

const Page = forwardRef(({ children, bg = C.white, pad = 40 }, ref) => (
  <div className="dp-page" ref={ref}
    style={{ width: PAGE_W, height: PAGE_H, background: bg, position: "relative", overflow: "hidden", fontFamily: FONT, color: C.ink, boxSizing: "border-box", padding: pad, margin: "0 auto 24px", boxShadow: "0 6px 24px rgba(0,0,0,0.12)" }}>
    {children}
  </div>
));
Page.displayName = "Page";

const Title = ({ pre, accent }) => (
  <h1 style={{ margin: "16px 0 4px", fontSize: 34, fontWeight: 800, color: C.dark, letterSpacing: -0.5 }}>
    {pre} {accent && <span style={{ color: C.brand }}>{accent}</span>}
  </h1>
);

const SectionCard = ({ icon, title, children, style }) => (
  <div style={{ background: C.card, borderRadius: 14, padding: "14px 16px", ...style }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.dark, letterSpacing: 0.3 }}>{title}</h3>
    </div>
    {children}
  </div>
);

const Row = ({ label, value }) => (
  <div style={{ display: "flex", fontSize: 11.5, padding: "3px 0", lineHeight: 1.4 }}>
    <span style={{ color: C.sub, minWidth: 132, flexShrink: 0 }}>{label}</span>
    <span style={{ color: C.sub, margin: "0 6px" }}>:</span>
    <span style={{ color: C.ink, fontWeight: 600 }}>{value || "—"}</span>
  </div>
);

const Chip = ({ children, bg = C.soft, color = C.brand }) => (
  <span style={{ background: bg, color, borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 700, display: "inline-block" }}>{children}</span>
);

// ════════════════════════════════════════════════════════════════════════════
// PAGE 1 — COVER
// ════════════════════════════════════════════════════════════════════════════
const CoverPage = ({ plan }) => {
  const s = plan?.summary || {};
  const p = plan?.client_profile?.personal_information || {};
  const name = humanize(s.client_name || p.full_name || "Client");
  const features = [
    { icon: "👤", t: "Personalized for You", d: "A plan tailored to your goals, preferences & lifestyle." },
    { icon: "🥗", t: "Balanced Nutrition", d: "Wholesome, nourishing & sustainable meals." },
    { icon: "📈", t: "Visible Results", d: "Small steps today, lasting transformation tomorrow." },
    { icon: "💚", t: "Complete Wellness", d: "Better food, better habits, better you." },
  ];
  const bottom = [
    ["🎯", "Goal-Based", "Approach"], ["📋", "Easy & Simple", "Meal Plans"], ["👨‍🍳", "Delicious &", "Indian Meals"], ["🌿", "Clean Ingredients", "Better Health"], ["✅", "Consistent Support", "Every Step"],
  ];
  return (
    <Page pad={0}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#f3f8ee 0%,#eaf3e4 55%,#dcebd2 100%)" }} />
      {/* hero panel */}
      <div style={{ position: "absolute", right: 0, top: 0, width: 300, height: PAGE_H, background: "linear-gradient(160deg,#e8f1df,#cfe3c2)", borderTopLeftRadius: 120 }} />
      <div style={{ position: "absolute", right: 56, top: 300, width: 230, height: 230, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%,#ffffff,#e7f0dd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 120, boxShadow: "0 18px 50px rgba(20,83,45,0.25)" }}>🥗</div>
      <div style={{ position: "absolute", right: 60, top: 250, fontSize: 40 }}>🥬</div>

      <div style={{ position: "relative", padding: 40 }}>
        <Logo scale={1.15} />
        <div style={{ position: "absolute", right: 40, top: 44 }}><CaloriePill text={s.calorie_range} /></div>

        <h1 style={{ margin: "46px 0 0", fontSize: 38, fontWeight: 800, color: C.dark, letterSpacing: 0.5 }}>YOUR PERSONALIZED</h1>
        <h1 style={{ margin: 0, fontSize: 78, fontWeight: 900, color: C.brand, letterSpacing: 1, lineHeight: 1 }}>DIET PLAN</h1>
        <div style={{ width: 250, height: 2, background: C.line, margin: "18px 0" }} />
        <p style={{ fontSize: 17, color: C.ink, lineHeight: 1.5, maxWidth: 360 }}>Designed for You.<br />Backed by Science. Driven by Results.</p>

        <div style={{ marginTop: 26, maxWidth: 380 }}>
          {features.map((f) => (
            <div key={f.t} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>{f.icon}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: C.dark }}>{f.t}</div>
                <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.35 }}>{f.d}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 8, maxWidth: 380, background: "rgba(255,255,255,0.55)", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.brand, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>💚</div>
          <div style={{ fontSize: 12, color: C.ink, lineHeight: 1.4 }}>This is more than a plan. It's a partnership towards a healthier, happier you. <b style={{ color: C.brand }}>Let's begin this journey together!</b></div>
        </div>

        <div style={{ fontFamily: "'Segoe Script','Brush Script MT',cursive", color: C.dark, fontSize: 24, position: "absolute", right: 46, top: 150, textAlign: "center", lineHeight: 1.3, fontStyle: "italic" }}>Good nutrition<br />isn't a diet,<br />it's a lifestyle.</div>
      </div>

      {/* bottom feature row */}
      <div style={{ position: "absolute", left: 40, right: 40, bottom: 130, display: "flex", justifyContent: "space-between" }}>
        {bottom.map((b, i) => (
          <div key={i} style={{ textAlign: "center", width: 130 }}>
            <div style={{ fontSize: 26, marginBottom: 4 }}>{b[0]}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.dark }}>{b[1]}</div>
            <div style={{ fontSize: 11, color: C.sub }}>{b[2]}</div>
          </div>
        ))}
      </div>

      {/* prepared-for banner */}
      <div style={{ position: "absolute", left: 40, right: 40, bottom: 44, background: C.banner, borderRadius: 12, padding: "16px 22px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>Prepared Especially For 💚</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{name}</div>
        </div>
        <div style={{ width: 1, height: 40, background: "rgba(255,255,255,0.3)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, opacity: 0.85 }}>📅 Plan Duration</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{s.plan_duration || "—"}</div>
        </div>
        <div style={{ width: 1, height: 40, background: "rgba(255,255,255,0.3)" }} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, opacity: 0.9 }}>Your Health.</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Our Commitment.</div>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontSize: 10, color: C.sub }}>01</div>
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
          <p style={{ fontSize: 13, color: C.sub, margin: "2px 0 0" }}>Here's a summary of the information you provided. We'll use this to personalize your plan and track your progress.</p>
        </div>
      </div>
      <div style={{ position: "absolute", right: 40, top: 96, background: C.soft, borderRadius: 12, padding: "10px 16px", fontSize: 11.5, color: C.ink }}>
        <div>📅 Date of Assessment: <b>{fmtDate(p.date_of_birth ? new Date().toISOString() : null) === "—" ? "—" : fmtDate(new Date().toISOString())}</b></div>
        <div style={{ marginTop: 6 }}>Plan / Client ID: <b>QN-MD-{String(plan?.form_id || "0000").padStart(4, "0")}</b></div>
      </div>

      <div style={{ width: 60, height: 3, background: C.brand, borderRadius: 3, margin: "14px 0 16px" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <SectionCard icon="👤" title="PERSONAL INFORMATION">
          <Row label="Full Name" value={humanize(p.full_name)} />
          <Row label="Age" value={p.age ? `${p.age} Years` : null} />
          <Row label="Gender" value={humanize(p.gender)} />
          <Row label="Date of Birth" value={p.date_of_birth ? fmtDate(p.date_of_birth) : null} />
          <Row label="Height" value={p.height} />
          <Row label="Phone Number" value={p.phone} />
          <Row label="Email ID" value={p.email} />
          <Row label="Address" value={[p.city, p.state].filter(Boolean).join(", ")} />
        </SectionCard>

        <SectionCard icon="💓" title="CURRENT VITALS">
          <Row label="Weight" value={v.weight_kg ? `${v.weight_kg} kg` : null} />
          <Row label="Height" value={v.height_cm ? `${v.height_cm} cm` : null} />
          <Row label="BMI" value={v.bmi != null ? `${v.bmi}` : null} />
          <Row label="BMI Category" value={v.bmi_category} />
          <Row label="BMR" value={v.bmr_kcal ? `${v.bmr_kcal} kcal/day` : null} />
          <Row label="TDEE" value={v.tdee_kcal ? `${v.tdee_kcal} kcal/day` : null} />
          <Row label="Activity Level" value={humanize(lf.activity_level)} />
          <Row label="Digestive Health" value={humanize(lf.digestive_health)} />
        </SectionCard>

        <SectionCard icon="🎯" title="HEALTH & FITNESS GOALS">
          <Row label="Primary Goal" value={list(g.goals).map(humanize).join(", ") || humanize(s.primary_goal)} />
          <Row label="Plan Type" value={g.plan_type} />
          <Row label="Calorie Target" value={s.calorie_range} />
          <Row label="Protein Target" value={s.protein_target_g ? `${s.protein_target_g} g/day` : null} />
          <Row label="Health Notes" value={g.health_notes} />
          <Row label="Final Notes" value={g.final_notes} />
        </SectionCard>

        <SectionCard icon="🏃" title="LIFESTYLE OVERVIEW">
          <Row label="Work Type" value={humanize(lf.work_type)} />
          <Row label="Workout Type" value={humanize(lf.workout_type)} />
          <Row label="Activity Level" value={humanize(lf.activity_level)} />
          <Row label="Smoke / Alcohol" value={humanize(lf.smoke_alcohol)} />
          <Row label="Digestive Health" value={humanize(lf.digestive_health)} />
        </SectionCard>

        <SectionCard icon="➕" title="MEDICAL INFORMATION">
          <Row label="Medical Conditions" value={none(md.medical_conditions)} />
          <Row label="Other Condition" value={md.other_condition} />
          <Row label="On Medication" value={humanize(md.on_medication)} />
          <Row label="Medications" value={md.medications} />
          <Row label="Allergies / Intolerances" value={none(md.food_allergies)} />
        </SectionCard>

        <SectionCard icon="🥣" title="DIETARY INFORMATION">
          <Row label="Diet Type" value={humanize(di.diet_type)} />
          <Row label="Cuisine Preference" value={list(di.cuisine_preference).map(humanize).join(", ")} />
          <Row label="Favorite Foods" value={di.favorite_foods} />
          <Row label="Foods Disliked / Avoided" value={di.foods_dislike} />
        </SectionCard>
      </div>

      <div style={{ marginTop: 14, background: C.soft, borderRadius: 14, padding: "14px 18px", display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: C.dark, marginBottom: 4 }}>📝 ADDITIONAL NOTES</div>
          <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>{g.final_notes || g.health_notes || "Prefers simple, sustainable meals with Indian food options. Motivated to stay consistent and follow the plan."}</div>
        </div>
        <div style={{ fontFamily: "'Segoe Script',cursive", fontStyle: "italic", color: C.brand, fontSize: 15, textAlign: "center", lineHeight: 1.4, minWidth: 170 }}>
          ❝ Your health journey is unique. We're here to support you every step of the way. ❞
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
    { icon: "⏰", t: "Eat On Time", d: "Follow meal timings consistently for better energy and digestion." },
    { icon: "💧", t: "Stay Hydrated", d: "Drink 2.5–3L water daily throughout your transformation journey." },
    { icon: "👟", t: "Stay Active", d: "Aim for 7000–10000 steps daily along with light exercise." },
    { icon: "🌙", t: "Sleep Well", d: "Maintain 7–8 hours of quality sleep for recovery and fat loss." },
  ];
  const weekColors = [C.brand, "#2f9e44", "#1b7a39", C.gold];
  const includes = [["📋", "Daily meal plans"], ["🏠", "Indian home-style recipes"], ["🥄", "Portion guidance"], ["🔥", "Calorie-aware meals"], ["🥗", "Healthy snack ideas"], ["💧", "Hydration support"], ["🔄", "Smart food swaps"], ["📈", "Progress tracking"]];
  const notes = ["One cheat meal allowed weekly.", "Avoid processed sugar as much as possible.", "Portion sizes may vary slightly based on your needs.", "Consistency matters more than perfection.", "Listen to your body and make mindful choices."];
  return (
    <Page>
      <PageHeader calorie={s.calorie_range} />
      <Title pre="HOW TO USE" accent="THIS PLAN" />
      <p style={{ fontSize: 13, color: C.sub, margin: "2px 0 16px" }}>Simple steps to follow for the best results</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        {steps.map((st) => (
          <div key={st.t} style={{ background: C.card, borderRadius: 12, padding: "16px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 30, marginBottom: 6 }}>{st.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 13, color: C.dark, marginBottom: 4 }}>{st.t}</div>
            <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.35 }}>{st.d}</div>
          </div>
        ))}
      </div>

      <h2 style={{ textAlign: "center", fontSize: 26, fontWeight: 800, color: C.dark, margin: "22px 0 4px" }}>🌿 {weeks.length ? `${weeks.length * 7}-DAY` : "30-DAY"} PLAN OVERVIEW 🌿</h2>
      <p style={{ textAlign: "center", fontSize: 12, color: C.sub, margin: "0 0 14px" }}>A structured approach to transform your lifestyle</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(weeks.length ? weeks : [0, 1, 2, 3]).map((w, i) => {
          const wk = typeof w === "object" ? w : null;
          const fallbackTitles = ["Reset & Cleanse", "Balance & Nourish", "Strength & Sustain", "Transform & Maintain"];
          return (
            <div key={i} style={{ display: "flex", background: C.card, borderRadius: 12, overflow: "hidden", minHeight: 92 }}>
              <div style={{ width: 76, background: weekColors[i % 4], color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85 }}>WEEK</div>
                <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1 }}>{wk?.week || i + 1}</div>
              </div>
              <div style={{ flex: 1, padding: "12px 16px", display: "flex", gap: 14 }}>
                <div style={{ flex: 1.4 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: C.brand }}>{wk?.title || fallbackTitles[i]}</div>
                  <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.4, marginTop: 3 }}>{wk?.description || "A structured week to progress your nutrition and habits."}</div>
                </div>
                <div style={{ flex: 1, borderLeft: `1px solid ${C.line}`, paddingLeft: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: C.brand, marginBottom: 4 }}>FOCUS</div>
                  <ul style={{ margin: 0, paddingLeft: 14, fontSize: 10.5, color: C.sub, lineHeight: 1.5 }}>
                    {(list(wk?.focus).length ? list(wk?.focus) : ["Balanced meals", "Hydration", "Consistency"]).slice(0, 4).map((f, k) => <li key={k}>{f}</li>)}
                  </ul>
                </div>
                <div style={{ flex: 0.9, borderLeft: `1px solid ${C.line}`, paddingLeft: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, marginBottom: 4 }}>WHAT TO EXPECT</div>
                  <div style={{ fontSize: 10.5, color: C.sub, lineHeight: 1.4 }}>{wk?.what_to_expect || "Steady progress toward your goal."}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14, marginTop: 14 }}>
        <SectionCard icon="✅" title="WHAT THIS PLAN INCLUDES">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 10px" }}>
            {includes.map((it) => <div key={it[1]} style={{ fontSize: 11.5, color: C.ink, display: "flex", gap: 6 }}><span>{it[0]}</span>{it[1]}</div>)}
          </div>
        </SectionCard>
        <SectionCard icon="ℹ️" title="IMPORTANT NOTES">
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: C.sub, lineHeight: 1.6 }}>
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
  { key: "breakfast", label: "Breakfast", icon: "☀️" },
  { key: "lunch", label: "Lunch", icon: "🍛" },
  { key: "snack", label: "Snack", icon: "🍎" },
  { key: "dinner", label: "Dinner", icon: "🌙" },
];

const DayCard = ({ d }) => (
  <div style={{ background: C.card, borderRadius: 12, padding: 10, border: `1px solid ${C.line}` }}>
    <div style={{ display: "inline-block", background: C.brand, color: "#fff", fontWeight: 800, fontSize: 11, borderRadius: 8, padding: "3px 12px", marginBottom: 8 }}>DAY {d.day}</div>
    {MEALS.map((m) => {
      const txt = dishes(d[m.key]);
      if (!txt) return null;
      return (
        <div key={m.key} style={{ display: "flex", gap: 6, fontSize: 10, lineHeight: 1.3, marginBottom: 5 }}>
          <span style={{ width: 56, flexShrink: 0, color: C.sub, fontWeight: 700 }}>{m.icon} {m.label}</span>
          <span style={{ color: C.ink }}>{txt}</span>
        </div>
      );
    })}
    <div style={{ display: "flex", gap: 6, marginTop: 8, borderTop: `1px solid ${C.line}`, paddingTop: 6 }}>
      {d.total_kcal != null && <span style={{ fontSize: 10, fontWeight: 700, color: C.gold }}>🔥 {d.total_kcal} kcal</span>}
      {d.total_protein_g != null && <span style={{ fontSize: 10, fontWeight: 700, color: C.brand }}>💪 {d.total_protein_g} g Protein</span>}
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
        <Chip bg={C.soft} color={C.brand}><span style={{ fontSize: 12 }}>🎯 Goal: {humanize(s.primary_goal)}</span></Chip>
      </div>
      <Title pre={`WEEK ${week?.week || weekIndex + 1} –`} accent="SAMPLE MEAL PLAN" />
      <p style={{ fontSize: 12.5, color: C.sub, margin: "2px 0 14px" }}>
        Days {startDay}–{endDay} structured nutrition plan{week?.title ? ` — ${week.title}.` : "."}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {days.map((d) => <DayCard key={d.day} d={d} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        <SectionCard icon="📝" title="WEEKLY NOTES">
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: C.sub, lineHeight: 1.6 }}>
            {(wnotes.length ? wnotes : ["Drink at least 3L water daily.", "Avoid sugary drinks and deep-fried foods.", "Eat mindfully and stop when 80% full."]).map((n, i) => <li key={i}>{n}</li>)}
          </ul>
          {week?.what_to_expect && <div style={{ marginTop: 8, background: C.soft, borderRadius: 8, padding: "8px 10px", fontSize: 11, color: C.ink, lineHeight: 1.4 }}><b style={{ color: C.brand }}>What to expect: </b>{week.what_to_expect}</div>}
        </SectionCard>
        <SectionCard icon="🔄" title="SMART SWAPS">
          {swaps.length ? (
            <div>
              <div style={{ display: "flex", fontSize: 9.5, fontWeight: 800, color: C.brand, marginBottom: 4 }}><span style={{ flex: 1 }}>INSTEAD OF</span><span style={{ flex: 1 }}>CHOOSE THIS</span></div>
              {swaps.slice(0, 6).map((sw, i) => (
                <div key={i} style={{ display: "flex", fontSize: 10.5, color: C.ink, padding: "3px 0", borderBottom: `1px solid ${C.line}`, lineHeight: 1.3 }}>
                  <span style={{ flex: 1, color: "#c0392b", textDecoration: "line-through", paddingRight: 6 }}>{sw.instead_of}</span>
                  <span style={{ flex: 1, color: C.brand, fontWeight: 600 }}>→ {sw.choose}</span>
                </div>
              ))}
            </div>
          ) : <div style={{ fontSize: 11, color: C.faint }}>No swaps listed.</div>}
        </SectionCard>
      </div>

      <PageFooter page={page} tagline={{ main: "You've got this!", sub: "Consistency today, transformation tomorrow." }} />
    </Page>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// FEATURED RECIPES PAGE
// ════════════════════════════════════════════════════════════════════════════
const RecipeCard = ({ r, idx }) => (
  <div style={{ background: C.card, borderRadius: 12, padding: 12, border: `1px solid ${C.line}` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ background: C.brand, color: "#fff", borderRadius: 8, padding: "2px 9px", fontSize: 12, fontWeight: 800 }}>{String(idx + 1).padStart(2, "0")}</span>
      <span style={{ fontWeight: 800, fontSize: 13, color: C.dark }}>{r.name}</span>
    </div>
    <div style={{ display: "flex", gap: 8, fontSize: 10, color: C.sub, marginBottom: 8 }}>
      {r.cook_time && <span>⏱ {r.cook_time}</span>}
      {r.servings && <span>🍽 {r.servings} Serving{r.servings > 1 ? "s" : ""}</span>}
      {r.calories && <span>🔥 {r.calories} kcal</span>}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 8 }}>
      <div>
        <div style={{ fontSize: 9.5, fontWeight: 800, color: C.brand, marginBottom: 2 }}>Ingredients</div>
        <ul style={{ margin: 0, paddingLeft: 12, fontSize: 9.5, color: C.sub, lineHeight: 1.4 }}>
          {list(r.ingredients).slice(0, 7).map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      </div>
      <div>
        <div style={{ fontSize: 9.5, fontWeight: 800, color: C.brand, marginBottom: 2 }}>How to make</div>
        <div style={{ fontSize: 9.5, color: C.sub, lineHeight: 1.4 }}>{list(r.steps).slice(0, 4).join(" ")}</div>
      </div>
    </div>
    {r.macros && (
      <div style={{ display: "flex", gap: 10, marginTop: 8, borderTop: `1px solid ${C.line}`, paddingTop: 6, fontSize: 9.5, fontWeight: 700 }}>
        <span style={{ color: C.gold }}>Carbs {r.macros.carbs_g}g</span>
        <span style={{ color: C.brand }}>Protein {r.macros.protein_g}g</span>
        <span style={{ color: "#c0392b" }}>Fat {r.macros.fat_g}g</span>
        <span style={{ color: C.sub }}>Fiber {r.macros.fiber_g}g</span>
      </div>
    )}
  </div>
);

const RecipesPage = ({ plan, page }) => {
  const s = plan?.summary || {};
  const recipes = list(plan?.featured_recipes).slice(0, 6);
  const tips = ["Use minimal oil for cooking.", "Steam or boil vegetables to retain nutrients.", "Choose whole grains over refined grains.", "Add more herbs & spices for flavor.", "Stay consistent with portion sizes."];
  const portions = ["1 cup cooked grains", "1 cup vegetables", "1 palm protein (paneer, dal, chana, etc.)", "1 thumb healthy fats (nuts, seeds, oil)"];
  return (
    <Page>
      <PageHeader calorie={s.calorie_range} />
      <Title pre="FEATURED RECIPES" />
      <p style={{ fontSize: 13, color: C.sub, margin: "2px 0 14px" }}>Simple, delicious & nutritious recipes from your meal plan.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {recipes.map((r, i) => <RecipeCard key={i} r={r} idx={i} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14, marginTop: 14 }}>
        <SectionCard icon="👩‍🍳" title="COOKING TIPS">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 10px" }}>
            {tips.map((t) => <div key={t} style={{ fontSize: 11, color: C.ink, display: "flex", gap: 6 }}><span style={{ color: C.brand }}>✔</span>{t}</div>)}
          </div>
        </SectionCard>
        <SectionCard icon="🍽️" title="PORTION GUIDE (1 SERVING)">
          <ol style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: C.sub, lineHeight: 1.6 }}>
            {portions.map((p) => <li key={p}>{p}</li>)}
          </ol>
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
        <SectionCard icon="🔄" title="SMART SWAPS FOR BETTER CHOICES">
          <div style={{ display: "flex", fontSize: 10, fontWeight: 800, color: C.brand, padding: "4px 0", borderBottom: `1px solid ${C.line}` }}><span style={{ flex: 1 }}>INSTEAD OF</span><span style={{ flex: 1 }}>CHOOSE THIS</span></div>
          {(swaps.length ? swaps : [{ instead_of: "Chips", choose: "Roasted Makhana" }, { instead_of: "Cola / Soft Drinks", choose: "Lemon / Herbal Water" }, { instead_of: "White Bread", choose: "Whole Wheat Bread" }, { instead_of: "Sugar", choose: "Jaggery / Honey" }, { instead_of: "Fried Snacks", choose: "Roasted Chana" }, { instead_of: "Ice Cream", choose: "Greek Yogurt / Fruit Bowl" }, { instead_of: "White Rice", choose: "Brown Rice / Millets" }]).map((sw, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", fontSize: 11.5, padding: "7px 0", borderBottom: `1px solid ${C.line}` }}>
              <span style={{ flex: 1, color: C.ink }}>{sw.instead_of}</span>
              <span style={{ color: C.brand, fontWeight: 800, margin: "0 6px" }}>→</span>
              <span style={{ flex: 1, color: C.brand, fontWeight: 700 }}>{sw.choose}</span>
            </div>
          ))}
        </SectionCard>

        <SectionCard icon="💧" title="HYDRATION GUIDE">
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
        <SectionCard icon="💧" title="BENEFITS OF HYDRATION">
          <div style={{ fontSize: 10.5, color: C.sub, lineHeight: 1.7 }}>Boosts Metabolism • Detoxifies Body • Improves Digestion • Enhances Skin Health • Improves Energy Levels</div>
        </SectionCard>
        <SectionCard icon="🩺" title="GENERAL TIPS">
          <ul style={{ margin: 0, paddingLeft: 14, fontSize: 10, color: C.sub, lineHeight: 1.45 }}>
            {(tips.length ? tips : ["Prioritize protein at every meal.", "Include colorful vegetables and fruits.", "Stay consistent with meal timings.", "Listen to hunger and fullness cues."]).slice(0, 5).map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </SectionCard>
        <SectionCard icon="✅" title="HYDRATION CHECKLIST">
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
  const track = ["Followed Meal Plan", "Stayed Hydrated", "Worked Out", "Slept Well", "Stress Managed"];
  const measures = ["Weight (kg)", "Waist (cm)", "Hips (cm)", "Chest (cm)", "Arms (cm)", "Thighs (cm)"];
  return (
    <Page>
      <PageHeader calorie={s.calorie_range} />
      <Title pre="PROGRESS TRACKER &" accent="MEASUREMENTS" />
      <p style={{ fontSize: 13, color: C.sub, margin: "2px 0 16px" }}>Track your journey. Celebrate small wins. Stay consistent!</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <SectionCard icon="📊" title="WEEKLY PROGRESS TRACKER">
          <div style={{ fontSize: 10.5, color: C.sub, marginBottom: 8 }}>Rate each week on a scale of 1–5 (1 = Needs Improvement, 5 = Excellent)</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
            <thead><tr><th style={{ textAlign: "left", color: C.brand, padding: 4 }}>AREAS</th>{wk.map((w) => <th key={w} style={{ color: C.sub, padding: 4 }}>{w}</th>)}</tr></thead>
            <tbody>{track.map((t) => <tr key={t}><td style={{ padding: 4, color: C.ink }}>{t}</td>{wk.map((w) => <td key={w} style={{ textAlign: "center", color: C.faint, padding: 4 }}>① ② ③ ④ ⑤</td>)}</tr>)}</tbody>
          </table>
        </SectionCard>
        <SectionCard icon="⚖️" title="WEIGHT TRACKER">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}>
            <thead><tr>{["Week", "Date", "Weight (kg)", "Change (kg)"].map((h) => <th key={h} style={{ color: C.brand, padding: 5, textAlign: "left", borderBottom: `1px solid ${C.line}` }}>{h}</th>)}</tr></thead>
            <tbody>{wk.map((w) => <tr key={w}><td style={{ padding: 7, color: C.ink, borderBottom: `1px solid ${C.line}` }}>{w}</td><td style={{ borderBottom: `1px solid ${C.line}` }}>____</td><td style={{ borderBottom: `1px solid ${C.line}` }}>____</td><td style={{ borderBottom: `1px solid ${C.line}` }}>____</td></tr>)}</tbody>
          </table>
          <div style={{ marginTop: 10, background: C.soft, borderRadius: 8, padding: "8px 10px", fontSize: 10.5, color: C.ink }}>🏆 Remember: Progress is progress, no matter how small. You're becoming a better version of you!</div>
        </SectionCard>
      </div>

      <SectionCard icon="📏" title="MEASUREMENTS TRACKER" style={{ marginTop: 14 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}>
          <thead><tr><th style={{ textAlign: "left", color: C.brand, padding: 5 }}>MEASUREMENTS</th>{[...wk, "Change"].map((w) => <th key={w} style={{ color: C.sub, padding: 5 }}>{w}</th>)}</tr></thead>
          <tbody>{measures.map((m) => <tr key={m}><td style={{ padding: 6, color: C.ink, borderBottom: `1px solid ${C.line}` }}>{m}</td>{[...wk, "Δ"].map((w) => <td key={w} style={{ textAlign: "center", color: C.faint, borderBottom: `1px solid ${C.line}`, padding: 6 }}>____</td>)}</tr>)}</tbody>
        </table>
      </SectionCard>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        <SectionCard icon="⭐" title="NON-SCALE VICTORIES">
          <div style={{ fontSize: 10.5, color: C.sub, lineHeight: 1.7 }}>✓ More energy through the day ✓ Better sleep quality ✓ Improved digestion ✓ Clearer skin ✓ Better mood & focus ✓ Reduced cravings ✓ More confidence ✓ Healthy habits stick!</div>
        </SectionCard>
        <SectionCard icon="📸" title="PHOTOS SPEAK LOUDER!">
          <div style={{ fontSize: 10.5, color: C.sub, marginBottom: 8 }}>Click your progress photos once a week and see the amazing transformation.</div>
          <div style={{ display: "flex", gap: 8 }}>{wk.map((w) => <div key={w} style={{ flex: 1, height: 54, background: C.soft, borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: 9, color: C.faint }}>📷<span>{w}</span></div>)}</div>
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
    { n: "Dt. Priya Sharma", r: "Clinical Dietitian & Nutritionist", e: "6+ Years of Experience", sp: "Weight Management, PCOS, Gut Health" },
    { n: "Dt. Neha Verma", r: "Sports Nutritionist", e: "5+ Years of Experience", sp: "Sports Nutrition, Muscle Gain, Fat Loss" },
    { n: "Dt. Anjali Mehta", r: "Holistic Nutritionist", e: "7+ Years of Experience", sp: "Hormonal Health, Thyroid, Weight Loss" },
    { n: "Dt. Rahul Gupta", r: "Nutrition Consultant", e: "4+ Years of Experience", sp: "Diabetes Care, Heart Health, Family Nutrition" },
  ];
  const why = [["🎧", "One-on-one expert attention"], ["📋", "Personalized advice based on progress"], ["🎯", "Faster results with professional support"], ["🌱", "Sustainable habits that last a lifetime"], ["📈", "Track, adjust & achieve your goals"]];
  return (
    <Page>
      <PageHeader calorie={s.calorie_range} />
      <h1 style={{ margin: "16px 0 2px", fontSize: 32, fontWeight: 800, color: C.dark }}>WE'RE HERE TO GUIDE YOU,</h1>
      <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: C.gold }}>EVERY STEP OF THE WAY.</h1>
      <p style={{ fontSize: 12.5, color: C.sub, margin: "10px 0 18px", maxWidth: 520 }}>At MeriDiet, we believe that the right guidance makes all the difference. Our expert dietitians are here to help you eat better, feel better and live better.</p>

      <h2 style={{ textAlign: "center", fontSize: 18, fontWeight: 800, color: C.brand, margin: "0 0 14px" }}>🌿 MEET OUR EXPERT DIETITIANS 🌿</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
        {docs.map((d) => (
          <div key={d.n} style={{ background: C.card, borderRadius: 12, padding: 12, textAlign: "center" }}>
            <div style={{ width: 70, height: 70, borderRadius: "50%", margin: "0 auto 8px", background: "linear-gradient(135deg,#1E8E3E,#7bd389)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>👩‍⚕️</div>
            <div style={{ fontWeight: 800, fontSize: 12.5, color: C.dark }}>{d.n}</div>
            <div style={{ fontSize: 10, color: C.brand, marginBottom: 6 }}>{d.r}</div>
            <div style={{ fontSize: 9.5, color: C.sub, lineHeight: 1.4 }}>✓ {d.e}<br />✓ {d.sp}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.banner, borderRadius: 14, padding: "18px 22px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 0" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>TAKE PERSONALIZED SESSIONS</div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>WITH OUR EXPERT DIETITIANS</div>
          <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>Get clarity. Get guidance. Get results.</div>
        </div>
        <div style={{ background: C.gold, borderRadius: 12, padding: "12px 20px", textAlign: "center", color: C.dark }}>
          <div style={{ fontSize: 10, fontWeight: 700 }}>ONLY</div>
          <div style={{ fontSize: 30, fontWeight: 900 }}>₹2499</div>
          <div style={{ fontSize: 9, fontWeight: 700 }}>FOR 2 SESSIONS IN A MONTH</div>
        </div>
      </div>

      <h3 style={{ textAlign: "center", fontSize: 14, fontWeight: 800, color: C.dark, margin: "0 0 12px" }}>WHY TAKE DIETITIAN SESSIONS?</h3>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        {why.map((w) => (
          <div key={w[1]} style={{ textAlign: "center", width: 130 }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{w[0]}</div>
            <div style={{ fontSize: 10, color: C.sub, lineHeight: 1.35 }}>{w[1]}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.soft, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 13, color: C.dark }}>🌐 Ready to Transform Your Health?</div>
          <div style={{ fontSize: 11, color: C.sub }}>Book your personalized sessions now on our website</div>
        </div>
        <div style={{ background: C.brand, color: "#fff", borderRadius: 20, padding: "8px 22px", fontWeight: 800, fontSize: 13 }}>www.meridiet.in</div>
      </div>

      <div style={{ textAlign: "center", fontFamily: "'Segoe Script',cursive", fontStyle: "italic", color: C.brand, fontSize: 18, marginTop: 14 }}>You don't have to do it alone. We're here for you! ♡</div>

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
      <SupplementsPage plan={plan} page={next()} />
      <DietitiansPage plan={plan} page={next()} />
    </div>
  );
});
DietPlanDocument.displayName = "DietPlanDocument";

export default DietPlanDocument;
export { PAGE_W, PAGE_H };
