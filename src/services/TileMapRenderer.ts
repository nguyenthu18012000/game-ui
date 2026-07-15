import type { Tile, TileMap } from "../types/Tile";
import { TileType, MapObjectType } from "../types/Tile";
import { Logger } from "../utils/logger";
import { TileMapService } from "./TileMapService";

/**
 * Handles rendering of the tile map in Phaser with Viewport Culling
 */
export class TileMapRenderer {
  private scene: Phaser.Scene;
  private tileMap!: TileMap;
  private tileContainer!: Phaser.GameObjects.Container;

  // Viewport culling properties
  private visibleTiles = new Map<string, Phaser.GameObjects.Rectangle>();
  private visibleHealthBars = new Map<string, Phaser.GameObjects.Rectangle[]>();
  private visibleObjects = new Map<string, Phaser.GameObjects.GameObject[]>();
  private lastViewportBounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  private readonly BUFFER_SIZE = 50; // Tile buffer around viewport to prevent pop-in

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Initialize the tile map (called once)
   */
  renderMap(tileMap: TileMap): void {
    this.tileMap = tileMap;

    // Create a container to hold all tiles
    this.tileContainer = this.scene.add.container(0, 0);

    Logger.info("TileMap initialized for viewport culling");
  }

  /**
   * Update visible tiles based on camera position
   * Call this every frame in scene.update()
   */
  updateVisibleTiles(camera: Phaser.Cameras.Scene2D.Camera): void {
    const tileSize = this.tileMap.tileSize;

    // Calculate viewport bounds in grid coordinates
    const minX = Math.max(0, Math.floor(camera.scrollX / tileSize) - this.BUFFER_SIZE);
    const maxX = Math.min(
      this.tileMap.width - 1,
      Math.ceil((camera.scrollX + camera.width) / tileSize) + this.BUFFER_SIZE,
    );
    const minY = Math.max(0, Math.floor(camera.scrollY / tileSize) - this.BUFFER_SIZE);
    const maxY = Math.min(
      this.tileMap.height - 1,
      Math.ceil((camera.scrollY + camera.height) / tileSize) + this.BUFFER_SIZE,
    );

    // Only update if bounds changed
    if (
      minX === this.lastViewportBounds.minX &&
      maxX === this.lastViewportBounds.maxX &&
      minY === this.lastViewportBounds.minY &&
      maxY === this.lastViewportBounds.maxY
    ) {
      return;
    }

    this.lastViewportBounds = { minX, maxX, minY, maxY };

    // Clear old tiles outside viewport
    this.clearOutdatedTiles(minX, maxX, minY, maxY);

    // Render new visible tiles
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const key = `${x},${y}`;

        // Skip if already rendered
        if (this.visibleTiles.has(key)) {
          continue;
        }

        const tile = this.getTile(x, y);
        if (!tile) continue;
        this.drawTile(tile);
      }
    }
  }

  /**
   * Remove tiles that are now outside viewport
   */
  private clearOutdatedTiles(minX: number, maxX: number, minY: number, maxY: number): void {
    const keysToRemove: string[] = [];

    this.visibleTiles.forEach((rect, key) => {
      const [x, y] = key.split(",").map(Number);
      if (x === undefined || y === undefined) return;

      if (x < minX || x > maxX || y < minY || y > maxY) {
        rect.destroy();
        keysToRemove.push(key);
      }
    });

    // Remove associated objects and health bars
    keysToRemove.forEach((key) => {
      const objs = this.visibleObjects.get(key);
      if (objs) {
        objs.forEach((obj) => obj.destroy());
        this.visibleObjects.delete(key);
      }

      const healthBars = this.visibleHealthBars.get(key);
      if (healthBars) {
        healthBars.forEach((bar) => bar.destroy());
        this.visibleHealthBars.delete(key);
      }

      this.visibleTiles.delete(key);
    });
  }

  /**
   * Draw a single tile
   */
  private drawTile(tile: Tile): void {
    const size = this.tileMap.tileSize;
    let color = this.getTileColor(tile.type);
    const key = `${tile.x},${tile.y}`;

    // If tile is depleted, darken it
    if (tile.isDepleted) {
      color = this.darkenColor(color);
    }

    // Draw tile rectangle
    const rect = this.scene.add.rectangle(
      tile.pixelX + size / 2,
      tile.pixelY + size / 2,
      size,
      size,
      color,
    );
    rect.setStrokeStyle(1, 0x333333);
    rect.setInteractive();

    rect.on("pointerout", () => {
      rect.setStrokeStyle(1, 0x333333);
    });

    this.tileContainer.add(rect);
    this.visibleTiles.set(key, rect);

    // Draw health bar for farmable tiles
    if (tile.isFarmable && !tile.isDepleted) {
      this.drawHealthBar(tile);
    }

    // Draw map object if exists
    if (tile.object) {
      this.drawMapObject(tile);
    }
  }

  /**
   * Draw health bar for a farmable tile
   */
  private drawHealthBar(tile: Tile): void {
    const size = this.tileMap.tileSize;
    const barWidth = size - 4;
    const barHeight = 3;
    const key = `${tile.x},${tile.y}`;

    // Background bar (red - empty)
    const bgBar = this.scene.add.rectangle(
      tile.pixelX + size / 2,
      tile.pixelY + size - 4,
      barWidth,
      barHeight,
      0xff0000,
    );
    bgBar.setOrigin(0.5, 0.5);

    // Health bar (green - filled)
    const healthPercent = TileMapService.getHealthPercentage(tile);
    const healthBar = this.scene.add.rectangle(
      tile.pixelX + size / 2,
      tile.pixelY + size - 4,
      barWidth * healthPercent,
      barHeight,
      0x00ff00,
    );
    healthBar.setOrigin(0.5, 0.5);

    this.tileContainer.add([bgBar, healthBar]);

    const bars = this.visibleHealthBars.get(key) ?? [];
    bars.push(bgBar, healthBar);
    this.visibleHealthBars.set(key, bars);
  }

  /**
   * Update health bar for a tile
   */
  updateTileHealthBar(gridX: number, gridY: number): void {
    const tile = this.getTile(gridX, gridY);
    if (!tile) return;

    const key = `${gridX},${gridY}`;
    const rect = this.visibleTiles.get(key);

    // Remove old health bars
    const oldBars = this.visibleHealthBars.get(key);
    if (oldBars) {
      oldBars.forEach((bar) => bar.destroy());
      this.visibleHealthBars.delete(key);
    }

    // If tile is completely depleted, darken the color
    if (tile.isDepleted) {
      if (rect) {
        rect.setFillStyle(this.darkenColor(this.getTileColor(tile.type)));
      }
    } else if (tile.isFarmable) {
      // Tile regenerated - restore original color
      if (rect) {
        rect.setFillStyle(this.getTileColor(tile.type));
      }
      // Draw new health bar
      this.drawHealthBar(tile);
    }
  }

  /**
   * Darken a color for depleted tiles
   */
  private darkenColor(color: number): number {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;

    const darkenFactor = 0.5;
    const darkR = Math.floor(r * darkenFactor);
    const darkG = Math.floor(g * darkenFactor);
    const darkB = Math.floor(b * darkenFactor);

    return (darkR << 16) | (darkG << 8) | darkB;
  }

  /**
   * Draw a map object on a tile
   */
  private drawMapObject(tile: Tile): void {
    const size = this.tileMap.tileSize;
    const cx = tile.pixelX + size / 2;
    const cy = tile.pixelY + size / 2;
    const key = `${tile.x},${tile.y}`;

    const object = tile.object;
    if (!object) return;
    let symbol = "?";
    let color = 0xffffff;

    switch (object.type) {
      case MapObjectType.TREE:
        symbol = "🌲";
        color = 0x228b22;
        break;
      case MapObjectType.BUILDING:
        symbol = "🏠";
        color = 0x8b4513;
        break;
      case MapObjectType.ROCK_PILE:
        symbol = "⬚";
        color = 0x696969;
        break;
      case MapObjectType.CHEST:
        symbol = "📦";
        color = 0xffd700;
        break;
      case MapObjectType.WELL:
        symbol = "🌊";
        color = 0x4169e1;
        break;
    }

    // Draw object as circle with symbol
    const objCircle = this.scene.add.circle(cx, cy, size / 2.5, color);
    objCircle.setAlpha(0.7);

    const objText = this.scene.add.text(cx, cy, symbol, {
      fontSize: "16px",
      align: "center",
    });
    objText.setOrigin(0.5, 0.5);

    this.tileContainer.add([objCircle, objText]);

    // Track objects for cleanup
    const objects = this.visibleObjects.get(key) ?? [];
    objects.push(objCircle, objText);
    this.visibleObjects.set(key, objects);
  }

  /**
   * Get color based on tile type
   */
  private getTileColor(type: TileType): number {
    switch (type) {
      case TileType.EMPTY:
        return 0x4a4a4a; // Dark gray for empty
      case TileType.GRASS:
        return 0x22aa22; // Green
      case TileType.LAND:
        return 0x8b6914; // Brown
      case TileType.ROCK:
        return 0x666666; // Gray
      default:
        return 0xffffff; // White
    }
  }

  /**
   * Update tile visual after farming or regeneration
   */
  updateTileVisual(gridX: number, gridY: number): void {
    const tile = this.getTile(gridX, gridY);
    if (!tile) return;

    this.updateTileHealthBar(gridX, gridY);
  }

  /**
   * Get the tile map reference
   */
  getTileMap(): TileMap {
    return this.tileMap;
  }

  private getTile(gridX: number, gridY: number): Tile | null {
    return this.tileMap.tiles[gridX]?.[gridY] ?? null;
  }
}
