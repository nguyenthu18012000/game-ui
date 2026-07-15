export abstract class MapEntity<TType extends string> {
  readonly type: TType;

  protected constructor(type: TType) {
    this.type = type;
  }
}

export abstract class PositionedMapEntity<TType extends string> extends MapEntity<TType> {
  readonly x: number;
  readonly y: number;
  readonly pixelX: number;
  readonly pixelY: number;
  readonly tileSize: number;

  protected constructor(type: TType, x: number, y: number, tileSize: number) {
    super(type);
    this.x = x;
    this.y = y;
    this.tileSize = tileSize;
    this.pixelX = x * tileSize;
    this.pixelY = y * tileSize;
  }
}

export abstract class DamageableMapEntity<TType extends string> extends MapEntity<TType> {
  health: number;
  maxHealth: number;
  isDepleted = false;
  depletedAt?: number;

  protected constructor(type: TType, maxHealth: number) {
    super(type);
    this.health = maxHealth;
    this.maxHealth = maxHealth;
  }

  damage(amount: number): boolean {
    if (this.isDepleted) {
      return false;
    }

    this.health = Math.max(0, this.health - amount);
    if (this.health > 0) {
      return false;
    }

    this.isDepleted = true;
    this.depletedAt = Date.now();
    return true;
  }

  restore() {
    this.health = this.maxHealth;
    this.isDepleted = false;
    delete this.depletedAt;
  }
}
