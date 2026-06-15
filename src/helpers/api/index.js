import axios from "./instance";
import * as auth from "../auth";
import apiKeys from "./apiKeys";

const getUrlByKey = (key) => {
  return apiKeys[key];
};

class API {
  static apiGet = async (key, args) => {
    if (typeof args === "string") {
      return axios.get(getUrlByKey(key) + args, { withCredentials: false });
    }
    return axios.get(getUrlByKey(key), { data: args, withCredentials: false });
  };

  static apiGetByKey = async (key, args, query) => {
    if (typeof args === "string") {
      return axios.get(getUrlByKey(key) + args, { withCredentials: false });
    }
    return axios.get(`${getUrlByKey(key)}/query?${query}`, {
      data: args,
      withCredentials: false,
    });
  };

  static apiPost = async (key, args, headers) => {
    return axios.post(getUrlByKey(key), args, headers);
  };

  static apiPut = async (key, args, headers) => {
    return axios.put(getUrlByKey(key), args, headers);
  };

  static apiPatch = async (key, args, headers) => {
    return axios.patch(getUrlByKey(key), args, headers);
  };

  static apiDel = async (key, config = {}) => {
    return axios.delete(getUrlByKey(key), config);
  };
}

export default API;

// ── Request interceptor: attach token on every request ──────────────────────
axios.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        // Axios v1.x: set via the headers object setter
        config.headers["Authorization"] = token;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: refresh the access token on 401, then retry ─────────
// On a 401 we attempt a single token refresh against admin/refresh-token and
// replay the original request. We only log the user out if the refresh itself
// fails (or there is no refresh token to use). Concurrent 401s are queued so we
// refresh once and replay them all with the new token.
let isRefreshing = false;
let refreshQueue = [];

const flushQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const requestUrl = originalRequest.url || "";

    if (status !== 401) {
      return Promise.reject(error);
    }

    // Wrong current password also returns 401 — never a session problem.
    if (requestUrl.includes("change-password")) {
      return Promise.reject(error);
    }

    // Never try to refresh the auth endpoints themselves.
    const isAuthEndpoint =
      requestUrl.includes("refresh-token") || requestUrl.includes("login");
    if (isAuthEndpoint || originalRequest._retry) {
      if (!isAuthEndpoint) auth.logout();
      return Promise.reject(error);
    }

    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem("refreshToken")
        : null;

    // No refresh token (old session) → nothing to recover, log out.
    if (!refreshToken) {
      auth.logout();
      return Promise.reject(error);
    }

    // A refresh is already in flight — queue this request until it resolves.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers["Authorization"] = token;
        return axios(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(getUrlByKey("refreshToken"), {
        refreshToken,
      });
      const newAccess = `Bearer ${data?.data?.tokens?.accessToken}`;
      const newRefresh = data?.data?.tokens?.refreshToken;

      localStorage.setItem("accessToken", newAccess);
      if (newRefresh) localStorage.setItem("refreshToken", newRefresh);
      setAuthorization();

      flushQueue(null, newAccess);
      originalRequest.headers["Authorization"] = newAccess;
      return axios(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      auth.logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export const setAuthorization = () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      axios.defaults.headers.common["Authorization"] = token;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }
};

// Set on module load
setAuthorization();
