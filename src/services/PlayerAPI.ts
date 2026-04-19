import { api } from "./APIService";
import type { PlayerData } from "../types/Player";
import { Logger } from "../utils/logger";

/**
 * PlayerAPI - Gọi tất cả API liên quan tới player
 */
export class PlayerAPI {
  /**
   * Login player
   */
  static async login(username: string, password: string) {
    const response = await api.post("/auth/login", { username, password });
    if (response.success && response.data) {
      // Token được lưu tự động bởi AuthService
      Logger.info("Login success:", response.data);
    }
    return response;
  }

  /**
   * Register player
   */
  static async register(username: string, password: string) {
    const response = await api.post("/auth/register", {
      username,
      password,
    });
    if (response.success && response.data) {
      // Token được lưu tự động bởi AuthService
      Logger.info("Register success");
    }
    return response;
  }

  /**
   * Get player profile
   */
  static async getProfile(): Promise<any> {
    return api.get<PlayerData>("/player/profile");
  }

  /**
   * Update player profile
   */
  static async updateProfile(data: Partial<PlayerData>): Promise<any> {
    return api.put("/player/profile", data);
  }

  /**
   * Equip item
   */
  static async equipItem(itemId: string, slot: string): Promise<any> {
    return api.post("/player/equip", { itemId, slot });
  }

  /**
   * Get inventory
   */
  static async getInventory(): Promise<any> {
    return api.get("/player/inventory");
  }

  /**
   * Logout
   */
  static logout() {
    // TokenService.clearTokens() được gọi từ AuthService
    Logger.info("Logout");
  }
}

/**
 * GameAPI - Gọi tất cả API liên quan tới game
 */
export class GameAPI {
  /**
   * Create game room
   */
  static async createGame(gameName: string, maxPlayers: number): Promise<any> {
    return api.post("/game/create", { gameName, maxPlayers });
  }

  /**
   * Get available games
   */
  static async getAvailableGames(): Promise<any> {
    return api.get("/game/available");
  }

  /**
   * Join game
   */
  static async joinGame(gameId: string): Promise<any> {
    return api.post(`/game/${gameId}/join`, {});
  }

  /**
   * Leave game
   */
  static async leaveGame(gameId: string): Promise<any> {
    return api.post(`/game/${gameId}/leave`, {});
  }

  /**
   * Get game state
   */
  static async getGameState(gameId: string): Promise<any> {
    return api.get(`/game/${gameId}/state`);
  }

  /**
   * Update player position
   */
  static async updatePosition(
    gameId: string,
    x: number,
    y: number,
  ): Promise<any> {
    return api.post(`/game/${gameId}/position`, { x, y });
  }
}

/**
 * ChatAPI - Gọi tất cả API liên quan tới chat
 */
export class ChatAPI {
  /**
   * Send message
   */
  static async sendMessage(gameId: string, message: string): Promise<any> {
    return api.post(`/chat/${gameId}/send`, { message });
  }

  /**
   * Get chat history
   */
  static async getChatHistory(gameId: string): Promise<any> {
    return api.get(`/chat/${gameId}/history`);
  }
}
