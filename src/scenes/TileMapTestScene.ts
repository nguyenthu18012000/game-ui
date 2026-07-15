import { Scene } from "phaser";
import { TileMapService } from "../services/TileMapService";
import { TileMapRenderer } from "../services/TileMapRenderer";
import type { TileMap } from "../types/Tile";
import { Logger } from "../utils/logger";

/**
 * Scene để test hệ thống bản đồ
 * Có thể click vào các ô để đào tài nguyên
 */
export class TileMapTestScene extends Scene {
  private tileMap!: TileMap;
  private tileMapRenderer!: TileMapRenderer;
  private resourceText!: Phaser.GameObjects.Text;
  private totalResources = 0;
  private statsText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "TileMapTestScene" });
  }

  create() {
    Logger.info("TileMapTestScene created");

    // Tạo bản đồ
    this.tileMap = TileMapService.generateMap();

    // Render bản đồ
    this.tileMapRenderer = new TileMapRenderer(this);
    this.tileMapRenderer.renderMap(this.tileMap);

    // Lấy thống kê
    const stats = TileMapService.getMapStats(this.tileMap);
    this.totalResources = stats.totalResources;

    // UI - Tiêu đề
    this.add.text(410, 20, "TREASURE HUNTER MAP", {
      fontSize: "20px",
      fontFamily: "Arial",
      color: "#ffffff",
      fontStyle: "bold",
    });

    // UI - Hướng dẫn
    this.add.text(410, 60, "Click vào ô để đào tài nguyên", {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#cccccc",
    });

    // UI - Thống kê
    this.statsText = this.add.text(410, 100, "", {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#00ff00",
      fixedWidth: 200,
      wordWrap: { width: 200 },
    });
    this.updateStatsDisplay(stats);

    // UI - Tài nguyên đã đào
    this.resourceText = this.add.text(410, 200, "Tài nguyên: 0", {
      fontSize: "14px",
      fontFamily: "Arial",
      color: "#ffff00",
      fontStyle: "bold",
    });

    // UI - Huyền thoại (Legend)
    this.add.text(410, 250, "LEGEND:", {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#ffffff",
      fontStyle: "bold",
    });

    this.add.rectangle(410, 280, 15, 15, 0x22aa22);
    this.add.text(435, 275, "Cỏ (10-30)", {
      fontSize: "11px",
      fontFamily: "Arial",
      color: "#ffffff",
    });

    this.add.rectangle(410, 310, 15, 15, 0x8b6914);
    this.add.text(435, 305, "Đất (30-80)", {
      fontSize: "11px",
      fontFamily: "Arial",
      color: "#ffffff",
    });

    this.add.rectangle(410, 340, 15, 15, 0x666666);
    this.add.text(435, 335, "Đá (50-150)", {
      fontSize: "11px",
      fontFamily: "Arial",
      color: "#ffffff",
    });

    // UI - Objects Legend
    this.add.text(410, 370, "OBJECTS:", {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#ffffff",
      fontStyle: "bold",
    });

    this.add.text(410, 395, "🌲 Tree  📦 Chest", {
      fontSize: "11px",
      fontFamily: "Arial",
      color: "#ffffff",
    });

    this.add.text(410, 415, "🏠 Building  🌊 Well", {
      fontSize: "11px",
      fontFamily: "Arial",
      color: "#ffffff",
    });

    // Setup click để đào
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handleTileClick(pointer);
    });

    // Camera setup - Có thể scroll bản đồ
    const camera = this.cameras.main;
    camera.setBounds(0, 0, 24000, 24000);
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      const speed = 10;
      switch (event.key.toLowerCase()) {
        case "arrowup":
        case "w":
          camera.scrollY = Math.max(0, camera.scrollY - speed);
          break;
        case "arrowdown":
        case "s":
          camera.scrollY = Math.min(24000 - camera.height, camera.scrollY + speed);
          break;
        case "arrowleft":
        case "a":
          camera.scrollX = Math.max(0, camera.scrollX - speed);
          break;
        case "arrowright":
        case "d":
          camera.scrollX = Math.min(24000 - camera.width, camera.scrollX + speed);
          break;
      }
    });

    // Back button
    const backBtn = this.add
      .rectangle(50, 20, 80, 30, 0x4a4a4a)
      .setInteractive()
      .setScrollFactor(0); // UI không scroll

    this.add
      .text(50, 20, "BACK", {
        fontSize: "12px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    backBtn.on("pointerdown", () => {
      Logger.info("Going back to MenuScene");
      this.scene.start("MenuScene");
    });
  }

  private handleTileClick(pointer: Phaser.Input.Pointer) {
    // Lấy world coordinates từ pointer
    const worldX = pointer.worldX;
    const worldY = pointer.worldY;

    // Lấy tile
    const tile = TileMapService.getTileByPixel(this.tileMap, worldX, worldY);

    if (!tile) return;

    if (tile.resourceAmount === 0) {
      Logger.info(`Tile (${tile.x}, ${tile.y}) has no resources`);
      return;
    }

    // Đào tài nguyên
    const mined = TileMapService.mineTile(this.tileMap, tile.x, tile.y);
    this.totalResources += mined;

    Logger.info(`Mined ${mined} resources from ${tile.type} at (${tile.x}, ${tile.y})`);

    // Cập nhật UI
    this.resourceText.setText(`Tài nguyên: ${this.totalResources}`);

    // Cập nhật visual
    this.tileMapRenderer.updateTileVisual(tile.x, tile.y);

    // Cập nhật thống kê
    const stats = TileMapService.getMapStats(this.tileMap);
    this.updateStatsDisplay(stats);
  }

  private updateStatsDisplay(stats: {
    emptyCount: number;
    grassCount: number;
    landCount: number;
    rockCount: number;
    totalResources: number;
  }) {
    const text = `THỐNG KÊ BẢN ĐỒ
Trống: ${stats.emptyCount}
Cỏ: ${stats.grassCount}
Đất: ${stats.landCount}
Đá: ${stats.rockCount}
Tài nguyên: ${stats.totalResources}`;

    this.statsText.setText(text);
  }

  update() {
    // Update visible tiles based on camera position (viewport culling)
    this.tileMapRenderer.updateVisibleTiles(this.cameras.main);
  }
}
