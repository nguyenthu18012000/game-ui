import * as Phaser from "phaser";
import { Logger } from "../utils/logger";

export class Player extends Phaser.Physics.Arcade.Sprite {
  public id!: string;
  public playerName!: string;
  private layers: {
    body?: Phaser.Physics.Arcade.Sprite;
    head?: Phaser.Physics.Arcade.Sprite;
    weapon?: Phaser.Physics.Arcade.Sprite;
  } = {};

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    id: string,
    name: string,
  ) {
    super(scene, x, y, "player-body");
    this.id = id;
    this.playerName = name;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);

    Logger.info(`Player created: ${name} (${id})`);
  }

  changeEquipment(slot: string, spriteKey: string) {
    Logger.info(
      `${this.playerName}: Equipment changed - ${slot}: ${spriteKey}`,
    );

    // Update layers based on slot
    if (slot === "body" && this.layers.body) {
      this.layers.body.setTexture(spriteKey);
    } else if (slot === "weapon" && this.layers.weapon) {
      this.layers.weapon.setTexture(spriteKey);
    }
  }

  playAnimation(animKey: string) {
    this.play(animKey, true);
  }

  stopAnimation() {
    this.stop();
    this.play("player-idle-right");
  }

  setPosition(x: number, y: number): this {
    super.setPosition(x, y);
    Object.values(this.layers).forEach((layer) => {
      if (layer) layer.setPosition(x, y);
    });
    return this;
  }

  destroy(fromScene?: boolean): void {
    Object.values(this.layers).forEach((layer) => {
      if (layer) layer.destroy();
    });
    super.destroy(fromScene);
  }
}
