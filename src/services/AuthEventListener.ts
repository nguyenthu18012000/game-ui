import { Logger } from "../utils/logger";

/**
 * AuthEventListener - Lắng nghe các sự kiện authentication
 * Chạy khi app khởi động để setup global listeners
 */
export class AuthEventListener {
  static setup() {
    // Lắng nghe sự kiện token hết hạn
    window.addEventListener("auth:token-expired", () => {
      Logger.warn("Token expired event - need to login again");
      // Có thể gửi user quay về LoginScene
      // Hoặc gọi scene manager để restart MenuScene
    });

    // Lắng nghe sự kiện token refresh fail
    window.addEventListener("auth:refresh-failed", () => {
      Logger.error("Token refresh failed");
      // Logout user
    });

    // Lắng nghe logout
    window.addEventListener("auth:logout", () => {
      Logger.info("User logged out");
    });

    Logger.info("Auth event listeners setup");
  }
}
