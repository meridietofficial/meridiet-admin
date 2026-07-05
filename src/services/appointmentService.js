import axiosInstance from "../helpers/api/instance";

const BASE = "admin/appointments";

const appointmentService = {
  list: (params) => axiosInstance.get(`${BASE}?${params}`),
  get: (id) => axiosInstance.get(`${BASE}/${id}`),
};

export default appointmentService;
