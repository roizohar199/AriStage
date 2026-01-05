export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN;

if (!API_ORIGIN) {
  throw new Error("VITE_API_ORIGIN is not defined");
}

export const API_BASE_URL = `${API_ORIGIN}/api`;
