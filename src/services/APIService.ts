import { Logger } from "../utils/logger";
import { APIInterceptor } from "./APIInterceptor";

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface APIError {
  status: number;
  message: string;
  data?: any;
}

export class APIService {
  private static instance: APIService;
  private baseURL: string;
  private timeout: number = 10000; // 10 seconds

  private constructor(baseURL: string = "http://localhost:8080") {
    this.baseURL = baseURL;
    Logger.info("APIService initialized");
  }

  /**
   * Singleton pattern - chỉ có 1 instance APIService
   */
  static getInstance(baseURL?: string): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService(baseURL);
    }
    return APIService.instance;
  }

  /**
   * GET request
   */
  async get<T = any>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<APIResponse<T>> {
    return this.request<T>("GET", endpoint, undefined, options);
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestInit,
  ): Promise<APIResponse<T>> {
    return this.request<T>("POST", endpoint, body, options);
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestInit,
  ): Promise<APIResponse<T>> {
    return this.request<T>("PUT", endpoint, body, options);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<APIResponse<T>> {
    return this.request<T>("DELETE", endpoint, undefined, options);
  }

  /**
   * Core request method
   */
  private async request<T = any>(
    method: string,
    endpoint: string,
    body?: any,
    options?: RequestInit,
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: any = {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    };

    const config: RequestInit = {
      method,
      headers,
      ...options,
    };

    // Thêm body cho POST, PUT
    if (body && (method === "POST" || method === "PUT")) {
      config.body = JSON.stringify(body);
    }

    try {
      // Gọi interceptor beforeRequest
      const interceptedRequest = await APIInterceptor.beforeRequest({
        method,
        url,
        headers,
        body,
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      let response = await fetch(url, {
        method: interceptedRequest.method,
        headers: interceptedRequest.headers,
        body: interceptedRequest.body
          ? JSON.stringify(interceptedRequest.body)
          : config.body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Gọi interceptor afterResponse (xử lý 401, refresh token, etc)
      const processedResponse = await APIInterceptor.afterResponse(response, {
        method: interceptedRequest.method,
        url,
        headers: interceptedRequest.headers,
        body,
      });

      if (!processedResponse) {
        // Interceptor xử lý lỗi (401, refresh fail, etc)
        return {
          success: false,
          message: "Request failed - authentication error",
          error: "AUTH_ERROR",
        };
      }

      response = processedResponse;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        Logger.error(`✗ ${method} ${endpoint}`, errorData);
        return {
          success: false,
          message: errorData.message || `HTTP ${response.status}`,
          error: errorData,
        };
      }

      const data: T = await response.json();
      Logger.debug(`✓ ${method} ${endpoint}`, data);

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      const errorInfo = APIInterceptor.handleError(error);
      Logger.error(`✗ ${method} ${endpoint}`, errorInfo);

      return {
        success: false,
        message: errorInfo.message,
        error: errorInfo.error,
      };
    }
  }

  /**
   * Set timeout
   */
  setTimeout(ms: number) {
    this.timeout = ms;
  }

  /**
   * Get current base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Set new base URL
   */
  setBaseURL(url: string) {
    this.baseURL = url;
    Logger.info(`API Base URL changed to: ${url}`);
  }
}

// Export singleton instance
export const api = APIService.getInstance();
