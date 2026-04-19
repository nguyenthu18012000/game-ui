import * as Phaser from "phaser";
import { ANIMATION_SPEED } from "../constants/GameConstants";
import { Logger } from "../utils/logger";

export class AnimationService {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  createPlayerAnimations() {
    // Walk right
    this.scene.anims.create({
      key: "player-walk-right",
      frames: this.scene.anims.generateFrameNumbers("player-body", {
        start: 0,
        end: 3,
      }),
      frameRate: ANIMATION_SPEED.WALK,
      repeat: -1,
    });

    // Walk left
    this.scene.anims.create({
      key: "player-walk-left",
      frames: this.scene.anims.generateFrameNumbers("player-body", {
        start: 4,
        end: 7,
      }),
      frameRate: ANIMATION_SPEED.WALK,
      repeat: -1,
    });

    // Idle right
    this.scene.anims.create({
      key: "player-idle-right",
      frames: [{ key: "player-body", frame: 0 }],
      frameRate: 10,
    });

    // Idle left
    this.scene.anims.create({
      key: "player-idle-left",
      frames: [{ key: "player-body", frame: 4 }],
      frameRate: 10,
    });

    Logger.info("Player animations created");
  }

  createEquipmentAnimations(equipmentKey: string) {
    const key = `${equipmentKey}-walk-right`;
    if (this.scene.anims.exists(key)) {
      Logger.debug(`Animation already exists: ${key}`);
      return;
    }

    this.scene.anims.create({
      key,
      frames: this.scene.anims.generateFrameNumbers(equipmentKey, {
        start: 0,
        end: 3,
      }),
      frameRate: ANIMATION_SPEED.WALK,
      repeat: -1,
    });

    Logger.info(`Equipment animation created: ${key}`);
  }

  playAnimation(sprite: Phaser.Physics.Arcade.Sprite, animKey: string) {
    if (!sprite.anims.isPlaying || sprite.anims.currentAnim?.key !== animKey) {
      sprite.play(animKey, true);
    }
  }
}
