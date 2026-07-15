import * as Phaser from "phaser";
import { PHASER_CONFIG } from "./constants/GameConfig";
import { LoadingScene } from "./scenes/LoadingScene";
import { MenuScene } from "./scenes/MenuScene";
import { LoginScene } from "./scenes/LoginScene";
import { RegisterScene } from "./scenes/RegisterScene";
import { GameScene } from "./scenes/GameScene";
import { LobbyScene } from "./scenes/LobbyScene";
import { AuthEventListener } from "./services/AuthEventListener";

// Setup auth event listeners
AuthEventListener.setup();

const config: Phaser.Types.Core.GameConfig = {
  ...PHASER_CONFIG,
  scene: [LoadingScene, MenuScene, LoginScene, RegisterScene, LobbyScene, GameScene],
};

const game = new Phaser.Game(config);

// Khi token hết hạn và refresh thất bại → redirect về LoginScene
window.addEventListener("auth:token-expired", () => {
  const activeScenes = game.scene.getScenes(true);
  activeScenes.forEach((scene) => scene.scene.stop());
  game.scene.start("LoginScene");
});
