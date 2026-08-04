import { forwardRef, createContext, useContext } from "react";

export const PAGE_W = 794;
export const PAGE_H = 1123;

const FONT = "'Segoe UI', Arial, sans-serif";
const C = {
  green:  "#1E8E3E",
  dark:   "#1a1a1a",
  gray:   "#6b7280",
  faint:  "#9ca3af",
  bg:     "#f7faf7",
  border: "#dde8df",
  white:  "#ffffff",
};

const BrandCtx = createContext(null);
const useBrand = () => useContext(BrandCtx);

function humanize(v) {
  if (v == null || v === "") return "";
  return String(v).split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function asList(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === "string" && v.trim()) return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}
const todayStr = () =>
  new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// ── Letterhead ────────────────────────────────────────────────────────────────

function Letterhead({ compact = false }) {
  const brand = useBrand();
  const h = compact ? 36 : 54;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      paddingBottom: compact ? 8 : 14,
      borderBottom: `2.5px solid ${C.green}`,
      marginBottom: compact ? 8 : 18,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {brand?.logoUrl && (
          <img src={brand.logoUrl} alt="" crossOrigin="anonymous"
            style={{ height: h, width: "auto", objectFit: "contain", maxWidth: 180 }} />
        )}
        <div>
          {brand?.name && (
            <div style={{ fontWeight: 800, fontSize: compact ? 12 : 17, color: C.dark, lineHeight: 1.15 }}>
              {brand.name}
            </div>
          )}
          {!compact && brand?.degrees?.length > 0 && (
            <div style={{ fontSize: 9.5, color: C.gray, marginTop: 2 }}>
              {brand.degrees.map((d) => d.degree).join(", ")}
            </div>
          )}
          {!compact && brand?.specialization?.length > 0 && (
            <div style={{ fontSize: 9.5, color: C.green, marginTop: 1 }}>
              {humanize(brand.specialization[0])}
            </div>
          )}
        </div>
      </div>
      <div style={{ textAlign: "right", fontSize: compact ? 8.5 : 10, color: C.gray, lineHeight: 1.7 }}>
        {brand?.email && <div>✉ {brand.email}</div>}
        {brand?.phone && <div>✆ {brand.phone}</div>}
        {(brand?.city || brand?.state) && (
          <div>📍 {[brand.city, brand.state].filter(Boolean).join(", ")}</div>
        )}
        {brand?.registrationNumber && <div>Reg: {brand.registrationNumber}</div>}
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function NoteBox({ title, children, style = {} }) {
  return (
    <div style={{
      border: `1px solid ${C.border}`, borderRadius: 4,
      padding: "7px 12px", fontSize: 10.5, color: C.gray, lineHeight: 1.65,
      ...style,
    }}>
      {title && <div style={{ fontWeight: 700, color: C.dark, marginBottom: 3 }}>{title}</div>}
      {children}
    </div>
  );
}

const sTd = {
  label: { padding: "7px 10px", color: C.gray, fontSize: 10, fontWeight: 600, width: "18%", verticalAlign: "top" },
  value: { padding: "7px 10px", fontWeight: 700, fontSize: 12, width: "32%", verticalAlign: "top" },
};

// ── Cover page ────────────────────────────────────────────────────────────────

function CoverPage({ plan }) {
  const brand = useBrand();
  const s  = plan?.summary || {};
  const cp = plan?.client_profile || {};
  const p  = cp.personal_information || {};
  const v  = cp.current_vitals || {};
  const g  = cp.health_and_fitness_goals || {};
  const lf = cp.lifestyle_overview || {};
  const md = cp.medical_information || {};
  const di = cp.dietary_information || {};

  const name    = s.client_name || p.full_name || "—";
  const goals   = asList(g.goals);
  const bmiStr  = v.bmi != null
    ? `${Number(v.bmi).toFixed(1)}${v.bmi_category ? ` — ${v.bmi_category}` : ""}`
    : "—";
  const heightStr = p.height ? String(p.height) : null;
  const weightStr = v.weight_kg ? `${v.weight_kg} kg` : null;

  const infoRows = [
    ["Patient Name",    name,
     "Date Issued",     todayStr()],
    ["Age / Gender",    [p.age ? `${p.age} yrs` : null, humanize(p.gender)].filter(Boolean).join(", ") || "—",
     "Plan Duration",   s.plan_duration || "—"],
    ["Height / Weight", [heightStr, weightStr].filter(Boolean).join(" · ") || "—",
     "Diet Type",       humanize(di.diet_type || s.diet_type) || "—"],
    ["BMI",             bmiStr,
     "Calorie Target",  s.calorie_range || "—"],
    ["Goal",            (goals.length ? goals : [s.primary_goal]).filter(Boolean).map(humanize).join(", ") || "—",
     "Activity Level",  humanize(lf.activity_level) || "—"],
    ["Protein Target",  s.protein_target_g ? `${s.protein_target_g}g / day` : "—",
     "Carbs / Fat",     [s.carbs_target_g ? `${s.carbs_target_g}g carbs` : null, s.fat_target_g ? `${s.fat_target_g}g fat` : null].filter(Boolean).join(" · ") || "—"],
  ];

  const hasMedical   = asList(md.medical_conditions).length > 0 || asList(md.food_allergies).length > 0 || g.health_notes || di.foods_dislike;
  const hasTips      = asList(plan?.general_tips).length > 0;
  const hasHydration = !!plan?.hydration_guide;

  return (
    <div className="dp-page" style={{
      width: PAGE_W, height: PAGE_H, background: C.white, fontFamily: FONT,
      color: C.dark, boxSizing: "border-box", padding: 40,
      position: "relative", overflow: "hidden",
      margin: "0 auto 24px", boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
    }}>
      <Letterhead />

      <div style={{
        background: C.green, color: C.white, textAlign: "center",
        padding: "8px 0", borderRadius: 4,
        fontWeight: 800, fontSize: 13, letterSpacing: 1.5, marginBottom: 20,
      }}>
        PERSONALISED DIET PLAN
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 18, border: `1px solid ${C.border}` }}>
        <tbody>
          {infoRows.map(([l1, v1, l2, v2], i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? C.bg : C.white }}>
              <td style={sTd.label}>{l1}</td>
              <td style={{ ...sTd.value, borderRight: `1px solid ${C.border}`, color: l1 === "BMI" ? C.green : C.dark }}>{v1}</td>
              <td style={sTd.label}>{l2}</td>
              <td style={{ ...sTd.value, color: l2 === "Calorie Target" ? C.green : C.dark }}>{v2}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {hasMedical && (
        <NoteBox title="Clinical Notes" style={{ marginBottom: 10 }}>
          {asList(md.medical_conditions).length > 0 && (
            <div><b>Conditions:</b> {asList(md.medical_conditions).map(humanize).join(", ")}</div>
          )}
          {asList(md.food_allergies).length > 0 && (
            <div><b>Allergies / Avoid:</b> {asList(md.food_allergies).map(humanize).join(", ")}</div>
          )}
          {di.foods_dislike && <div><b>Dislikes:</b> {di.foods_dislike}</div>}
          {g.health_notes && <div><b>Notes:</b> {g.health_notes}</div>}
        </NoteBox>
      )}

      {hasHydration && (
        <NoteBox style={{ marginBottom: 10 }}>
          <b>Hydration: </b>{plan.hydration_guide}
        </NoteBox>
      )}

      {hasTips && (
        <NoteBox title="General Tips" style={{ marginBottom: 10 }}>
          {asList(plan.general_tips).slice(0, 6).map((t, i) => (
            <div key={i}>• {t}</div>
          ))}
        </NoteBox>
      )}

      <div style={{
        position: "absolute", bottom: 36, left: 40, right: 40,
        borderTop: `1px solid ${C.border}`, paddingTop: 12,
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
      }}>
        <div style={{ fontSize: 10, color: C.gray, lineHeight: 1.7 }}>
          <div style={{ fontWeight: 800, color: C.dark, fontSize: 11 }}>{brand?.name || ""}</div>
          {brand?.degrees?.slice(0, 3).map((d, i) => (
            <div key={i}>{d.degree}{d.institute ? `, ${d.institute}` : ""}</div>
          ))}
          {brand?.experience && <div>{brand.experience} Experience</div>}
          {brand?.registrationNumber && <div>Reg. No: {brand.registrationNumber}</div>}
        </div>
        <div style={{ textAlign: "right", fontSize: 10, color: C.gray }}>
          <div style={{ width: 150, height: 46, borderBottom: `1px solid ${C.dark}`, marginBottom: 4 }} />
          <div>Signature &amp; Stamp</div>
          <div style={{ marginTop: 3 }}>Date: _______________</div>
        </div>
      </div>
    </div>
  );
}

