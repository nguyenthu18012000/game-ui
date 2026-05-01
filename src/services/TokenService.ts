import { Logger } from "../utils/logger";

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  iat: number;
  exp: number;
}

const STORAGE_KEY = "game_tokens";

/**
 * TokenService - Quản lý lưu trữ token
 * Dùng localStorage để persist token khi reload page
 */
export class TokenService {
  /**
   * Lưu token vào localStorage
   */
  static saveTokens(tokens: AuthTokens) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
      Logger.info("Tokens saved to localStorage");
    } catch (error) {
      Logger.error("Failed to save tokens", error);
    }
  }

  /**
   * Lấy token từ localStorage
   */
  static getTokens(): AuthTokens | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;

      const tokens = JSON.parse(data) as AuthTokens;
      return tokens;
    } catch (error) {
      Logger.error("Failed to parse tokens", error);
      return null;
    }
  }

  /**
   * Lấy access token
   */
  static getAccessToken(): string | null {
    const tokens = TokenService.getTokens();
    return tokens?.accessToken || null;
  }

  /**
   * Lấy refresh token
   */
  static getRefreshToken(): string | null {
    const tokens = TokenService.getTokens();
    return tokens?.refreshToken || null;
  }

  /**
   * Kiểm tra token còn hạn không
   * Decode JWT để kiểm tra expiration
   */
  static isTokenValid(): boolean {
    const token = TokenService.getAccessToken();
    if (!token) return false;

    try {
      const payload = TokenService.decodeToken(token);
      if (!payload) return false;

      const now = Math.floor(Date.now() / 1000);
      // Refresh nếu còn 5 phút trước khi hết hạn
      return payload.exp > now + 300;
    } catch {
      return false;
    }
  }

  /**
   * Kiểm tra token hết hạn không
   */
  static isTokenExpired(): boolean {
    const token = TokenService.getAccessToken();
    if (!token) return true;

    try {
      const payload = TokenService.decodeToken(token);
      if (!payload) return true;

      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch {
      return true;
    }
  }

  /**
   * Xóa token (logout)
   */
  static clearTokens() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      Logger.info("Tokens cleared");
    } catch (error) {
      Logger.error("Failed to clear tokens", error);
    }
  }

  /**
   * Decode JWT token (không verify signature, chỉ decode)
   */
  static decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload as TokenPayload;
    } catch (error) {
      Logger.error("Failed to decode token", error);
      return null;
    }
  }

  /**
   * Lấy user info từ token
   */
  static getUserFromToken(): TokenPayload | null {
    const token = TokenService.getAccessToken();
    if (!token) return null;

    return TokenService.decodeToken(token);
  }
}
