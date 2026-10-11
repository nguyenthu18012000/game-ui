import * as Phaser from "phaser";

export type PlayerMovementAnimation = "walk-left" | "walk-right" | "idle-left" | "idle-right";

export interface PlayerMovementInput {
  directionX: number;
  directionY: number;
  animation: PlayerMovementAnimation;
  moving: boolean;
}

export class PlayerInputController {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private lastFacing: "left" | "right" = "right";

  constructor(scene: Phaser.Scene) {
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  read(): PlayerMovementInput {
    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;

    let directionX = 0;
    let directionY = 0;
    if (left) directionX -= 1;
    if (right) directionX += 1;
    if (up) directionY -= 1;
    if (down) directionY += 1;

    const length = Math.hypot(directionX, directionY);
    if (length > 1) {
      directionX /= length;
      directionY /= length;
    }

    if (directionX < 0) this.lastFacing = "left";
    else if (directionX > 0) this.lastFacing = "right";

    const moving = directionX !== 0 || directionY !== 0;
    const animation = moving
      ? this.lastFacing === "left"
        ? "walk-left"
        : "walk-right"
      : this.lastFacing === "left"
        ? "idle-left"
        : "idle-right";

    return { directionX, directionY, animation, moving };
  }
}
