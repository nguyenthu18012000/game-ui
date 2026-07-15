/**
 * HƯỚNG DẪN SỬ DỤNG HỆ THỐNG BẢN ĐỒ
 *
 * Bản đồ được chia thành lưới 40x40 ô (400x400 đơn vị pixel, mỗi ô 10x10 pixels)
 *
 * CÁC LOẠI ÔĐất (GRASS) - 50%: Chứa 10-30 tài nguyên
 * Đất (LAND) - 30%: Chứa 30-80 tài nguyên
 * Đá (ROCK) - 20%: Chứa 50-150 tài nguyên
 */

import { TileMapService } from "../services/TileMapService";
import { TileMapRenderer } from "../services/TileMapRenderer";
import { Logger } from "../utils/logger";
import type { TileMap } from "../types/Tile";

/**
 * Ví dụ sử dụng hệ thống bản đồ
 */
export class TileMapExample {
  /**
   * 1. TẠOMỘT BẢN ĐỒ MỚI
   */
  static createNewMap() {
    const tileMap = TileMapService.generateMap();
    Logger.info(`Map created: ${tileMap.width}x${tileMap.height} tiles`);
    return tileMap;
  }

  /**
   * 2. RENDER BẢN ĐỒ TRÊN SCENE
   */
  static renderMapInScene(scene: Phaser.Scene) {
    const tileMap = this.createNewMap();
    const renderer = new TileMapRenderer(scene);
    renderer.renderMap(tileMap);
    return { tileMap, renderer };
  }

  /**
   * 3. LẤY THÔNG TIN ÔĐất TẠI VỊ TRÍ XÁC ĐỊNH
   */
  static getTileInfo(tileMap: TileMap, gridX: number, gridY: number) {
    const tile = TileMapService.getTile(tileMap, gridX, gridY);
    if (tile) {
      Logger.info(`Tile at (${gridX}, ${gridY}):
        - Type: ${tile.type}
        - Resources: ${tile.resourceAmount}
        - Explored: ${tile.isExplored}
        - Pixel Position: (${tile.pixelX}, ${tile.pixelY})`);
      return tile;
    }
  }

  /**
   * 4. LẤY THÔNG TIN ÔĐất TẠI VỊ TRÍ PIXEL (khi click chuột)
   */
  static getTileAtPixel(tileMap: TileMap, pixelX: number, pixelY: number) {
    const tile = TileMapService.getTileByPixel(tileMap, pixelX, pixelY);
    if (tile) {
      Logger.info(`Clicked tile at pixel (${pixelX}, ${pixelY}):
        - Grid Position: (${tile.x}, ${tile.y})
        - Type: ${tile.type}
        - Resources: ${tile.resourceAmount}`);
      return tile;
    }
  }

  /**
   * 5. ĐÀO TÀI NGUYÊN TỬ ÔĐất
   */
  static mineTile(tileMap: TileMap, gridX: number, gridY: number) {
    const resourceAmount = TileMapService.mineTile(tileMap, gridX, gridY);
    Logger.info(`Mined ${resourceAmount} resources from tile (${gridX}, ${gridY})`);
    return resourceAmount;
  }

  /**
   * 6. XEM THỐNG KÊ BẢN ĐỒ
   */
  static getMapStatistics(tileMap: TileMap) {
    const stats = TileMapService.getMapStats(tileMap);
    Logger.info(`Map Statistics:
      - Grass tiles: ${stats.grassCount}
      - Land tiles: ${stats.landCount}
      - Rock tiles: ${stats.rockCount}
      - Total resources: ${stats.totalResources}`);
    return stats;
  }
}

/**
 * SỬ DỤNG TRONG GAME SCENE
 *
 * export class GameScene extends Phaser.Scene {
 *   private tileMap: TileMap;
 *   private tileMapRenderer: TileMapRenderer;
 *
 *   create() {
 *     // Tạo bản đồ
 *     this.tileMap = TileMapService.generateMap();
 *
 *     // Render bản đồ
 *     this.tileMapRenderer = new TileMapRenderer(this);
 *     this.tileMapRenderer.renderMap(this.tileMap);
 *
 *     // Xem thống kê
 *     TileMapService.getMapStats(this.tileMap);
 *
 *     // Setup click để đào
 *     this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
 *       const tile = TileMapService.getTileByPixel(
 *         this.tileMap,
 *         pointer.x,
 *         pointer.y
 *       );
 *       if (tile) {
 *         const mined = TileMapService.mineTile(this.tileMap, tile.x, tile.y);
 *         Logger.info(`Mined ${mined} resources!`);
 *         this.tileMapRenderer.updateTileVisual(tile.x, tile.y);
 *       }
 *     });
 *   }
 * }
 */
