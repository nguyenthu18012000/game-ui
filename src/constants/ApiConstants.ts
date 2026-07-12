const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
);

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "auth/login",
    REGISTER: "auth/register",
    REFRESH: "auth/refresh",
  },
  CHARACTER: {
    PROFILE: "character/profile",
    CREATE: "character/create",
  },
} as const;
