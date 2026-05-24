// src/utils/jwt.ts
import { jwtDecode } from "jwt-decode";
import axios from "./axios";

/**
 * بررسی معتبر بودن توکن بر اساس زمان انقضا (exp)
 */
const isTokenValid = (accessToken: string): boolean => {
  if (!accessToken) return false;

  try {
    const decoded: { exp?: number } = jwtDecode(accessToken);
    
    if (!decoded.exp) {
      console.error("Token does not contain an expiration time.");
      return false;
    }

    const currentTime = Date.now() / 1000; // زمان فعلی به ثانیه
    return decoded.exp > currentTime;
  } catch (err) {
    console.error("Failed to decode token:", err);
    return false;
  }
};

/**
 * مدیریت نشست کاربر (ذخیره در LocalStorage و تنظیم هدر Axios)
 */
const setSession = (accessToken?: string | null): void => {
  if (typeof accessToken === "string" && accessToken.trim() !== "") {
    // ذخیره توکن با کلید accessToken برای هماهنگی با پاسخ سرور
    localStorage.setItem("accessToken", accessToken);
    
    // تنظیم هدر Authorization برای تمام درخواست‌های بعدی Axios
    axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  } else {
    // پاکسازی نشست در صورت خروج یا انقضا
    localStorage.removeItem("accessToken");
    delete axios.defaults.headers.common.Authorization;
  }
};

export { isTokenValid, setSession };
