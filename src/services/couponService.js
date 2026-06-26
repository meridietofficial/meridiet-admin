import axiosInstance from "../helpers/api/instance";

// No leading slash — so axios appends to baseURL (/api/v1) correctly.
// The interceptor in helpers/api/index.js is already registered on this
// shared instance by the time any component renders.
const BASE = "admin/coupons";

const couponService = {
  list: (params) => axiosInstance.get(`${BASE}?${params}`),
  get: (id) => axiosInstance.get(`${BASE}/${id}`),
  create: (body) => axiosInstance.post(BASE, body),
  update: (id, body) => axiosInstance.patch(`${BASE}/${id}`, body),
  deactivate: (id) => axiosInstance.delete(`${BASE}/${id}`),
  usages: (id, params) => axiosInstance.get(`${BASE}/${id}/usages?${params}`),
};

export default couponService;
