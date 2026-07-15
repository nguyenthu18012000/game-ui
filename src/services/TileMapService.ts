import type { HarvestResult, Tile, TileMap as TileMapData } from "../types/Tile";
import { TileMap } from "../entities/map/TileMap";
import type { TileMapStats } from "../entities/map/TileMap";
import { TileMapGenerator } from "./TileMapGenerator";
import { Logger } from "../utils/logger";

export class TileMapService {
  private static readonly GRID_WIDTH = 400;
  private static readonly GRID_HEIGHT = 400;
  private static readonly TILE_SIZE = 60;
  private static readonly MAP_WIDTH = this.GRID_WIDTH * this.TILE_SIZE;
  private static readonly MAP_HEIGHT = this.GRID_HEIGHT * this.TILE_SIZE;
  private static readonly REGENERATION_TIME = 5000;

  static generateMap(): TileMap {
    const tileMap = TileMapGenerator.generate({
      width: this.GRID_WIDTH,
      height: this.GRID_HEIGHT,
      tileSize: this.TILE_SIZE,
    });

    Logger.info(
      `TileMap generated: ${this.GRID_WIDTH}x${this.GRID_HEIGHT} tiles (${this.MAP_WIDTH}x${this.MAP_HEIGHT} pixels)`,
    );

    return tileMap;
  }

  static getTile(tileMap: TileMapData, gridX: number, gridY: number): Tile | null {
    if (tileMap instanceof TileMap) {
      return tileMap.getTile(gridX, gridY);
    }

    if (gridX < 0 || gridX >= tileMap.width || gridY < 0 || gridY >= tileMap.height) {
      return null;
    }

    return tileMap.tiles[gridX]?.[gridY] ?? null;
  }

  static getTileByPixel(tileMap: TileMapData, pixelX: number, pixelY: number): Tile | null {
    if (tileMap instanceof TileMap) {
      return tileMap.getTileByPixel(pixelX, pixelY);
    }

    const gridX = Math.floor(pixelX / tileMap.tileSize);
    const gridY = Math.floor(pixelY / tileMap.tileSize);
    return this.getTile(tileMap, gridX, gridY);
  }

  static exploreTile(tileMap: TileMapData, gridX: number, gridY: number) {
    if (tileMap instanceof TileMap) {
      return tileMap.exploreTile(gridX, gridY);
    }

    const tile = this.getTile(tileMap, gridX, gridY);
    if (!tile) return false;

    tile.isExplored = true;
    return true;
  }

  static mineTile(tileMap: TileMapData, gridX: number, gridY: number) {
    if (tileMap instanceof TileMap) {
      return tileMap.mineTile(gridX, gridY);
    }

    const tile = this.getTile(tileMap, gridX, gridY);
    if (!tile || !tile.resourceAmount) {
      return 0;
    }

    const mineAmount = Math.min(tile.resourceAmount, 10);
    tile.resourceAmount -= mineAmount;

    if (tile.resourceAmount === 0) {
      tile.isExplored = true;
    }

    return mineAmount;
  }

  static damageTile(
    tileMap: TileMapData,
    gridX: number,
    gridY: number,
    damage: number = 10,
  ): boolean {
    if (tileMap instanceof TileMap) {
      const depleted = tileMap.damageTile(gridX, gridY, damage);
      if (depleted) {
        Logger.info(`Tile (${gridX}, ${gridY}) depleted!`);
      }
      return depleted;
    }

    const tile = this.getTile(tileMap, gridX, gridY);
    if (!tile || !tile.isFarmable || tile.isDepleted) {
      return false;
    }

    if (tile.health === undefined) {
      return false;
    }

    tile.health -= damage;
    if (tile.health > 0) {
      return false;
    }

    tile.health = 0;
    tile.isDepleted = true;
    tile.depletedAt = Date.now();
    Logger.info(`Tile (${gridX}, ${gridY}) depleted!`);
    return true;
  }

  static harvestTile(
    tileMap: TileMapData,
    gridX: number,
    gridY: number,
    damage: number = 10,
  ): HarvestResult | null {
    if (tileMap instanceof TileMap) {
      const result = tileMap.harvestTile(gridX, gridY, damage);
      if (result?.depleted) {
        Logger.info(`Tile (${gridX}, ${gridY}) depleted!`);
      }
      return result;
    }

    const depleted = this.damageTile(tileMap, gridX, gridY, damage);
    const tile = this.getTile(tileMap, gridX, gridY);
    if (!tile) return null;

    return {
      depleted,
      reward:
        depleted && tile.resourceAmount
          ? { resourceType: tile.type, amount: tile.resourceAmount }
          : null,
      tile,
    };
  }

  static updateTileRegeneration(tileMap: TileMapData): Array<{ x: number; y: number }> {
    if (tileMap instanceof TileMap) {
      return tileMap
        .updateRegeneration(this.REGENERATION_TIME)
        .map((tile) => ({ x: tile.x, y: tile.y }));
    }

    return [];
  }

  static getRegenerationProgress(tile: Tile): number {
    if (!tile.isDepleted || !tile.depletedAt) return 0;

    const timePassed = Date.now() - tile.depletedAt;
    return Math.min(timePassed / this.REGENERATION_TIME, 1);
  }

  static getHealthPercentage(tile: Tile): number {
    if (!tile.isFarmable || tile.maxHealth === undefined || tile.maxHealth === 0) {
      return 1;
    }

    return Math.max(0, (tile.health || 0) / tile.maxHealth);
  }

  static getMapStats(tileMap: TileMapData): TileMapStats {
    if (tileMap instanceof TileMap) {
      return tileMap.getStats();
    }

    let emptyCount = 0;
    let grassCount = 0;
    let landCount = 0;
    let rockCount = 0;
    let totalResources = 0;

    for (let x = 0; x < tileMap.width; x++) {
      for (let y = 0; y < tileMap.height; y++) {
        const tile = tileMap.tiles[x]?.[y];
        if (!tile) continue;

        if (tile.type === "empty") emptyCount++;
        if (tile.type === "grass") grassCount++;
        if (tile.type === "land") landCount++;
        if (tile.type === "rock") rockCount++;

        totalResources += tile.resourceAmount || 0;
      }
    }

    return { emptyCount, grassCount, landCount, rockCount, totalResources };
  }
}
