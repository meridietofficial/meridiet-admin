import axiosInstance from "../helpers/api/instance";

const BASE = "admin/earnings";

const earningsService = {
  list: (params) => axiosInstance.get(`${BASE}?${params}`),
};

export default earningsService;
