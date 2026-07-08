import type { HarvestResult, MapObject, Tile, TileReward } from "../../../types/Tile";
import { TileType } from "../../../types/Tile";
import { PositionedMapEntity } from "../MapEntity";

export abstract class MapTile
  extends PositionedMapEntity<TileType>
  implements Tile {
  readonly isFarmable: boolean;
  resourceAmount: number;
  isExplored = false;
  object?: MapObject;
  health?: number;
  maxHealth?: number;
  isDepleted = false;
  depletedAt?: number;

  protected constructor(
    x: number,
    y: number,
    tileSize: number,
    type: TileType,
    resourceAmount: number,
    isFarmable: boolean,
  ) {
    super(type, x, y, tileSize);
    this.resourceAmount = resourceAmount;
    this.isFarmable = isFarmable;
  }
}

export class EmptyTile extends MapTile {
  constructor(x: number, y: number, tileSize: number) {
    super(x, y, tileSize, TileType.EMPTY, 0, false);
  }
}

export abstract class FarmableTile extends MapTile {
  protected constructor(
    x: number,
    y: number,
    tileSize: number,
    type: TileType,
    resourceAmount: number,
    maxHealth: number,
  ) {
    super(x, y, tileSize, type, resourceAmount, true);
    this.health = maxHealth;
    this.maxHealth = maxHealth;
  }

  damage(amount: number): boolean {
    if (
      this.isDepleted ||
      this.health === undefined ||
      this.maxHealth === undefined
    ) {
      return false;
    }

    this.health = Math.max(0, this.health - amount);

    if (this.health > 0) {
      return false;
    }

    this.health = 0;
    this.isDepleted = true;
    this.depletedAt = Date.now();
    return true;
  }

  harvest(damage: number): HarvestResult {
    const depleted = this.damage(damage);

    return {
      depleted,
      reward: depleted ? this.createReward() : null,
      tile: this,
    };
  }

  regenerate() {
    this.health = this.maxHealth;
    this.isDepleted = false;
    this.depletedAt = undefined;
  }

  protected createReward(): TileReward {
    return {
      resourceType: this.type,
      amount: this.resourceAmount,
    };
  }
}

export class GrassTile extends FarmableTile {
  constructor(x: number, y: number, tileSize: number, resourceAmount: number) {
    super(x, y, tileSize, TileType.GRASS, resourceAmount, 40);
  }

  protected override createReward(): TileReward {
    return {
      resourceType: TileType.GRASS,
      amount: this.resourceAmount,
    };
  }
}

export class LandTile extends FarmableTile {
  constructor(x: number, y: number, tileSize: number, resourceAmount: number) {
    super(x, y, tileSize, TileType.LAND, resourceAmount, 20);
  }

  protected override createReward(): TileReward {
    return {
      resourceType: TileType.LAND,
      amount: this.resourceAmount,
    };
  }
}

export class RockTile extends FarmableTile {
  constructor(x: number, y: number, tileSize: number, resourceAmount: number) {
    super(x, y, tileSize, TileType.ROCK, resourceAmount, 60);
  }

  protected override createReward(): TileReward {
    return {
      resourceType: TileType.ROCK,
      amount: this.resourceAmount,
    };
  }
}
