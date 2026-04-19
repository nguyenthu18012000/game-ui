import { Logger } from "../utils/logger";
import { TokenService } from "./TokenService";

const AUTH_API_URL = "http://localhost:8080/auth";

/**
 * AuthService - Quản lý authentication
 */
export class AuthService {
  /**
   * Login - gọi API + lưu token
   */
  static async login(username: string, password: string) {
    try {
      const response = await fetch(`${AUTH_API_URL}/login`, {
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

      const data = await response.json();

      // Lưu token (response: { accessToken, refreshToken })
      TokenService.saveTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      Logger.info("Login successful");
      return { success: true, data };
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
      const response = await fetch(`${AUTH_API_URL}/register`, {
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

      const data = await response.json();

      // Lưu token (response: { accessToken, refreshToken })
      TokenService.saveTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      Logger.info("Registration successful");
      return { success: true, data };
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

      const response = await fetch(`${AUTH_API_URL}/refresh`, {
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
