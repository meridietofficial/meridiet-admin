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

// ── Response interceptor: only logout on confirmed token errors ──────────────
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || "";
      const errorMsg =
        error.response?.data?.error?.errorMessage ||
        error.response?.data?.message ||
        "";

      // Skip logout for change-password (wrong current password = 401 too)
      if (requestUrl.includes("change-password")) {
        return Promise.reject(error);
      }

      // Only logout if the error message clearly indicates a token/auth problem
      const isTokenError =
        errorMsg.toLowerCase().includes("token") ||
        errorMsg.toLowerCase().includes("unauthorized") ||
        errorMsg.toLowerCase().includes("invalid") ||
        errorMsg.toLowerCase().includes("expired") ||
        errorMsg === "";

      if (isTokenError) {
        auth.logout();
      }
    }
    return Promise.reject(error);
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
