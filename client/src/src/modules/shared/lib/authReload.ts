import api from "./api.js";

export function reloadAuth() {
  const token = localStorage.getItem("ari_token");

  // מנקה את כל ה-headers של axios
  api.defaults.headers.common = {};

  // טוען מחדש את הטוקן התקין
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
}
