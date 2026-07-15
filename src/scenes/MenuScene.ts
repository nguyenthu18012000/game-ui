import * as Phaser from "phaser";
import { Logger } from "../utils/logger";
import { AuthService } from "../services/AuthService";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
  }

  create() {
    Logger.info("MenuScene created");

    // Background
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(width / 2, height / 2, width, height, 0x2d2d2d);

    // Title
    this.add
      .text(width / 2, height / 4, "TREASURE HUNTER", {
        fontSize: "48px",
        fontFamily: "Arial",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    // Check if user already logged in
    if (AuthService.isLoggedIn()) {
      this.createLoggedInMenu(width, height);
    } else {
      this.createAuthMenu(width, height);
    }
  }

  private createAuthMenu(width: number, height: number) {
    // Login Button
    const loginBtn = this.add
      .rectangle(width / 2, height / 2 - 30, 150, 50, 0x06a77d)
      .setInteractive();

    this.add
      .text(width / 2, height / 2 - 30, "LOGIN", {
        fontSize: "24px",
        fontFamily: "Arial",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    loginBtn.on("pointerdown", () => {
      Logger.info("MenuScene: Going to LoginScene");
      this.scene.start("LoginScene");
    });

    // Register Button
    const registerBtn = this.add
      .rectangle(width / 2, height / 2 + 40, 150, 50, 0x3498db)
      .setInteractive();

    this.add
      .text(width / 2, height / 2 + 40, "REGISTER", {
        fontSize: "24px",
        fontFamily: "Arial",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    registerBtn.on("pointerdown", () => {
      Logger.info("MenuScene: Going to RegisterScene");
      this.scene.start("RegisterScene");
    });
  }

  private createLoggedInMenu(width: number, height: number) {
    const user = AuthService.getCurrentUser();

    // Welcome text
    this.add
      .text(width / 2, height / 2 - 60, `Welcome, ${user?.username || "Player"}!`, {
        fontSize: "24px",
        fontFamily: "Arial",
        color: "#06a77d",
        align: "center",
      })
      .setOrigin(0.5);

    // Play Button
    const playBtn = this.add.rectangle(width / 2, height / 2, 150, 50, 0x06a77d).setInteractive();

    this.add
      .text(width / 2, height / 2, "PLAY", {
        fontSize: "24px",
        fontFamily: "Arial",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    playBtn.on("pointerdown", () => {
      Logger.info("MenuScene: Starting game");
      this.scene.start("LobbyScene");
    });

    // Logout Button
    const logoutBtn = this.add
      .rectangle(width / 2, height / 2 + 70, 150, 50, 0xe74c3c)
      .setInteractive();

    this.add
      .text(width / 2, height / 2 + 70, "LOGOUT", {
        fontSize: "20px",
        fontFamily: "Arial",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    logoutBtn.on("pointerdown", () => {
      Logger.info("MenuScene: Logging out");
      AuthService.logout();
      this.scene.restart();
    });
  }
}
