import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "../../helpers/useRouter";
import { LuArrowLeft, LuDownload, LuPencil } from "react-icons/lu";
import toast from "react-hot-toast";
import axios from "../../helpers/api/instance";
import WhiteLabelDietPlanDocument, { PAGE_W } from "../../components/diet-plan/WhiteLabelDietPlanDocument";
import { useScrollRestoration } from "../../helpers/useScrollRestoration";

// ── Adapter: API response → WhiteLabelDietPlanDocument format ─────────────────

function adaptPlan(data) {
  const plan = data?.plan || data || {};
  const form = plan.form || plan.form_data || {};

  const heightCm = form.height
    ? (form.height_unit === "ft_in" ? Math.round(Number(form.height) * 30.48) : Number(form.height))
    : null;
  const weightKg = form.weight
    ? (form.weight_unit === "lbs" ? +(Number(form.weight) * 0.453592).toFixed(1) : Number(form.weight))
    : null;

  return {
    form_id: plan.id,
    summary: {
      client_name:      plan.client_name || form.full_name || "Client",
      plan_duration:    plan.plan_duration,
      diet_type:        plan.diet_type || form.diet_type,
      calorie_range:    plan.calorie_range,
      primary_goal:     plan.primary_goal,
      protein_target_g: plan.protein_target_g,
      carbs_target_g:   plan.carbs_target_g,
      fat_target_g:     plan.fat_target_g,
    },
    client_profile: {
      personal_information: {
        full_name:     form.full_name || plan.client_name || "—",
        age:           form.age,
        gender:        form.gender,
        date_of_birth: form.dob || form.date_of_birth,
        height:        form.height ? `${form.height} ${form.height_unit === "ft_in" ? "ft" : (form.height_unit || "cm")}` : null,
        phone:         form.whatsapp || form.phone || null,
        email:         form.email || null,
        city:          form.city  || null,
        state:         form.state || null,
      },
      current_vitals: {
        weight_kg:    weightKg,
        height_cm:    heightCm,
        bmi:          plan.bmi,
        bmi_category: plan.bmi_category,
        bmr_kcal:     plan.bmr,
        tdee_kcal:    plan.tdee,
      },
      health_and_fitness_goals: {
        goals:        form.goals || (plan.primary_goal ? [plan.primary_goal] : []),
        health_notes: form.health_notes || null,
      },
      lifestyle_overview: {
        activity_level:   form.activity_level,
        work_type:        form.work_type,
        workout_type:     form.workout_type,
        smoke_alcohol:    form.smoke_alcohol,
        digestive_health: form.digestive_health,
      },
      medical_information: {
        medical_conditions: form.medical_conditions,
        other_condition:    form.other_condition,
        on_medication:      form.on_medication,
        medications:        form.medications,
        food_allergies:     form.food_allergies,
      },
      dietary_information: {
        diet_type:          form.diet_type || plan.diet_type,
        cuisine_preference: form.cuisine_preference,
        favorite_foods:     form.favorite_foods,
        foods_dislike:      form.foods_dislike,
      },
    },
    general_tips:     plan.general_tips     || [],
    featured_recipes: plan.featured_recipes || [],
    hydration_guide:  plan.hydration_guide  || null,
    weeks: (plan.weeks || []).map((week, wi) => ({
      week:           week.week ?? wi + 1,
      title:          week.title,
      description:    week.description,
      focus:          week.focus          || [],
      what_to_expect: week.what_to_expect,
      smart_swaps:    week.smart_swaps    || [],
      weekly_notes:   week.weekly_notes   || [],
      days: (week.days || []).map((day, di) => ({
        day:             day.day ?? (wi * 7 + di + 1),
        total_kcal:      day.total_kcal,
        total_protein_g: day.total_protein_g,
        meal_timing:     day.meal_timing || {},
        breakfast:       day.breakfast   || [],
        lunch:           day.lunch       || [],
        snack:           day.snack       || [],
        dinner:          day.dinner      || [],
      })),
    })),
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DietitianPlanView() {
  const router = useRouter();
  const { id } = router.query;

  const [plan,        setPlan]        = useState(null);
  const [dietitian,   setDietitian]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [downloading, setDownloading] = useState(false);

  const wrapRef = useRef(null);
  const docRef  = useRef(null);
  const [scale, setScale] = useState(1);
  const [docH,  setDocH]  = useState(0);

  useScrollRestoration(!loading && !!plan);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios.get(`admin/diet-plans/manual/${id}`)
      .then((res) => {
        const data = res?.data?.data || res?.data || {};
        setPlan(adaptPlan(data));
        setDietitian(data.plan?.dietitian || null);
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to load plan."))
      .finally(() => setLoading(false));
  }, [id]);

  const measure = useCallback(() => {
    const avail = wrapRef.current?.clientWidth || PAGE_W;
    setScale(Math.min(1, avail / PAGE_W));
    if (docRef.current) setDocH(docRef.current.scrollHeight);
  }, []);

  useLayoutEffect(() => {
    measure();
    const t = setTimeout(measure, 200);
    window.addEventListener("resize", measure);
    let ro;
    if (docRef.current && "ResizeObserver" in window) {
      ro = new ResizeObserver(() => measure());
      ro.observe(docRef.current);
    }
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      if (ro) ro.disconnect();
    };
  }, [plan, measure]);

  const handleDownload = async () => {
    if (!docRef.current || downloading) return;
    setDownloading(true);
    const tid = toast.loading("Generating PDF…");
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      const pages = docRef.current.querySelectorAll(".dp-page");
      const pdf   = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
      const W     = pdf.internal.pageSize.getWidth();
      const H     = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2, useCORS: true, backgroundColor: "#ffffff",
          logging: false, windowWidth: PAGE_W,
        });
        const img = canvas.toDataURL("image/jpeg", 0.92);
        if (i > 0) pdf.addPage();
        pdf.addImage(img, "JPEG", 0, 0, W, H, undefined, "FAST");
      }

      const name = (plan?.summary?.client_name || "client").toString().replace(/\s+/g, "-");
      pdf.save(`DietPlan-${name}-${id}.pdf`);
      toast.success("PDF downloaded.", { id: tid });
    } catch {
      toast.error("Could not generate PDF.", { id: tid });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ padding: "4px 0" }}>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => router.back()}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 42, padding: "0 16px", borderRadius: 10, border: "1px solid #e5e5e5", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#444" }}>
          <LuArrowLeft size={17} /> Back
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h4 className="fw700 mb-0" style={{ fontSize: "1.1rem" }}>
            <span style={{ color: "#111827" }}>DIET</span>
            <span style={{ color: "#1E8E3E" }}> PLAN</span>
            {plan?.summary?.client_name && (
              <span style={{ color: "#999", fontWeight: 500, fontSize: 14 }}> — {plan.summary.client_name}</span>
            )}
          </h4>
          {/* Edit button — adjust route as needed */}
          <button onClick={() => router.push(`/dashboard/dietitian-plans/${id}`)}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 42, padding: "0 16px", borderRadius: 10, border: "1px solid #1E8E3E", background: "#fff", color: "#1E8E3E", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
            <LuPencil size={14} /> Edit Plan
          </button>
          <button onClick={handleDownload} disabled={loading || downloading || !plan}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 42, padding: "0 20px", borderRadius: 10, border: "none", background: loading || !plan ? "#9cc5a9" : "#1E8E3E", color: "#fff", cursor: loading || downloading || !plan ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, boxShadow: "0 2px 8px rgba(30,142,62,0.3)" }}>
            <LuDownload size={17} /> {downloading ? "Generating…" : "Download PDF"}
          </button>
        </div>
      </div>

      {/* Document viewer */}
      <div ref={wrapRef} style={{ width: "100%", overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "100px 20px" }}>
            <div className="spinner-border" style={{ color: "#1E8E3E", width: "2.5rem", height: "2.5rem" }} role="status" />
            <p style={{ marginTop: 16, color: "#999", fontSize: 14, fontWeight: 500 }}>Loading diet plan…</p>
          </div>
        ) : !plan ? (
          <div style={{ textAlign: "center", padding: "100px 20px", color: "#999" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🥗</div>
            <h5 style={{ fontWeight: 700, color: "#333" }}>Diet plan unavailable</h5>
            <p style={{ fontSize: 14 }}>Could not load this plan. Please go back and try again.</p>
          </div>
        ) : (
          <div style={{
            width: PAGE_W * scale,
            height: docH ? docH * scale : "auto",
            margin: "0 auto",
            position: "relative",
            overflow: "hidden",
          }}>
            <div ref={docRef} style={{
              width: PAGE_W,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              position: "absolute",
              top: 0,
              left: 0,
            }}>
              <WhiteLabelDietPlanDocument plan={plan} dietitian={dietitian} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
