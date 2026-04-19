/**
 * VÍ DỤ CÁCH DÙNG APIService
 *
 * Bạn có thể dùng ở bất cứ đâu trong game,
 * không cần khởi tạo trong LoadingScene
 */

import { api } from "./APIService";
import { PlayerAPI, GameAPI, ChatAPI } from "./PlayerAPI";
import { Logger } from "../utils/logger";

/**
 * ====================
 * 1. LOGIN & REGISTER
 * ====================
 */

// Cách 1: Dùng api trực tiếp
export async function exampleLogin() {
  const response = await api.post("/auth/login", {
    username: "player1",
    password: "password123",
  });

  if (response.success) {
    Logger.info("Login successful");
  } else {
    Logger.error("Login failed:", response.error);
  }
}

// Cách 2: Dùng PlayerAPI (recommended)
export async function exampleLoginWithAPI() {
  const response = await PlayerAPI.login("player1", "password123");

  if (response.success) {
    // Token đã được set tự động
    Logger.info("Login successful");
  }
}

/**
 * ====================
 * 2. GET PLAYER PROFILE
 * ====================
 */

export async function exampleGetProfile() {
  const response = await PlayerAPI.getProfile();

  if (response.success && response.data) {
    Logger.info("Player data:", response.data);
    // response.data.name
    // response.data.level
    // response.data.hp
  } else {
    Logger.error("Failed to get profile");
  }
}

/**
 * ====================
 * 3. CREATE GAME
 * ====================
 */

export async function exampleCreateGame() {
  const response = await GameAPI.createGame("My Adventure", 4);

  if (response.success && response.data) {
    const gameId = response.data.id;
    Logger.info("Game created:", gameId);
    // Bây giờ có thể join game hoặc bắt đầu game
  }
}

/**
 * ====================
 * 4. EQUIP ITEM
 * ====================
 */

export async function exampleEquipItem() {
  const response = await PlayerAPI.equipItem("armor-01", "body");

  if (response.success) {
    Logger.info("Equipment changed");
    // Cập nhật UI
  }
}

/**
 * ====================
 * 5. CHAT
 * ====================
 */

export async function exampleSendMessage(gameId: string) {
  const response = await ChatAPI.sendMessage(gameId, "Hello everyone!");

  if (response.success) {
    Logger.info("Message sent");
  }
}

/**
 * ====================
 * 6. CUSTOM REQUEST
 * ====================
 */

export async function exampleCustomRequest() {
  // GET request
  await api.get("/some-endpoint");

  // POST request
  await api.post("/some-endpoint", { key: "value" });

  // PUT request
  await api.put("/some-endpoint", { updated: true });

  // DELETE request
  await api.delete("/some-endpoint");
}

/**
 * ====================
 * 7. CHANGE BASE URL
 * ====================
 */

export async function exampleChangeBaseURL() {
  // Mặc định: http://localhost:3000

  // Thay đổi thành production
  api.setBaseURL("https://api.yourgame.com");

  // Hoặc environment khác
  const env = import.meta.env.MODE; // 'development' | 'production'
  if (env === "production") {
    api.setBaseURL("https://api.yourgame.com");
  }
}
