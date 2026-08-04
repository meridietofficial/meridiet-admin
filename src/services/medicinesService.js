import axiosInstance from "../helpers/api/instance";

const BASE = "admin/medicines";

const medicinesService = {
  list: () => axiosInstance.get(BASE),
  create: (body) => axiosInstance.post(BASE, body),
  update: (id, body) => axiosInstance.put(`${BASE}/${id}`, body),
  remove: (id) => axiosInstance.delete(`${BASE}/${id}`),
};

export default medicinesService;
