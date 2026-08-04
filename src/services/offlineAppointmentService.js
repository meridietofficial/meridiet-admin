import axiosInstance from "../helpers/api/instance";

const BASE = "admin/appointments";

const offlineAppointmentService = {
  list:          (params) => axiosInstance.get(`${BASE}/offline?${params}`),
  get:           (id)     => axiosInstance.get(`${BASE}/${id}`),
  markNoShow:    (id, body) => axiosInstance.post(`${BASE}/${id}/mark-no-show`, body),
  approveNoShow: (id)     => axiosInstance.post(`${BASE}/${id}/approve-no-show`),
};

export default offlineAppointmentService;
