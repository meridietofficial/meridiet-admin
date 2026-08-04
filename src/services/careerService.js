import axios from "../helpers/api/instance";

const base = "admin/career";

export const listJobs = (query = "") =>
  axios.get(`${base}/jobs${query ? `?${query}` : ""}`);

export const createJob = (body) =>
  axios.post(`${base}/jobs`, body);

export const getJob = (id) =>
  axios.get(`${base}/jobs/${id}`);

export const updateJob = (id, body) =>
  axios.put(`${base}/jobs/${id}`, body);

export const deleteJob = (id) =>
  axios.delete(`${base}/jobs/${id}`);

export const toggleJob = (id) =>
  axios.patch(`${base}/jobs/${id}/toggle`);

export const listApplications = (query = "") =>
  axios.get(`${base}/applications${query ? `?${query}` : ""}`);

export const getApplication = (id) =>
  axios.get(`${base}/applications/${id}`);

export const updateApplicationStatus = (id, body) =>
  axios.patch(`${base}/applications/${id}/status`, body);
