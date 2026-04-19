import * as Phaser from "phaser";
import { Logger } from "../utils/logger";
import { AnimationService } from "../services/AnimationService";

export class GameScene extends Phaser.Scene {
  private animationService!: AnimationService;

  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    Logger.info("GameScene created");

    // Initialize services
    this.animationService = new AnimationService(this);

    // Background
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a3a3a);

    // Create placeholder player sprite
    const playerX = width / 2;
    const playerY = height / 2;

    // For now, create a simple rectangle as player
    const player = this.add.rectangle(playerX, playerY, 40, 60, 0x06a77d);
    this.physics.add.existing(player);

    // Create animations
    this.animationService.createPlayerAnimations();

    // UI
    this.add.text(10, 10, "Game Scene", {
      fontSize: "16px",
      color: "#ffffff",
    });

    // Simple movement demonstration
    const keys = this.input.keyboard?.createCursorKeys();
    if (keys) {
      this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
        if (event.key.toLowerCase() === "e") {
          Logger.info("Equipment changed");
          // Equipment change demonstration
        }
      });
    }
  }

  update() {
    // Update game logic
  }
}
