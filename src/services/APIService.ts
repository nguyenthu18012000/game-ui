import { Logger } from "../utils/logger";
import { APIInterceptor } from "./APIInterceptor";
import { API_BASE_URL } from "../constants/ApiConstants";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: unknown;
}

export interface APIError {
  status: number;
  message: string;
  data?: unknown;
}

const buildApiUrl = (baseURL: string, endpoint: string) => {
  const normalizedEndpoint = endpoint.replace(/^\/+/, "");
  return `${baseURL}/${normalizedEndpoint}`;
};

export class APIService {
  private static instance: APIService;
  private baseURL: string;
  private timeout: number = 10000; // 10 seconds

  private constructor(baseURL: string = API_BASE_URL) {
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
  async get<T = unknown>(endpoint: string, options?: RequestInit): Promise<APIResponse<T>> {
    return this.request<T>("GET", endpoint, undefined, options);
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit,
  ): Promise<APIResponse<T>> {
    return this.request<T>("POST", endpoint, body, options);
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit,
  ): Promise<APIResponse<T>> {
    return this.request<T>("PUT", endpoint, body, options);
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(endpoint: string, options?: RequestInit): Promise<APIResponse<T>> {
    return this.request<T>("DELETE", endpoint, undefined, options);
  }

  /**
   * Core request method
   */
  private async request<T = unknown>(
    method: string,
    endpoint: string,
    body?: unknown,
    options?: RequestInit,
  ): Promise<APIResponse<T>> {
    const url = buildApiUrl(this.baseURL, endpoint);
    const headers = Object.fromEntries(new Headers(options?.headers).entries());
    if (!headers["content-type"]) {
      headers["content-type"] = "application/json";
    }

    const config: RequestInit = {
      ...options,
      method,
      headers,
    };

    // Thêm body cho POST, PUT
    if (body !== undefined && (method === "POST" || method === "PUT")) {
      config.body = JSON.stringify(body);
    }

    try {
      // Gọi interceptor beforeRequest
      const interceptedRequest = await APIInterceptor.beforeRequest({
        method,
        url,
        headers,
        body,
        options: config,
      });

      const controller = new AbortController();
      const callerSignal = options?.signal;
      const abortFromCaller = () => controller.abort(callerSignal?.reason);
      if (callerSignal?.aborted) {
        abortFromCaller();
      } else {
        callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
      }
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      let response: Response;
      try {
        const requestInit: RequestInit = {
          ...interceptedRequest.options,
          method: interceptedRequest.method,
          headers: interceptedRequest.headers,
          signal: controller.signal,
        };
        const requestBody =
          interceptedRequest.body !== undefined
            ? JSON.stringify(interceptedRequest.body)
            : interceptedRequest.options?.body;
        if (requestBody !== undefined) requestInit.body = requestBody;
        response = await fetch(url, requestInit);
      } finally {
        clearTimeout(timeoutId);
        callerSignal?.removeEventListener("abort", abortFromCaller);
      }

      // Gọi interceptor afterResponse (xử lý 401, refresh token, etc)
      const processedResponse = await APIInterceptor.afterResponse(response, {
        method: interceptedRequest.method,
        url,
        headers: interceptedRequest.headers,
        body,
        options: config,
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
        const errorData: unknown = await response.json().catch(() => null);
        Logger.error(`✗ ${method} ${endpoint}`, errorData);
        return {
          success: false,
          message:
            isRecord(errorData) && typeof errorData.message === "string"
              ? errorData.message
              : `HTTP ${response.status}`,
          error: errorData,
        };
      }

      const responseBody: unknown = await response.json();
      // Unwrap response envelope: { code, message, data } nếu có
      const data = (
        isRecord(responseBody) && responseBody.data !== undefined ? responseBody.data : responseBody
      ) as T;
      Logger.debug(`✓ ${method} ${endpoint}`, data);

      return {
        success: true,
        data,
      };
    } catch (error: unknown) {
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
