import { Logger } from "../utils/logger";
import { TokenService } from "./TokenService";
import { API_BASE_URL, API_ENDPOINTS } from "../constants/ApiConstants";

const getApiUrl = (endpoint: string) => `${API_BASE_URL}/${endpoint}`;

/**
 * AuthService - Quản lý authentication
 */
export class AuthService {
  /**
   * Login - gọi API + lưu token
   */
  static async login(username: string, password: string) {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.AUTH.LOGIN), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const body = await response.json();

      // Response được wrap: { code, message, data: { accessToken, refreshToken } }
      const payload = body.data ?? body;
      const accessToken =
        payload.accessToken ?? payload.token ?? payload.access_token;
      const refreshToken = payload.refreshToken ?? payload.refresh_token ?? undefined;

      if (!accessToken) {
        console.error(
          "[AuthService] accessToken không tìm thấy trong response:",
          body,
        );
        throw new Error("accessToken not found in response");
      }

      TokenService.saveTokens({ accessToken, refreshToken: refreshToken ?? undefined });

      Logger.info("Login successful");
      return { success: true, data: body };
    } catch (error: any) {
      Logger.error("Login error", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Register - tạo account + lưu token
   */
  static async register(username: string, password: string) {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.AUTH.REGISTER), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      const body = await response.json();

      // Response được wrap: { code, message, data: { accessToken, refreshToken } }
      const payload = body.data ?? body;
      const accessToken =
        payload.accessToken ?? payload.token ?? payload.access_token;
      const refreshToken = payload.refreshToken ?? payload.refresh_token ?? undefined;

      if (!accessToken) {
        console.error(
          "[AuthService] accessToken không tìm thấy trong response:",
          body,
        );
        throw new Error("accessToken not found in response");
      }

      TokenService.saveTokens({ accessToken, refreshToken: refreshToken ?? undefined });

      Logger.info("Registration successful");
      return { success: true, data: body };
    } catch (error: any) {
      Logger.error("Register error", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken() {
    try {
      const refreshToken = TokenService.getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token");
      }

      const response = await fetch(getApiUrl(API_ENDPOINTS.AUTH.REFRESH), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();

      // Update token (response: { accessToken, refreshToken })
      TokenService.saveTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      Logger.info("Token refreshed");
      return { success: true, data };
    } catch (error: any) {
      Logger.error("Token refresh error", error.message);
      // Token hết hạn, cần login lại
      TokenService.clearTokens();
      return { success: false, error: error.message };
    }
  }

  /**
   * Logout
   */
  static logout() {
    TokenService.clearTokens();
    Logger.info("Logged out");
  }

  /**
   * Kiểm tra user đã login chưa
   */
  static isLoggedIn(): boolean {
    return (
      TokenService.getAccessToken() !== null && !TokenService.isTokenExpired()
    );
  }

  /**
   * Lấy current user
   */
  static getCurrentUser() {
    return TokenService.getUserFromToken();
  }
}
