import { api } from "./APIService";
import { Logger } from "../utils/logger";
import { API_ENDPOINTS } from "../constants/ApiConstants";

export interface CharacterDetail {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export class CharacterService {
  /**
   * Lấy thông tin nhân vật của user hiện tại (userid lấy từ token)
   * Trả về null nếu chưa có nhân vật
   */
  static async getDetail(): Promise<CharacterDetail | null> {
    const response = await api.get<CharacterDetail>(API_ENDPOINTS.CHARACTER.PROFILE);
    if (response.success && response.data) {
      Logger.info("Character detail loaded:", response.data);
      return response.data;
    }
    Logger.info("No character found");
    return null;
  }

  /**
   * Tạo nhân vật mới với tên cho trước
   */
  static async create(characterName: string): Promise<boolean> {
    const response = await api.post(API_ENDPOINTS.CHARACTER.CREATE, {
      characterName,
    });
    if (response.success) {
      Logger.info("Character created successfully");
      return true;
    }
    Logger.error("Character creation failed", response.error);
    return false;
  }
}
