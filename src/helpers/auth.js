import decode from "jwt-decode";
import { Base64 } from "js-base64";
import { setAuthorization } from "./api";

export const encodeData = (payload) => {
  try {
    let dataString = Base64.btoa(encodeURI(JSON.stringify(payload)));
    return dataString;
  } catch (error) {
    return null;
  }
};

export const decodeData = (token) => {
  try {
    let payload = JSON.parse(decodeURI(Base64.atob(token)));
    return payload;
  } catch (error) {
    return null;
  }
};

export function login(token, data,user, appId = "") {
  localStorage.setItem("accessToken", token);
  localStorage.setItem("userData", JSON.stringify(user)); 

  setAuthorization();
  return true;
}

export function getLoggedInUser() {
  try {
    // Check if we're in the browser environment
    if (typeof window === "undefined") {
      return null;
    }
    const userString = localStorage.getItem("userData");
    return userString ? JSON.parse(userString) : null;
  } catch (e) {
    console.error("Failed to parse userData:", e);
    return null;
  }
}



export function updateUserData(updatedFields) {
  try {
    if (typeof window === "undefined") return;
    const current = getLoggedInUser() || {};
    const updated = { ...current, ...updatedFields };
    localStorage.setItem("userData", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("profileUpdated", { detail: updatedFields }));
  } catch (e) {
    console.error("Failed to update userData:", e);
  }
}

export function logout() {
  localStorage.removeItem("accessToken");

  setAuthorization();
  window.location.href = `${window.location.origin}/`;
  return true;
}

export function isAuth() {
  try {
    // Check if we're in the browser environment
    if (typeof window === "undefined") {
      return false;
    }
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
      return accessToken;
    }

    return false;
  } catch (err) {
    return false;
  }
}
