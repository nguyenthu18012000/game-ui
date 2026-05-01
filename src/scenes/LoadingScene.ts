import * as Phaser from "phaser";
import { Logger } from "../utils/logger";
import { TokenService } from "../services/TokenService";

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: "LoadingScene" });
  }

  preload() {
    Logger.info("LoadingScene: Preloading assets");

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a1a);

    this.add
      .text(width / 2, height / 2 - 60, "TREASURE HUNTER", {
        fontSize: "36px",
        fontFamily: "Arial",
        color: "#06a77d",
      })
      .setOrigin(0.5);

    this.add.rectangle(width / 2, height / 2, 300, 10, 0x4a4a4a);
    const progressBarFill = this.add.rectangle(
      width / 2 - 150,
      height / 2,
      0,
      10,
      0x06a77d,
    );
    progressBarFill.setOrigin(0, 0.5);

    this.load.on("progress", (progress: number) => {
      progressBarFill.displayWidth = 300 * progress;
    });

    // Load placeholder assets (replace with real assets later)
    // this.load.spritesheet('player-body', 'assets/player.png', { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    Logger.info("LoadingScene: Checking token");

    const token = TokenService.getAccessToken();

    if (!token || TokenService.isTokenExpired()) {
      Logger.info("LoadingScene: No valid token → LoginScene");
      TokenService.clearTokens();
      this.scene.start("LoginScene");
    } else {
      Logger.info("LoadingScene: Token valid → GameScene");
      this.scene.start("GameScene");
    }
  }
}
