import * as Phaser from "phaser";
import type { Player } from "../entities/Player";

const SPEED = 160;

export type PlayerMovementAnimation = "walk-left" | "walk-right" | "idle-right";

export class PlayerInputController {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  constructor(scene: Phaser.Scene, private readonly player: Player) {
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  update(): PlayerMovementAnimation {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;

    if (left) {
      body.setVelocityX(-SPEED);
      this.player.faceLeft();
    } else if (right) {
      body.setVelocityX(SPEED);
      this.player.faceRight();
    }
    if (up) body.setVelocityY(-SPEED);
    if (down) body.setVelocityY(SPEED);

    this.player.setMoving(left || right || up || down);

    if (left) return "walk-left";
    if (right || up || down) return "walk-right";
    return "idle-right";
  }
}
