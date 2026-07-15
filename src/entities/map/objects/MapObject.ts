import type { MapObject } from "../../../types/Tile";
import { MapObjectType } from "../../../types/Tile";
import { DamageableMapEntity } from "../MapEntity";

export abstract class MapObjectEntity
  extends DamageableMapEntity<MapObjectType>
  implements MapObject
{
  protected constructor(type: MapObjectType, health?: number) {
    super(type, health ?? 0);
  }

  get isDamageable() {
    return this.maxHealth > 0;
  }

  damage(amount: number): boolean {
    if (!this.isDamageable) {
      return false;
    }

    return super.damage(amount);
  }

  restore() {
    if (!this.isDamageable) {
      return;
    }

    this.health = this.maxHealth;
    this.isDepleted = false;
    delete this.depletedAt;
  }
}

export class TreeObject extends MapObjectEntity {
  constructor() {
    super(MapObjectType.TREE, 3);
  }
}

export class BuildingObject extends MapObjectEntity {
  constructor() {
    super(MapObjectType.BUILDING);
  }
}

export class RockPileObject extends MapObjectEntity {
  constructor() {
    super(MapObjectType.ROCK_PILE, 2);
  }
}

export class ChestObject extends MapObjectEntity {
  constructor() {
    super(MapObjectType.CHEST);
  }
}

export class WellObject extends MapObjectEntity {
  constructor() {
    super(MapObjectType.WELL);
  }
}
