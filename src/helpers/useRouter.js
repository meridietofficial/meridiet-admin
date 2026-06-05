// A thin shim that mimics the Next.js `useRouter()` API on top of
// react-router-dom, so components migrated from Next.js keep working with no
// behavioural change.
import { useNavigate, useLocation, useParams, useSearchParams } from "react-router-dom";

export function useRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();

  // Next exposes both dynamic route params and query-string params on `query`.
  const query = { ...params };
  for (const [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  return {
    push: (href) => navigate(href),
    replace: (href) => navigate(href, { replace: true }),
    back: () => navigate(-1),
    reload: () => window.location.reload(),
    prefetch: () => Promise.resolve(),
    pathname: location.pathname,
    asPath: location.pathname + location.search,
    query,
    // Next's route-change events have no SPA equivalent here; no-op so existing
    // subscribers don't crash.
    events: {
      on: () => {},
      off: () => {},
      emit: () => {},
    },
  };
}

export default useRouter;
