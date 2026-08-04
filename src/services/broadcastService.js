import API from "../helpers/api";
import axios from "../helpers/api/instance";

export const fetchRecipients = ({ type = "all", search = "", page = 1, limit = 50 } = {}) => {
  const params = new URLSearchParams({ type, page, limit });
  if (search) params.set("search", search);
  return axios.get(`admin/broadcast/recipients?${params}`);
};

export const sendBroadcast = ({ recipient_type, recipient_ids, subject, message }) =>
  API.apiPost("broadcastSend", { recipient_type, recipient_ids, subject, message });

export const fetchHistory = ({ page = 1, limit = 20 } = {}) =>
  axios.get(`admin/broadcast/history?page=${page}&limit=${limit}`);

export const fetchBroadcastDetail = ({ id, page = 1, limit = 50 }) =>
  axios.get(`admin/broadcast/history/${id}?page=${page}&limit=${limit}`);
