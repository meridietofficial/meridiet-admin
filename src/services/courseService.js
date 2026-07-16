import axiosInstance from "../helpers/api/instance";

const BASE = "admin/course";

const courseService = {
  stats:               ()          => axiosInstance.get(`${BASE}/stats`),
  enquiries:           (params)    => axiosInstance.get(`${BASE}/enquiries?${params}`),
  getEnquiry:          (id)        => axiosInstance.get(`${BASE}/enquiries/${id}`),
  updateEnquiryStatus: (id, body)  => axiosInstance.patch(`${BASE}/enquiries/${id}/status`, body),
  enrollments:         (params)    => axiosInstance.get(`${BASE}/enrollments?${params}`),
  getEnrollment:       (id)        => axiosInstance.get(`${BASE}/enrollments/${id}`),
};

export default courseService;
