import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "../../helpers/useRouter";
import { LuArrowLeft, LuDownload } from "react-icons/lu";
import toast from "react-hot-toast";
import API, { setAuthorization } from "../../helpers/api";
import DietPlanDocument, { PAGE_W } from "../../components/diet-plan/DietPlanDocument";

export default function DietPlanPage() {
  const router = useRouter();
  const { id } = router.query;

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const wrapRef = useRef(null); // visible viewport
  const docRef = useRef(null); // natural-size (794px) document
  const [scale, setScale] = useState(1);
  const [docH, setDocH] = useState(0);

  // ── fetch plan ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setAuthorization();
    setLoading(true);
    API.apiGet("dietFormPreview", `/${id}/preview`)
      .then((res) => {
        const data = res?.data?.data || null;
        if (!data) throw new Error("empty");
        setPlan(data);
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to load diet plan."))
      .finally(() => setLoading(false));
  }, [id]);

  // ── responsive scaling of the fixed 794px document ──────────────────────
  const measure = useCallback(() => {
    const avail = wrapRef.current?.clientWidth || PAGE_W;
    setScale(Math.min(1, avail / PAGE_W));
    if (docRef.current) setDocH(docRef.current.scrollHeight);
  }, []);

  useLayoutEffect(() => {
    measure();
    const t = setTimeout(measure, 200); // after fonts settle
    window.addEventListener("resize", measure);
    // Re-measure whenever the document's own height changes (images / fonts
    // finishing loading) so the scaled preview is never clipped or mis-sized.
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

  // ── one-click PDF (image-based, pixel-identical to the on-screen design) ──
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
      const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
      const W = pdf.internal.pageSize.getWidth();
      const H = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        const canvas = await html2canvas(pages[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          windowWidth: PAGE_W,
        });
        const img = canvas.toDataURL("image/jpeg", 0.92);
        if (i > 0) pdf.addPage();
        pdf.addImage(img, "JPEG", 0, 0, W, H, undefined, "FAST");

        // The page is captured as a flat image, so add real clickable link
        // annotations on top of any [data-pdf-link] elements (email / phone / website).
        const pageRect = pages[i].getBoundingClientRect();
        const sx = W / pageRect.width;
        const sy = H / pageRect.height;
        pages[i].querySelectorAll("[data-pdf-link]").forEach((el) => {
          const url = el.getAttribute("href");
          if (!url) return;
          const r = el.getBoundingClientRect();
          pdf.link((r.left - pageRect.left) * sx, (r.top - pageRect.top) * sy, r.width * sx, r.height * sy, { url });
        });
      }
      const name = (plan?.summary?.client_name || "client").toString().replace(/\s+/g, "-");
      pdf.save(`MeriDiet-Plan-${name}-${id}.pdf`);
      toast.success("PDF downloaded.", { id: tid });
    } catch (e) {
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

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h4 className="fw700 mb-0" style={{ fontSize: "1.1rem" }}>
            <span style={{ color: "#111827" }}>DIET</span><span style={{ color: "#1E8E3E" }}> PLAN</span>
            {plan?.summary?.client_name && <span style={{ color: "#999", fontWeight: 500, fontSize: 14 }}> — {plan.summary.client_name}</span>}
          </h4>
          <button onClick={handleDownload} disabled={loading || downloading || !plan}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 42, padding: "0 20px", borderRadius: 10, border: "none", background: loading || !plan ? "#9cc5a9" : "#1E8E3E", color: "#fff", cursor: loading || downloading || !plan ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, boxShadow: "0 2px 8px rgba(30,142,62,0.3)" }}>
            <LuDownload size={17} /> {downloading ? "Generating…" : "Download PDF"}
          </button>
        </div>
      </div>

      {/* Viewer */}
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
            <p style={{ fontSize: 14 }}>We couldn't load this plan. Please go back and try again.</p>
          </div>
        ) : (
          <div style={{ width: PAGE_W * scale, height: docH ? docH * scale : "auto", margin: "0 auto", position: "relative", overflow: "hidden" }}>
            <div ref={docRef} style={{ width: PAGE_W, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
              <DietPlanDocument plan={plan} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
