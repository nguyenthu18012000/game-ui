import type { HarvestResult, Tile, TileMap as TileMapData } from "../../types/Tile";
import { TileType } from "../../types/Tile";
import { FarmableTile } from "./tiles/MapTile";

export interface TileMapStats {
  emptyCount: number;
  grassCount: number;
  landCount: number;
  rockCount: number;
  totalResources: number;
}

export class TileMap implements TileMapData {
  readonly width: number;
  readonly height: number;
  readonly tileSize: number;
  readonly tiles: Tile[][];
  private readonly depletedTiles = new Set<FarmableTile>();

  constructor(width: number, height: number, tileSize: number, tiles: Tile[][]) {
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.tiles = tiles;
  }

  getTile(gridX: number, gridY: number): Tile | null {
    if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
      return null;
    }

    return this.tiles[gridX]?.[gridY] ?? null;
  }

  getTileByPixel(pixelX: number, pixelY: number): Tile | null {
    const gridX = Math.floor(pixelX / this.tileSize);
    const gridY = Math.floor(pixelY / this.tileSize);
    return this.getTile(gridX, gridY);
  }

  exploreTile(gridX: number, gridY: number): boolean {
    const tile = this.getTile(gridX, gridY);
    if (!tile) return false;

    tile.isExplored = true;
    return true;
  }

  mineTile(gridX: number, gridY: number): number {
    const tile = this.getTile(gridX, gridY);
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

  damageTile(gridX: number, gridY: number, damage: number): boolean {
    const tile = this.getTile(gridX, gridY);
    if (!(tile instanceof FarmableTile)) {
      return false;
    }

    const depleted = tile.damage(damage);
    if (depleted) {
      this.depletedTiles.add(tile);
    }

    return depleted;
  }

  harvestTile(gridX: number, gridY: number, damage: number): HarvestResult | null {
    const tile = this.getTile(gridX, gridY);
    if (!(tile instanceof FarmableTile)) {
      return null;
    }

    const result = tile.harvest(damage);
    if (result.depleted) {
      this.depletedTiles.add(tile);
    }

    return result;
  }

  updateRegeneration(regenerationTime: number, now = Date.now()): Tile[] {
    const regeneratedTiles: Tile[] = [];

    this.depletedTiles.forEach((tile) => {
      if (!tile.depletedAt || now - tile.depletedAt < regenerationTime) {
        return;
      }

      tile.regenerate();
      this.depletedTiles.delete(tile);
      regeneratedTiles.push(tile);
    });

    return regeneratedTiles;
  }

  getStats(): TileMapStats {
    let emptyCount = 0;
    let grassCount = 0;
    let landCount = 0;
    let rockCount = 0;
    let totalResources = 0;

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const tile = this.getTile(x, y);
        if (!tile) continue;

        switch (tile.type) {
          case TileType.EMPTY:
            emptyCount++;
            break;
          case TileType.GRASS:
            grassCount++;
            break;
          case TileType.LAND:
            landCount++;
            break;
          case TileType.ROCK:
            rockCount++;
            break;
        }

        totalResources += tile.resourceAmount || 0;
      }
    }

    return { emptyCount, grassCount, landCount, rockCount, totalResources };
  }
}
