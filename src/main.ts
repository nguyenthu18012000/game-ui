import * as Phaser from "phaser";
import { PHASER_CONFIG } from "./constants/GameConfig";
import { LoadingScene } from "./scenes/LoadingScene";
import { MenuScene } from "./scenes/MenuScene";
import { LoginScene } from "./scenes/LoginScene";
import { RegisterScene } from "./scenes/RegisterScene";
import { LobbyScene } from "./scenes/LobbyScene";
import { GameScene } from "./scenes/GameScene";
import { AuthEventListener } from "./services/AuthEventListener";

// Setup auth event listeners
AuthEventListener.setup();

const config: Phaser.Types.Core.GameConfig = {
  ...PHASER_CONFIG,
  scene: [
    MenuScene,
    LoginScene,
    RegisterScene,
    LobbyScene,
    GameScene,
    LoadingScene,
  ],
};

new Phaser.Game(config);
