import type { MapObject, Tile } from "../types/Tile";
import { MapObjectType, TileType } from "../types/Tile";
import { TileMap } from "../entities/map/TileMap";
import {
  ChestObject,
  BuildingObject,
  RockPileObject,
  TreeObject,
  WellObject,
} from "../entities/map/objects/MapObject";
import {
  EmptyTile,
  GrassTile,
  LandTile,
  RockTile,
} from "../entities/map/tiles/MapTile";

export interface TileMapGeneratorOptions {
  width: number;
  height: number;
  tileSize: number;
}

export class TileMapGenerator {
  static generate(options: TileMapGeneratorOptions): TileMap {
    const tiles: Tile[][] = [];

    for (let x = 0; x < options.width; x++) {
      tiles[x] = [];

      for (let y = 0; y < options.height; y++) {
        const tile = this.createTile(x, y, options.tileSize);

        if (Math.random() < 0.05) {
          tile.object = this.createRandomMapObject();
        }

        tiles[x][y] = tile;
      }
    }

    return new TileMap(options.width, options.height, options.tileSize, tiles);
  }

  private static createTile(x: number, y: number, tileSize: number): Tile {
    const tileType = this.getRandomTileType();
    const resourceAmount = this.getResourceAmount(tileType);

    switch (tileType) {
      case TileType.GRASS:
        return new GrassTile(x, y, tileSize, resourceAmount);
      case TileType.LAND:
        return new LandTile(x, y, tileSize, resourceAmount);
      case TileType.ROCK:
        return new RockTile(x, y, tileSize, resourceAmount);
      case TileType.EMPTY:
        return new EmptyTile(x, y, tileSize);
    }
  }

  private static getRandomTileType(): TileType {
    const rand = Math.random() * 100;

    if (rand < 30) {
      return TileType.EMPTY;
    }
    if (rand < 65) {
      return TileType.GRASS;
    }
    if (rand < 85) {
      return TileType.LAND;
    }
    return TileType.ROCK;
  }

  private static getResourceAmount(tileType: TileType): number {
    switch (tileType) {
      case TileType.GRASS:
        return Math.floor(Math.random() * 20) + 10;
      case TileType.LAND:
        return Math.floor(Math.random() * 50) + 30;
      case TileType.ROCK:
        return Math.floor(Math.random() * 100) + 50;
      case TileType.EMPTY:
        return 0;
    }
  }

  private static createRandomMapObject(): MapObject {
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
        return new TreeObject();
      case MapObjectType.BUILDING:
        return new BuildingObject();
      case MapObjectType.ROCK_PILE:
        return new RockPileObject();
      case MapObjectType.CHEST:
        return new ChestObject();
      case MapObjectType.WELL:
        return new WellObject();
    }
  }
}
