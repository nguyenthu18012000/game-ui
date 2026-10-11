import type * as Phaser from "phaser";
import { WORLD_HEIGHT, WORLD_WIDTH } from "./WorldConfig";

export class CameraController {
  constructor(private readonly scene: Phaser.Scene) {}

  follow(target: Phaser.GameObjects.GameObject) {
    const camera = this.scene.cameras.main;
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    camera.startFollow(target);
    camera.setLerp(0.1, 0.1);
  }
}
