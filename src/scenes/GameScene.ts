import * as Phaser from "phaser";
import { GameSession } from "../game/GameSession";
import { Logger } from "../utils/logger";
import type { CharacterDetail } from "../services/CharacterService";

export class GameScene extends Phaser.Scene {
  private character: CharacterDetail | null = null;
  private session: GameSession | null = null;

  constructor() {
    super({ key: "GameScene" });
  }

  init(data?: { character?: CharacterDetail }) {
    this.character = data?.character ?? null;
  }

  create() {
    Logger.info("GameScene created");

    if (!this.character) {
      Logger.warn("GameScene started without character data; returning to LobbyScene");
      this.scene.start("LobbyScene");
      return;
    }

    this.session = new GameSession(this, this.character);
    this.session.create();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroySession());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.destroySession());
  }

  update() {
    this.session?.update();
  }

  private destroySession() {
    this.session?.destroy();
    this.session = null;
  }
}
