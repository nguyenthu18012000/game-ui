/**
 * Tile Types in the game world
 */
export const TileType = {
  EMPTY: "empty",
  GRASS: "grass",
  LAND: "land",
  ROCK: "rock",
} as const;
export type TileType = (typeof TileType)[keyof typeof TileType];

/**
 * Map Objects that can be placed on tiles
 */
export const MapObjectType = {
  TREE: "tree",
  BUILDING: "building",
  ROCK_PILE: "rock_pile",
  CHEST: "chest",
  WELL: "well",
} as const;
export type MapObjectType = (typeof MapObjectType)[keyof typeof MapObjectType];

/**
 * Represents a map object on a tile
 */
export interface MapObject {
  type: MapObjectType;
  health?: number;
  maxHealth?: number;
}

/**
 * Represents a single tile in the map
 */
export interface Tile {
  x: number; // Grid X coordinate (0-39)
  y: number; // Grid Y coordinate (0-39)
  pixelX: number; // Pixel X coordinate
  pixelY: number; // Pixel Y coordinate
  type: TileType;
  resourceAmount?: number; // Amount of resource in this tile
  isExplored?: boolean; // Whether the tile has been dug
  object?: MapObject; // Optional object on this tile
  // Farmable system
  isFarmable?: boolean; // Whether this tile can be farmed
  health?: number; // Current health of the tile
  maxHealth?: number; // Maximum health of the tile
  isDepleted?: boolean; // Whether the tile has been depleted
  depletedAt?: number; // Timestamp when the tile was depleted
}

export interface TileReward {
  resourceType: TileType;
  amount: number;
}

export interface HarvestResult {
  depleted: boolean;
  reward: TileReward | null;
  tile: Tile;
}

/**
 * Represents the entire tile map
 */
export interface TileMap {
  width: number; // Grid width (40 tiles)
  height: number; // Grid height (40 tiles)
  tileSize: number; // Size of each tile in pixels (30)
  tiles: Tile[][]; // 2D array of tiles [x][y]
}
