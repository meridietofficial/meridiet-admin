import axios from "axios";

// const HOST = "http://localhost:5000/";
const HOST = "https://api.meridiet.com/";
// const HOST = "http://3.127.48.228/";
const version = "api/v1";

const API = HOST + version;

const instance = axios.create({
  baseURL: API,
});

export default instance;
