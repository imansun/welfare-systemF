export const APP_NAME = "Tailux";
export const APP_KEY = "tailux";

// Redirect Paths
export const REDIRECT_URL_KEY = "redirect";
export const AUTH_LOGIN_PATH = "/auth/login";

// مسیر اصلی اپ (صفحه بعد از لاگین)
export const HOME_PATH = "/";

// مسیر ورودی برای کاربران غیرلاگین
export const GHOST_ENTRY_PATH = AUTH_LOGIN_PATH;

// Navigation Types
export type NavigationType = "root" | "group" | "collapse" | "item" | "divider";

export const COLORS = [
  "neutral",
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
] as const;

export type ColorType = (typeof COLORS)[number];
