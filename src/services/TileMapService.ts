import type { Tile, TileMap } from "../types/Tile";
import { TileType, MapObjectType } from "../types/Tile";
import { Logger } from "../utils/logger";

export class TileMapService {
  private static readonly GRID_WIDTH = 400; // 400 tiles (was 40)
  private static readonly GRID_HEIGHT = 400; // 400 tiles (was 40)
  private static readonly TILE_SIZE = 60; // 60 pixels per tile
  private static readonly MAP_WIDTH = this.GRID_WIDTH * this.TILE_SIZE; // 24000
  private static readonly MAP_HEIGHT = this.GRID_HEIGHT * this.TILE_SIZE; // 24000
  private static readonly REGENERATION_TIME = 5000; // 5 seconds before tile regenerates

  /**
   * Generate a new tile map with random terrain
   * Distribution: 50% grass, 30% land, 20% rock
   */
  static generateMap(): TileMap {
    const tiles: Tile[][] = [];

    for (let x = 0; x < this.GRID_WIDTH; x++) {
      tiles[x] = [];
      for (let y = 0; y < this.GRID_HEIGHT; y++) {
        const tileType = this.getRandomTileType();
        const tile: Tile = {
          x,
          y,
          pixelX: x * this.TILE_SIZE,
          pixelY: y * this.TILE_SIZE,
          type: tileType,
          resourceAmount: this.getResourceAmount(tileType),
          isExplored: false,
          // Setup farmable system
          isFarmable: tileType !== TileType.EMPTY,
          health: this.getMaxHealth(tileType),
          maxHealth: this.getMaxHealth(tileType),
          isDepleted: false,
        };

        // Add random objects to tiles (5% chance)
        if (Math.random() < 0.05) {
          tile.object = this.getRandomMapObject();
        }

        tiles[x][y] = tile;
      }
    }

    Logger.info(
      `TileMap generated: ${this.GRID_WIDTH}x${this.GRID_HEIGHT} tiles (${this.MAP_WIDTH}x${this.MAP_HEIGHT} pixels)`,
    );

    return {
      width: this.GRID_WIDTH,
      height: this.GRID_HEIGHT,
      tileSize: this.TILE_SIZE,
      tiles,
    };
  }

  /**
   * Get maximum health based on tile type
   * Đất (LAND) = 20 (ít máu)
   * Cỏ (GRASS) = 40 (vừa)
   * Đá (ROCK) = 60 (nhiều)
   */
  private static getMaxHealth(tileType: TileType): number {
    switch (tileType) {
      case TileType.LAND:
        return 20; // Low health
      case TileType.GRASS:
        return 40; // Medium health
      case TileType.ROCK:
        return 60; // High health
      default:
        return 0; // Empty tiles have no health
    }
  }

  /**
   * Get a random tile type based on distribution
   * 30% empty, 35% grass, 20% land, 15% rock
   */
  private static getRandomTileType(): TileType {
    const rand = Math.random() * 100;

    if (rand < 30) {
      return TileType.EMPTY;
    } else if (rand < 65) {
      return TileType.GRASS;
    } else if (rand < 85) {
      return TileType.LAND;
    } else {
      return TileType.ROCK;
    }
  }

  /**
   * Get random map object
   */
  private static getRandomMapObject() {
    const objectTypes = [
      MapObjectType.TREE,
      MapObjectType.TREE,
      MapObjectType.TREE,
      MapObjectType.BUILDING,
      MapObjectType.ROCK_PILE,
      MapObjectType.CHEST,
      MapObjectType.WELL,
    ];

    const randomType =
      objectTypes[Math.floor(Math.random() * objectTypes.length)];

    switch (randomType) {
      case MapObjectType.TREE:
        return {
          type: MapObjectType.TREE,
          health: 3,
          maxHealth: 3,
        };
      case MapObjectType.BUILDING:
        return {
          type: MapObjectType.BUILDING,
        };
      case MapObjectType.ROCK_PILE:
        return {
          type: MapObjectType.ROCK_PILE,
          health: 2,
          maxHealth: 2,
        };
      case MapObjectType.CHEST:
        return {
          type: MapObjectType.CHEST,
        };
      case MapObjectType.WELL:
        return {
          type: MapObjectType.WELL,
        };
      default:
        return { type: MapObjectType.TREE };
    }
  }

  /**
   * Get resource amount based on tile type
   */
  private static getResourceAmount(tileType: TileType): number {
    switch (tileType) {
      case TileType.EMPTY:
        return 0; // No resources on empty tiles
      case TileType.GRASS:
        return Math.floor(Math.random() * 20) + 10; // 10-30
      case TileType.LAND:
        return Math.floor(Math.random() * 50) + 30; // 30-80
      case TileType.ROCK:
        return Math.floor(Math.random() * 100) + 50; // 50-150
      default:
        return 0;
    }
  }

