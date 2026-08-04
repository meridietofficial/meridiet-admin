import axiosInstance from "../helpers/api/instance";

const offlineDietChartService = {
  list: (params) => axiosInstance.get(`admin/diet-plans/manual?${params}`),
  get:  (id)     => axiosInstance.get(`admin/diet-plans/manual/${id}`),
};

export default offlineDietChartService;
