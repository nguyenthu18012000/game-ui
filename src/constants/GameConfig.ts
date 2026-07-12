import * as Phaser from "phaser";

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const SOCKET_SERVER_URL = trimTrailingSlash(
  import.meta.env.VITE_SOCKET_SERVER_URL || "http://localhost:3000",
);
export const WEBSOCKET_SERVER_URL =
  import.meta.env.VITE_WEBSOCKET_SERVER_URL || "ws://localhost:8080/ws";

export const PHASER_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: "game-container",
  backgroundColor: "#2d2d2d",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};
