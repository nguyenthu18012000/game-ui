import { Logger } from "../utils/logger";
import { TokenService } from "./TokenService";
import { AuthService } from "./AuthService";

export interface InterceptorRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  options?: RequestInit;
}

export interface InterceptorResponse {
  ok: boolean;
  status: number;
  data: unknown;
}

/**
 * APIInterceptor - Xử lý request/response intercepting
 * - Thêm token vào header
 * - Xử lý 401 Unauthorized (refresh token)
 * - Xử lý error
 */
export class APIInterceptor {
  /**
   * Xử lý request trước khi gửi
   */
  static async beforeRequest(request: InterceptorRequest): Promise<InterceptorRequest> {
    // Thêm token vào header
    const token = TokenService.getAccessToken();
    if (token) {
      request.headers["Authorization"] = `Bearer ${token}`;
      Logger.debug("Token added to request");
    }

    return request;
  }

  /**
   * Xử lý response sau khi nhận
   */
  static async afterResponse(
    response: Response,
    originalRequest: InterceptorRequest,
  ): Promise<Response | null> {
    // Nếu 401 - token hết hạn
    if (response.status === 401) {
      Logger.warn("Got 401 - Token expired, trying to refresh");

      // Thử refresh token
      const refreshed = await AuthService.refreshAccessToken();

      if (refreshed.success) {
        Logger.info("Token refreshed successfully, retrying request");

        // Retry request với token mới
        const newRequest = { ...originalRequest };
        const newToken = TokenService.getAccessToken();

        if (newToken) {
          newRequest.headers["Authorization"] = `Bearer ${newToken}`;

          // Gửi lại request
          try {
            const retryInit: RequestInit = {
              ...newRequest.options,
              method: newRequest.method,
              headers: newRequest.headers,
            };
            const retryBody =
              newRequest.body !== undefined
                ? JSON.stringify(newRequest.body)
                : newRequest.options?.body;
            if (retryBody !== undefined) retryInit.body = retryBody;
            const retryResponse = await fetch(newRequest.url, retryInit);

            return retryResponse;
          } catch (error) {
            Logger.error("Failed to retry request", error);
            return null;
          }
        }
      } else {
        // Token refresh thất bại - cần login lại
        Logger.error("Token refresh failed - need to login again");
        TokenService.clearTokens();
        // Có thể trigger event để quay về LoginScene
        window.dispatchEvent(new CustomEvent("auth:token-expired"));
        return null;
      }
    }

    // Nếu status ok, trả về response
    if (response.ok) {
      return response;
    }

    // Xử lý error khác
    return response;
  }

  /**
   * Xử lý error
   */
  static handleError(error: unknown): { message: string; error: string } {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      return {
        message: "Network error - check server connection",
        error: "NETWORK_ERROR",
      };
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        message: "Request timeout",
        error: "TIMEOUT",
      };
    }

    return {
      message: error instanceof Error ? error.message : "Request failed",
      error: error instanceof Error ? error.name : "UNKNOWN_ERROR",
    };
  }
}
