import * as Phaser from "phaser";
import { Logger } from "../utils/logger";

export class LobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: "LobbyScene" });
  }

  create() {
    Logger.info("LobbyScene created");

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a1a);

    // Title
    this.add
      .text(width / 2, 50, "SELECT CHARACTER", {
        fontSize: "36px",
        fontFamily: "Arial",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    // Game List Area
    this.add.rectangle(
      width / 2,
      height / 2,
      width - 40,
      height - 150,
      0x2d2d2d,
    );

    this.add.text(50, 120, "Available Games:", {
      fontSize: "20px",
      fontFamily: "Arial",
      color: "#06a77d",
    });

    // Start Game Button
    const startBtn = this.add
      .rectangle(width / 2, height - 50, 150, 40, 0x06a77d)
      .setInteractive();

    this.add
      .text(width / 2, height - 50, "START GAME", {
        fontSize: "16px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    startBtn.on("pointerdown", () => {
      Logger.info("LobbyScene: Starting game");
      this.scene.start("GameScene");
    });

    // Back Button
    const backBtn = this.add
      .rectangle(50, 20, 80, 30, 0x4a4a4a)
      .setInteractive();

    this.add
      .text(50, 20, "BACK", {
        fontSize: "12px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    backBtn.on("pointerdown", () => {
      Logger.info("LobbyScene: Going back");
      this.scene.start("MenuScene");
    });
  }
}
