import * as Phaser from "phaser";
import { Logger } from "../utils/logger";
import { Player } from "../entities/Player";
import type { CharacterDetail } from "../services/CharacterService";
import type { PlayerData } from "../types/Player";
import { SocketManager } from "../network/SocketManager";
import { SOCKET_EVENTS } from "../constants/SocketEvents";
import { EquipmentHUD, type HotbarSlot } from "../ui/EquipmentHUD";

const SPEED = 160;
const MOVEMENT_SYNC_INTERVAL = 50;
const POSITION_EPSILON = 1;
const WORLD_WIDTH = 6000;
const WORLD_HEIGHT = 6000;
const SPAWN_X = WORLD_WIDTH / 2;
const SPAWN_Y = WORLD_HEIGHT / 2;
const GRID_SIZE = 300;

interface RemoteMovePayload {
  playerId?: string;
  id?: string;
  name?: string;
  x: number;
  y: number;
  animation?: string;
}

const isRemoteMovePayload = (value: unknown): value is RemoteMovePayload => {
  if (typeof value !== "object" || value === null) return false;
  const payload = value as Record<string, unknown>;
  const playerId = payload.playerId ?? payload.id;
  return (
    typeof playerId === "string" &&
    typeof payload.x === "number" &&
    Number.isFinite(payload.x) &&
    typeof payload.y === "number" &&
    Number.isFinite(payload.y) &&
    (payload.name === undefined || typeof payload.name === "string") &&
    (payload.animation === undefined || typeof payload.animation === "string")
  );
};

export class GameScene extends Phaser.Scene {
  // Character from LobbyScene
  private character: CharacterDetail | null = null;

  // Gameplay
  private player!: Player;
  private socketManager: SocketManager | null = null;
  private remotePlayers = new Map<string, Player>();
  private lastMovementSync = 0;
  private lastSyncedPosition = { x: Number.NaN, y: Number.NaN };
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  private coordinatesUI!: Phaser.GameObjects.Text;

