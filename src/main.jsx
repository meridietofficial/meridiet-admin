import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("__next")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
