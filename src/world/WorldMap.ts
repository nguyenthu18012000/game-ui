import type * as Phaser from "phaser";
import { GRID_SIZE, SPAWN_X, SPAWN_Y, WORLD_HEIGHT, WORLD_WIDTH } from "./WorldConfig";

const WORLD_BACKGROUND_COLOR = 0x1f2933;
const WORLD_BORDER_COLOR = 0x06a77d;
const GRID_COLOR = 0x334155;

export class WorldMap {
  constructor(private readonly scene: Phaser.Scene) {}

  create() {
    this.scene.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.scene.add
      .rectangle(SPAWN_X, SPAWN_Y, WORLD_WIDTH, WORLD_HEIGHT, WORLD_BACKGROUND_COLOR)
      .setDepth(-10);
    this.scene.add
      .rectangle(SPAWN_X, SPAWN_Y, WORLD_WIDTH, WORLD_HEIGHT, 0x000000, 0)
      .setStrokeStyle(4, WORLD_BORDER_COLOR, 0.4)
      .setDepth(-9);

    this.drawGrid();
  }

  private drawGrid() {
    const grid = this.scene.add.graphics().setDepth(-8);

    grid.lineStyle(1, GRID_COLOR, 0.55);
    for (let x = 0; x <= WORLD_WIDTH; x += GRID_SIZE) {
      grid.lineBetween(x, 0, x, WORLD_HEIGHT);
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += GRID_SIZE) {
      grid.lineBetween(0, y, WORLD_WIDTH, y);
    }

    grid.lineStyle(2, WORLD_BORDER_COLOR, 0.7);
    grid.lineBetween(SPAWN_X, 0, SPAWN_X, WORLD_HEIGHT);
    grid.lineBetween(0, SPAWN_Y, WORLD_WIDTH, SPAWN_Y);
  }
}
