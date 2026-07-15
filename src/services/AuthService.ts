import { Logger } from "../utils/logger";
import { TokenService, type AuthTokens } from "./TokenService";
import { API_BASE_URL, API_ENDPOINTS } from "../constants/ApiConstants";

const getApiUrl = (endpoint: string) => `${API_BASE_URL}/${endpoint}`;

type AuthResult = { success: true; data: unknown } | { success: false; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getString = (value: Record<string, unknown>, ...keys: string[]): string | undefined => {
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }

  return undefined;
};

export const extractTokens = (responseBody: unknown, fallbackRefreshToken?: string): AuthTokens => {
  if (!isRecord(responseBody)) {
    throw new Error("Invalid authentication response");
  }

  const payload = isRecord(responseBody.data) ? responseBody.data : responseBody;
  const accessToken = getString(payload, "accessToken", "token", "access_token");
  const refreshToken = getString(payload, "refreshToken", "refresh_token") ?? fallbackRefreshToken;

  if (!accessToken) {
    throw new Error("Access token not found in authentication response");
  }

  return refreshToken ? { accessToken, refreshToken } : { accessToken };
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Authentication request failed";

const getResponseError = async (response: Response, fallbackMessage: string): Promise<string> => {
  const body: unknown = await response.json().catch(() => null);
  return isRecord(body) && typeof body.message === "string" ? body.message : fallbackMessage;
};

/**
 * AuthService - Quản lý authentication
 */
export class AuthService {
  private static refreshPromise: Promise<AuthResult> | null = null;

  /**
   * Login - gọi API + lưu token
   */
  static async login(username: string, password: string): Promise<AuthResult> {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.AUTH.LOGIN), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error(await getResponseError(response, "Login failed"));
      }

      const body: unknown = await response.json();
      TokenService.saveTokens(extractTokens(body));

      Logger.info("Login successful");
      return { success: true, data: body };
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      Logger.error("Login error", message);
      return { success: false, error: message };
    }
  }

  /**
   * Register - tạo account + lưu token
   */
  static async register(username: string, password: string): Promise<AuthResult> {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.AUTH.REGISTER), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error(await getResponseError(response, "Registration failed"));
      }

      const body: unknown = await response.json();
      TokenService.saveTokens(extractTokens(body));

      Logger.info("Registration successful");
      return { success: true, data: body };
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      Logger.error("Register error", message);
      return { success: false, error: message };
    }
  }

  /**
   * Refresh access token
   */
  static refreshAccessToken(): Promise<AuthResult> {
    if (!AuthService.refreshPromise) {
      AuthService.refreshPromise = AuthService.performTokenRefresh().finally(() => {
        AuthService.refreshPromise = null;
      });
    }

    return AuthService.refreshPromise;
  }

  private static async performTokenRefresh(): Promise<AuthResult> {
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
        throw new Error(await getResponseError(response, "Token refresh failed"));
      }

      const body: unknown = await response.json();
      TokenService.saveTokens(extractTokens(body, refreshToken));

      Logger.info("Token refreshed");
      return { success: true, data: body };
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      Logger.error("Token refresh error", message);
      // Token hết hạn, cần login lại
      TokenService.clearTokens();
      return { success: false, error: message };
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
    return TokenService.getAccessToken() !== null && !TokenService.isTokenExpired();
  }

  /**
   * Lấy current user
   */
  static getCurrentUser() {
    return TokenService.getUserFromToken();
  }
}