// ── Week page ─────────────────────────────────────────────────────────────────

const MEAL_COLS = [
  { key: "breakfast", label: "Breakfast"       },
  { key: "lunch",     label: "Lunch"           },
  { key: "snack",     label: "Snack / Evening" },
  { key: "dinner",    label: "Dinner"          },
];

const sCell = {
  th: { padding: "6px 8px", color: "#ffffff", fontWeight: 700, fontSize: 10.5, textAlign: "left" },
  td: { padding: "6px 8px", borderBottom: `1px solid ${C.border}`, fontSize: 10, verticalAlign: "top" },
};

function WeekPage({ week, weekIndex, plan, page }) {
  const brand = useBrand();
  const s    = plan?.summary || {};
  const days = week?.days || [];
  const start = days[0]?.day ?? weekIndex * 7 + 1;
  const end   = days[days.length - 1]?.day ?? start + days.length - 1;

  return (
    <div className="dp-page" style={{
      width: PAGE_W, height: PAGE_H, background: C.white, fontFamily: FONT,
      color: C.dark, boxSizing: "border-box", padding: "28px 36px",
      position: "relative", overflow: "hidden",
      margin: "0 auto 24px", boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
    }}>
      <Letterhead compact />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div>
          <span style={{ fontWeight: 800, fontSize: 13, color: C.green }}>
            WEEK {week?.week || weekIndex + 1}
          </span>
          {week?.title && (
            <span style={{ fontSize: 11, color: C.gray, marginLeft: 8 }}>— {week.title}</span>
          )}
          <span style={{ fontSize: 9.5, color: C.faint, marginLeft: 8 }}>
            Day {start} – Day {end}
          </span>
        </div>
        <span style={{ fontSize: 9.5, color: C.gray, display: "flex", gap: 14 }}>
          {s.calorie_range && (
            <span>Calories: <b style={{ color: C.green }}>{s.calorie_range}</b></span>
          )}
          {s.protein_target_g && (
            <span>Protein: <b style={{ color: "#3b82f6" }}>{s.protein_target_g}g / day</b></span>
          )}
        </span>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: 10 }}>
        <colgroup>
          <col style={{ width: "7%" }} />
          <col style={{ width: "24.25%" }} />
          <col style={{ width: "24.25%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "24.5%" }} />
        </colgroup>
        <thead>
          <tr style={{ background: C.green }}>
            <th style={sCell.th}>Day</th>
            {MEAL_COLS.map((m) => <th key={m.key} style={sCell.th}>{m.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {days.map((day, di) => {
            const dayKcal = day.total_kcal ?? MEAL_COLS.reduce((sum, m) => {
              const items = Array.isArray(day[m.key]) ? day[m.key] : [];
              return sum + items.reduce((s, f) => s + (f.kcal ?? 0), 0);
            }, 0);
            const dayProtein = day.total_protein_g ?? MEAL_COLS.reduce((sum, m) => {
              const items = Array.isArray(day[m.key]) ? day[m.key] : [];
              return sum + items.reduce((s, f) => s + (f.protein_g ?? 0), 0);
            }, 0);

            return (
              <tr key={di} style={{ background: di % 2 === 0 ? C.white : C.bg, verticalAlign: "top" }}>
                <td style={{ ...sCell.td, textAlign: "center", borderRight: `1px solid ${C.border}`, padding: "6px 4px" }}>
                  <div style={{ fontWeight: 800, color: C.green, fontSize: 12 }}>{day.day}</div>
                  {dayKcal > 0 && <div style={{ fontSize: 7.5, color: C.faint, marginTop: 1 }}>{dayKcal} kcal</div>}
                  {dayProtein > 0 && <div style={{ fontSize: 7.5, color: "#3b82f6", marginTop: 1 }}>{Math.round(dayProtein)}g pro</div>}
                </td>
                {MEAL_COLS.map((m, mi) => {
                  const items  = Array.isArray(day[m.key]) ? day[m.key] : [];
                  const mKcal  = items.reduce((s, f) => s + (f.kcal ?? 0), 0);
                  return (
                    <td key={m.key} style={{ ...sCell.td, borderRight: mi < 3 ? `1px solid ${C.border}` : undefined }}>
                      {day.meal_timing?.[m.key] && (
                        <div style={{ fontSize: 7, color: C.faint, fontWeight: 600, marginBottom: 2, letterSpacing: 0.2 }}>
                          {day.meal_timing[m.key]}
                        </div>
                      )}
                      {items.length === 0 ? (
                        <span style={{ color: C.faint }}>—</span>
                      ) : (
                        <>
                          {items.map((item, fi) => (
                            <div key={fi} style={{ lineHeight: 1.35, marginBottom: 1 }}>
                              <span style={{ color: C.green, marginRight: 2 }}>•</span>
                              {item.food || ""}
                              {item.quantity && <span style={{ color: C.faint }}> {item.quantity}</span>}
                            </div>
                          ))}
                          {mKcal > 0 && (
                            <div style={{ fontSize: 7.5, color: C.faint, marginTop: 2, textAlign: "right" }}>
                              {mKcal} kcal
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {week?.what_to_expect && (
        <div style={{
          marginTop: 7, fontSize: 9.5, color: C.gray,
          border: `1px solid ${C.border}`, borderRadius: 3, padding: "5px 10px",
        }}>
          <b style={{ color: C.dark }}>Note: </b>{week.what_to_expect}
        </div>
      )}

      <div style={{
        position: "absolute", bottom: 20, left: 36, right: 36,
        display: "flex", justifyContent: "space-between",
        borderTop: `1px solid ${C.border}`, paddingTop: 6,
        fontSize: 8.5, color: C.faint,
      }}>
        <span>{brand?.name || "Diet Plan"}</span>
        <span>Page {page}</span>
      </div>
    </div>
  );
}

// ── Document assembly ─────────────────────────────────────────────────────────

const WhiteLabelDietPlanDocument = forwardRef(({ plan, dietitian }, ref) => {
  if (!plan) return null;

  const brand = dietitian ? {
    name:               dietitian.full_name,
    email:              dietitian.email,
    phone:              [dietitian.phone_code, dietitian.phone_number].filter(Boolean).join(" "),
    logoUrl:            dietitian.documents?.logo_url || null,
    city:               dietitian.city,
    state:              dietitian.state,
    bio:                dietitian.bio,
    experience:         dietitian.experience,
    specialization:     dietitian.specialization || [],
    degrees:            dietitian.degrees || [],
    registrationNumber: dietitian.registration_number,
  } : null;

  const weeks = plan.weeks || [];
  let pageNo = 1;

  return (
    <BrandCtx.Provider value={brand}>
      <div ref={ref} style={{ width: PAGE_W, margin: "0 auto" }}>
        <CoverPage plan={plan} />
        {weeks.map((w, i) => (
          <WeekPage key={i} week={w} weekIndex={i} plan={plan} page={++pageNo} />
        ))}
      </div>
    </BrandCtx.Provider>
  );
});

WhiteLabelDietPlanDocument.displayName = "WhiteLabelDietPlanDocument";
export default WhiteLabelDietPlanDocument;
