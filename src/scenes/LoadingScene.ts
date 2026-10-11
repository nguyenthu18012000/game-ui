import * as Phaser from "phaser";
import { Logger } from "../utils/logger";
import { TokenService } from "../services/TokenService";
import { AuthService } from "../services/AuthService";
import { PLAYER_ASSET_KEYS, ANIM_FRAME_COUNT } from "../entities/Player";
import { EQUIPMENT_ASSET_KEYS } from "../types/Equipment";

// ── Player idle sprites ────────────────────────────────────────────────────────────
import playerHeadUrl from "../assets/player/head.png";
import playerBodyUrl from "../assets/player/body.png";
import playerLegUrl from "../assets/player/leg.png";

// ── Player walk animation frames (1–5) ───────────────────────────────────────────
import animBody1 from "../assets/player/animation/anim_body_1.png";
import animBody2 from "../assets/player/animation/anim_body_2.png";
import animBody3 from "../assets/player/animation/anim_body_3.png";
import animBody4 from "../assets/player/animation/anim_body_4.png";
import animBody5 from "../assets/player/animation/anim_body_5.png";
import animLeg1 from "../assets/player/animation/anim_leg_1.png";
import animLeg2 from "../assets/player/animation/anim_leg_2.png";
import animLeg3 from "../assets/player/animation/anim_leg_3.png";
import animLeg4 from "../assets/player/animation/anim_leg_4.png";
import animLeg5 from "../assets/player/animation/anim_leg_5.png";

// ── Equipment icons only (sprites & animations are lazy-loaded via AssetLoader) ──
import eq1BodyIcon from "../assets/equipment/equipment1/equipment_body.png";
import eq1LegIcon from "../assets/equipment/equipment1/equipment_leg.png";
import eq2BodyIcon from "../assets/equipment/equipment2/equipment_body.png";
import eq2LegIcon from "../assets/equipment/equipment2/equipment_leg.png";

export class LoadingScene extends Phaser.Scene {
  private isAlive = false;

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
    const progressBarFill = this.add.rectangle(width / 2 - 150, height / 2, 0, 10, 0x06a77d);
    progressBarFill.setOrigin(0, 0.5);
    this.load.on("progress", (progress: number) => {
      progressBarFill.displayWidth = 300 * progress;
    });

    // ── Player idle sprites
    this.load.image(PLAYER_ASSET_KEYS.HEAD, playerHeadUrl);
    this.load.image(PLAYER_ASSET_KEYS.BODY, playerBodyUrl);
    this.load.image(PLAYER_ASSET_KEYS.LEG, playerLegUrl);

    // ── Player walk animation frames
    const playerBodyFrames = [animBody1, animBody2, animBody3, animBody4, animBody5];
    const playerLegFrames = [animLeg1, animLeg2, animLeg3, animLeg4, animLeg5];
    for (let i = 0; i < ANIM_FRAME_COUNT; i++) {
      this.load.image(PLAYER_ASSET_KEYS.BODY_ANIM_PREFIX + (i + 1), playerBodyFrames[i]);
      this.load.image(PLAYER_ASSET_KEYS.LEG_ANIM_PREFIX + (i + 1), playerLegFrames[i]);
    }

    // ── Equipment icons (sprites & animations loaded on-demand by AssetLoader)
    this.load.image(EQUIPMENT_ASSET_KEYS.EQ1_BODY_ICON, eq1BodyIcon);
    this.load.image(EQUIPMENT_ASSET_KEYS.EQ1_LEG_ICON, eq1LegIcon);
    this.load.image(EQUIPMENT_ASSET_KEYS.EQ2_BODY_ICON, eq2BodyIcon);
    this.load.image(EQUIPMENT_ASSET_KEYS.EQ2_LEG_ICON, eq2LegIcon);
  }

  create() {
    Logger.info("LoadingScene: Checking token");
    this.isAlive = true;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.isAlive = false;
    });
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.isAlive = false;
    });

    void this.routeByAuthState();
  }

  private async routeByAuthState() {
    const token = TokenService.getAccessToken();

    if (token && !TokenService.isTokenExpired()) {
      Logger.info("LoadingScene: Token valid → LobbyScene");
      this.scene.start("LobbyScene");
      return;
    }

    if (TokenService.getRefreshToken()) {
      Logger.info("LoadingScene: Access token expired, trying refresh");
      const refreshed = await AuthService.refreshAccessToken();
      if (!this.isAlive) return;

      if (refreshed.success && !TokenService.isTokenExpired()) {
        Logger.info("LoadingScene: Token refreshed → LobbyScene");
        this.scene.start("LobbyScene");
        return;
      }
    }

    Logger.info("LoadingScene: No valid token → LoginScene");
    TokenService.clearTokens();
    this.scene.start("LoginScene");
  }
}