  /**
   * Get a specific tile by grid coordinates
   */
  static getTile(tileMap: TileMap, gridX: number, gridY: number): Tile | null {
    if (
      gridX < 0 ||
      gridX >= tileMap.width ||
      gridY < 0 ||
      gridY >= tileMap.height
    ) {
      return null;
    }
    return tileMap.tiles[gridX][gridY];
  }

  /**
   * Get tile by pixel coordinates
   */
  static getTileByPixel(
    tileMap: TileMap,
    pixelX: number,
    pixelY: number,
  ): Tile | null {
    const gridX = Math.floor(pixelX / tileMap.tileSize);
    const gridY = Math.floor(pixelY / tileMap.tileSize);
    return this.getTile(tileMap, gridX, gridY);
  }

  /**
   * Mark a tile as explored
   */
  static exploreTile(tileMap: TileMap, gridX: number, gridY: number): boolean {
    const tile = this.getTile(tileMap, gridX, gridY);
    if (tile) {
      tile.isExplored = true;
      return true;
    }
    return false;
  }

  /**
   * Mine resources from a tile
   */
  static mineTile(tileMap: TileMap, gridX: number, gridY: number): number {
    const tile = this.getTile(tileMap, gridX, gridY);
    if (!tile || !tile.resourceAmount || tile.resourceAmount === 0) {
      return 0;
    }

    const mineAmount = Math.min(tile.resourceAmount, 10); // Mine 10 resources at a time
    tile.resourceAmount -= mineAmount;

    if (tile.resourceAmount === 0) {
      tile.isExplored = true;
    }

    return mineAmount;
  }

  /**
   * Damage a farmable tile
   * Returns true if tile is depleted
   */
  static damageTile(
    tileMap: TileMap,
    gridX: number,
    gridY: number,
    damage: number = 10,
  ): boolean {
    const tile = this.getTile(tileMap, gridX, gridY);
    if (!tile || !tile.isFarmable || tile.isDepleted) {
      return false;
    }

    if (tile.health !== undefined) {
      tile.health -= damage;

      if (tile.health <= 0) {
        tile.isDepleted = true;
        tile.depletedAt = Date.now();
        Logger.info(`Tile (${gridX}, ${gridY}) depleted!`);
        return true;
      }
    }

    return false;
  }

  /**
   * Check and regenerate depleted tiles if enough time has passed
   * Returns array of tiles that were regenerated
   */
  static updateTileRegeneration(
    tileMap: TileMap,
  ): Array<{ x: number; y: number }> {
    const regeneratedTiles: Array<{ x: number; y: number }> = [];
    const currentTime = Date.now();

    for (let x = 0; x < tileMap.width; x++) {
      for (let y = 0; y < tileMap.height; y++) {
        const tile = tileMap.tiles[x][y];

        if (tile.isDepleted && tile.depletedAt) {
          const timePassed = currentTime - tile.depletedAt;

          if (timePassed >= this.REGENERATION_TIME) {
            // Regenerate the tile
            tile.isDepleted = false;
            tile.health = tile.maxHealth;
            tile.depletedAt = undefined;
            regeneratedTiles.push({ x, y });
            Logger.info(`Tile (${x}, ${y}) regenerated!`);
          }
        }
      }
    }

    return regeneratedTiles;
  }

  /**
   * Get regeneration progress (0-1) for a depleted tile
   */
  static getRegenerationProgress(tile: Tile): number {
    if (!tile.isDepleted || !tile.depletedAt) return 0;

    const timePassed = Date.now() - tile.depletedAt;
    return Math.min(timePassed / this.REGENERATION_TIME, 1);
  }

  /**
   * Get health percentage for display (0-1)
   */
  static getHealthPercentage(tile: Tile): number {
    if (
      !tile.isFarmable ||
      tile.maxHealth === undefined ||
      tile.maxHealth === 0
    ) {
      return 1;
    }

    return Math.max(0, (tile.health || 0) / tile.maxHealth);
  }

  /**
   * Get map statistics
   */
  static getMapStats(tileMap: TileMap): {
    emptyCount: number;
    grassCount: number;
    landCount: number;
    rockCount: number;
    totalResources: number;
  } {
    let emptyCount = 0;
    let grassCount = 0;
    let landCount = 0;
    let rockCount = 0;
    let totalResources = 0;

    for (let x = 0; x < tileMap.width; x++) {
      for (let y = 0; y < tileMap.height; y++) {
        const tile = tileMap.tiles[x][y];
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
