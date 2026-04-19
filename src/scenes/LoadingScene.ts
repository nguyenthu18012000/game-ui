import * as Phaser from "phaser";
import { Logger } from "../utils/logger";

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: "LoadingScene" });
  }

  preload() {
    Logger.info("LoadingScene: Preloading assets");

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Loading progress bar
    this.add.rectangle(width / 2, height / 2, 300, 30, 0x4a4a4a);
    const progressBarFill = this.add.rectangle(
      width / 2 - 150,
      height / 2,
      0,
      30,
      0x06a77d,
    );

    this.load.on("progress", (progress: number) => {
      if (progressBarFill) progressBarFill.displayWidth = 300 * progress;
    });

    this.load.on("complete", () => {
      Logger.info("LoadingScene: Assets loaded");
      this.scene.start("MenuScene");
    });

    // Load placeholder assets (replace with real assets later)
    // this.load.spritesheet('player-body', 'assets/player.png', { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    Logger.info("LoadingScene created");
  }
}