  // HUD
  private equipmentHUD!: EquipmentHUD;

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

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanupSocket());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanupSocket());
    this.startPlaying(this.character);
  }

  // ─── PLAYING ──────────────────────────────────────────────────────────────

  private startPlaying(character: CharacterDetail) {
    Logger.info("Starting game for character:", character.name);

    // Setup physics world bounds
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.add.rectangle(SPAWN_X, SPAWN_Y, WORLD_WIDTH, WORLD_HEIGHT, 0x1f2933).setDepth(-10);
    this.add
      .rectangle(SPAWN_X, SPAWN_Y, WORLD_WIDTH, WORLD_HEIGHT, 0x000000, 0)
      .setStrokeStyle(4, 0x06a77d, 0.4)
      .setDepth(-9);
    this.drawWorldGrid();

    // Player với tên từ character - spawn ở giữa bản đồ
    this.player = new Player(this, SPAWN_X, SPAWN_Y, character.id, character.name);

    // Setup camera
    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    camera.startFollow(this.player);
    camera.setLerp(0.1, 0.1);

    // HUD - Character name
    const nameText = this.add.text(10, 10, character.name, {
      fontSize: "14px",
      color: "#06a77d",
    });
    nameText.setScrollFactor(0);

    const instructionText = this.add.text(10, 28, "WASD / Arrow keys to move", {
      fontSize: "11px",
      color: "#aaaaaa",
    });
    instructionText.setScrollFactor(0);

    // HUD - Coordinates (relative to map center)
    this.coordinatesUI = this.add.text(10, 46, "Position: (0, 0)", {
      fontSize: "13px",
      color: "#00ffff",
      fontStyle: "bold",
    });
    this.coordinatesUI.setScrollFactor(0);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.setupSocket();

    // Equipment HUD
    this.equipmentHUD = new EquipmentHUD(this);
    this.equipmentHUD.onEquip = (item) => {
      if (item.slot === "body")
        this.player.equipBody(item.spriteKey, item.animPrefix, item.assetFolder);
      if (item.slot === "legs")
        this.player.equipLegs(item.spriteKey, item.animPrefix, item.assetFolder);
    };
    this.equipmentHUD.onUnequip = (slot) => {
      if (slot === "body") this.player.equipBody(null, null);
      if (slot === "legs") this.player.equipLegs(null, null);
    };

    // Hotbar number keys 1-7 (highlight + equip item in that slot)
    const hotbarKeys = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN"] as const;
    hotbarKeys.forEach((name, i) => {
      this.input.keyboard!.on(`keydown-${name}`, () => {
        this.equipmentHUD.setActiveHotbar(i as HotbarSlot);
      });
    });
  }

  private drawWorldGrid() {
    const grid = this.add.graphics().setDepth(-8);

    grid.lineStyle(1, 0x334155, 0.55);
    for (let x = 0; x <= WORLD_WIDTH; x += GRID_SIZE) {
      grid.lineBetween(x, 0, x, WORLD_HEIGHT);
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += GRID_SIZE) {
      grid.lineBetween(0, y, WORLD_WIDTH, y);
    }

    grid.lineStyle(2, 0x06a77d, 0.7);
    grid.lineBetween(SPAWN_X, 0, SPAWN_X, WORLD_HEIGHT);
    grid.lineBetween(0, SPAWN_Y, WORLD_WIDTH, SPAWN_Y);
  }

  private setupSocket() {
    this.cleanupSocket();
    this.socketManager = new SocketManager();
    this.socketManager.on(SOCKET_EVENTS.CONNECT, () => this.emitPlayerPosition("idle-right", true));
    this.socketManager.on(SOCKET_EVENTS.PLAYER_MOVE, this.handleRemoteMove);
  }

  private cleanupSocket() {
    if (this.socketManager) {
      this.socketManager.off(SOCKET_EVENTS.PLAYER_MOVE, this.handleRemoteMove);
      this.socketManager.disconnect();
      this.socketManager = null;
    }
    this.remotePlayers.forEach((player) => player.destroy());
    this.remotePlayers.clear();
  }

  private emitPlayerPosition(animation: string, force = false) {
    if (!this.socketManager || !this.character || !this.player) return;
    const now = this.time.now;
    const dx = Math.abs(this.player.x - this.lastSyncedPosition.x);
    const dy = Math.abs(this.player.y - this.lastSyncedPosition.y);
    const changed = dx > POSITION_EPSILON || dy > POSITION_EPSILON;
    if (!force && (!changed || now - this.lastMovementSync < MOVEMENT_SYNC_INTERVAL)) return;
    this.lastMovementSync = now;
    this.lastSyncedPosition = { x: this.player.x, y: this.player.y };
    this.socketManager.emit(SOCKET_EVENTS.PLAYER_MOVE, {
      playerId: this.character.id,
      id: this.character.id,
      name: this.character.name,
      x: this.player.x,
      y: this.player.y,
      animation,
    });
  }

  private handleRemoteMove = (...args: unknown[]) => {
    const data = args[0];
    if (!isRemoteMovePayload(data)) {
      Logger.warn("Ignored invalid remote player movement", data);
      return;
    }
    const playerId = data.playerId ?? data.id;
    if (!playerId || playerId === this.character?.id) return;
    const playerData: PlayerData = {
      id: playerId,
      name: data.name ?? `Player ${playerId.slice(0, 4)}`,
      x: data.x,
      y: data.y,
      level: 1,
      hp: 100,
      maxHp: 100,
      equipment: {},
    };
    if (data.animation !== undefined) playerData.animation = data.animation;
    this.upsertRemotePlayer(playerData);
  };

  private upsertRemotePlayer(data: PlayerData) {
    let remotePlayer = this.remotePlayers.get(data.id);
    if (!remotePlayer) {
      remotePlayer = new Player(this, data.x, data.y, data.id, data.name);
      this.remotePlayers.set(data.id, remotePlayer);
    }
    remotePlayer.setPosition(data.x, data.y);
    (remotePlayer.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    remotePlayer.setMoving(data.animation?.startsWith("walk") ?? false);
    if (data.animation?.includes("left")) remotePlayer.faceLeft();
    else if (data.animation?.includes("right")) remotePlayer.faceRight();
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  update() {
    if (!this.player) return;

    // Update player coordinates display
    const relativeX = Math.round(this.player.x - SPAWN_X);
    const relativeY = Math.round(this.player.y - SPAWN_Y);
    this.coordinatesUI.setText(`Position: (${relativeX}, ${relativeY})`);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;

    if (left) {
      body.setVelocityX(-SPEED);
      this.player.faceLeft();
    } else if (right) {
      body.setVelocityX(SPEED);
      this.player.faceRight();
    }
    if (up) body.setVelocityY(-SPEED);
    if (down) body.setVelocityY(SPEED);

    this.player.setMoving(left || right || up || down);
    const animation = left
      ? "walk-left"
      : right
        ? "walk-right"
        : up || down
          ? "walk-right"
          : "idle-right";
    this.emitPlayerPosition(animation);
  }
}
