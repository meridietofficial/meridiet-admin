import axiosInstance from "../helpers/api/instance";

const BASE = "admin/appointments";

const appointmentService = {
  list:                  (params) => axiosInstance.get(`${BASE}/online?${params}`),
  get:                   (id)     => axiosInstance.get(`${BASE}/${id}`),
  pendingApproval:       (params) => axiosInstance.get(`${BASE}/pending-approval?${params}`),
  paymentHistory:        (params) => axiosInstance.get(`${BASE}/payment-history?${params}`),
  approvePayment:        (id)     => axiosInstance.post(`${BASE}/${id}/approve-payment`),
  noShowQueue:           (params) => axiosInstance.get(`${BASE}/no-show-queue?${params}`),
  markNoShow:            (id, body) => axiosInstance.post(`${BASE}/${id}/mark-no-show`, body),
  pendingNoShowApproval: (params) => axiosInstance.get(`${BASE}/pending-no-show-approval?${params}`),
  approveNoShow:         (id)     => axiosInstance.post(`${BASE}/${id}/approve-no-show`),
};

export default appointmentService;
