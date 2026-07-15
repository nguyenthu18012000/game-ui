import { describe, expect, it } from "vitest";
import { TileMap } from "../../src/entities/map/TileMap";
import { GrassTile } from "../../src/entities/map/tiles/MapTile";

describe("TileMap", () => {
  it("returns null for coordinates outside the map", () => {
    const tile = new GrassTile(0, 0, 60, 10);
    const map = new TileMap(1, 1, 60, [[tile]]);

    expect(map.getTile(-1, 0)).toBeNull();
    expect(map.getTile(1, 0)).toBeNull();
  });

  it("tracks and regenerates depleted farmable tiles", () => {
    const tile = new GrassTile(0, 0, 60, 10);
    const map = new TileMap(1, 1, 60, [[tile]]);

    expect(map.damageTile(0, 0, tile.maxHealth)).toBe(true);
    expect(tile.isDepleted).toBe(true);

    const regenerated = map.updateRegeneration(0, Date.now());

    expect(regenerated).toEqual([tile]);
    expect(tile.isDepleted).toBe(false);
    expect(tile.health).toBe(tile.maxHealth);
  });
});
