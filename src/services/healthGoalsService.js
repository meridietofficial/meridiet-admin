import axiosInstance from "../helpers/api/instance";

const BASE = "admin/health-goals";

const healthGoalsService = {
  list: () => axiosInstance.get(BASE),
  create: (body) => axiosInstance.post(BASE, body),
  update: (id, body) => axiosInstance.put(`${BASE}/${id}`, body),
  remove: (id) => axiosInstance.delete(`${BASE}/${id}`),
};

export default healthGoalsService;
