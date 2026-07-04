import { useEffect, useRef } from "react";

/**
 * Saves window scroll position to sessionStorage on beforeunload,
 * then restores it after `ready` becomes true (i.e. data has loaded).
 *
 * @param {boolean} ready - set to true once the page content is fully rendered
 * @param {string}  key   - unique key per page (defaults to window.location.pathname)
 */
export function useScrollRestoration(ready, key) {
  const storageKey = `scroll_${key || (typeof window !== "undefined" ? window.location.pathname : "")}`;
  const restored = useRef(false);

  // Save position just before refresh/close
  useEffect(() => {
    const save = () => sessionStorage.setItem(storageKey, String(window.scrollY));
    window.addEventListener("beforeunload", save);
    return () => window.removeEventListener("beforeunload", save);
  }, [storageKey]);

  // Also save on every scroll so it stays fresh even without a clean unload
  useEffect(() => {
    let timer;
    const save = () => {
      clearTimeout(timer);
      timer = setTimeout(() => sessionStorage.setItem(storageKey, String(window.scrollY)), 150);
    };
    window.addEventListener("scroll", save, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", save);
    };
  }, [storageKey]);

  // Restore after content is ready
  useEffect(() => {
    if (!ready || restored.current) return;
    const saved = sessionStorage.getItem(storageKey);
    if (!saved) return;
    restored.current = true;
    // Small delay to let layout settle after render
    const t = setTimeout(() => window.scrollTo({ top: Number(saved), behavior: "instant" }), 80);
    return () => clearTimeout(t);
  }, [ready, storageKey]);
}
