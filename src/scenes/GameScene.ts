import * as Phaser from "phaser";
import { Logger } from "../utils/logger";
import { Player } from "../entities/Player";
import {
  CharacterService,
  type CharacterDetail,
} from "../services/CharacterService";
import { TileMapService } from "../services/TileMapService";
import { TileMapRenderer } from "../services/TileMapRenderer";
import type { TileMap } from "../types/Tile";

const SPEED = 160;

interface InputField {
  container: Phaser.GameObjects.Container;
  input: Phaser.GameObjects.Text;
  value: string;
  placeholder: string;
}

export class GameScene extends Phaser.Scene {
  // Game state
  private state: "loading" | "lobby" | "playing" = "loading";
  private lobbyLoaded = false;

  // Lobby UI
  private lobbyUI!: Phaser.GameObjects.Container;
  private createPopup!: Phaser.GameObjects.Container;
  private characterNameInput!: InputField;
  private popupErrorText!: Phaser.GameObjects.Text;
  private isCreating = false;

  // Gameplay
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  // TileMap
  private tileMap!: TileMap;
  private tileMapRenderer!: TileMapRenderer;
  private totalResourcesMined = 0;
  private resourcesUI!: Phaser.GameObjects.Text;
  private coordinatesUI!: Phaser.GameObjects.Text;
  private lastFarmedTile: { x: number; y: number } | null = null;
  private farmCooldown = 0;
  private readonly FARM_COOLDOWN_TIME = 500; // 500ms between farms

  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    Logger.info("GameScene created");
    this.state = "loading";

    // Only load lobby if not already loaded (prevent double-load on reload)
    if (!this.lobbyLoaded) {
      this.showLobby();
    }
  }

  // ─── LOBBY ────────────────────────────────────────────────────────────────

  private async showLobby() {
    if (this.lobbyLoaded) return; // Prevent duplicate loading

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.lobbyUI = this.add.container(0, 0);

    // Background
    const bg = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x1a1a1a,
    );
    this.lobbyUI.add(bg);

    // Title
    const title = this.add
      .text(width / 2, 50, "CHARACTER", {
        fontSize: "36px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.lobbyUI.add(title);

    // Back button → Menu
    const backBtn = this.add
      .rectangle(50, 20, 80, 30, 0x4a4a4a)
      .setInteractive();
    const backLabel = this.add
      .text(50, 20, "BACK", {
        fontSize: "12px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    backBtn.on("pointerdown", () => this.scene.start("MenuScene"));
    this.lobbyUI.add([backBtn, backLabel]);

    // Loading indicator
    const loadingText = this.add
      .text(width / 2, height / 2, "Đang tải...", {
        fontSize: "16px",
        fontFamily: "Arial",
        color: "#888888",
      })
      .setOrigin(0.5);
    this.lobbyUI.add(loadingText);

    this.state = "lobby";
    this.lobbyLoaded = true;

    const character = await CharacterService.getDetail();
    loadingText.destroy();

    if (character) {
      this.renderLobbyCharacter(character);
    } else {
      this.showCreatePopup();
    }
  }

  private renderLobbyCharacter(character: CharacterDetail) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const cx = width / 2;
    const cy = height / 2;

    // Preview nhân vật dùng Player class
    const preview = new Player(this, cx, cy, "preview", character.name);
    // Tắt physics cho preview
    (preview.body as Phaser.Physics.Arcade.Body).setEnable(false);
    this.lobbyUI.add(preview);

    // Start Game button
    const startBtn = this.add
      .rectangle(cx, height - 50, 160, 44, 0x06a77d)
      .setInteractive();
    const startLabel = this.add
      .text(cx, height - 50, "START GAME", {
        fontSize: "16px",
        fontFamily: "Arial",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    startBtn.on("pointerover", () => startBtn.setFillStyle(0x059669));
    startBtn.on("pointerout", () => startBtn.setFillStyle(0x06a77d));
    startBtn.on("pointerdown", () => this.startPlaying(character));

    this.lobbyUI.add([startBtn, startLabel]);
  }

  private showCreatePopup() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const cx = width / 2;
    const cy = height / 2;

    this.add.rectangle(cx, cy, width, height, 0x000000, 0.6);

    this.createPopup = this.add.container(cx, cy);

    const panelW = 340;
    const panelH = 220;

    const bg = this.add.rectangle(0, 0, panelW, panelH, 0x2d2d2d);
    bg.setStrokeStyle(2, 0x06a77d);

    const title = this.add
      .text(0, -panelH / 2 + 28, "TẠO NHÂN VẬT", {
        fontSize: "20px",
        fontFamily: "Arial",
        color: "#06a77d",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.characterNameInput = this.createInputField(0, -20);

    this.popupErrorText = this.add
      .text(0, 32, "", {
        fontSize: "13px",
        fontFamily: "Arial",
        color: "#e74c3c",
        align: "center",
        wordWrap: { width: panelW - 40 },
      })
      .setOrigin(0.5);

    const createBtn = this.add
      .rectangle(0, 76, 160, 40, 0x06a77d)
      .setInteractive();
    const createBtnText = this.add
      .text(0, 76, "TẠO", {
        fontSize: "15px",
        fontFamily: "Arial",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    createBtn.on("pointerover", () => createBtn.setFillStyle(0x059669));
    createBtn.on("pointerout", () => createBtn.setFillStyle(0x06a77d));
    createBtn.on("pointerdown", () => this.handleCreateCharacter());

    this.createPopup.add([
      bg,
      title,
      this.characterNameInput.container,
      this.popupErrorText,
      createBtn,
      createBtnText,
    ]);

    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (this.state !== "lobby") return;
      const key = event.key;
      if (key === "Backspace") {
        this.characterNameInput.value = this.characterNameInput.value.slice(
          0,
          -1,
        );
        this.updateInputDisplay();
      } else if (key === "Enter") {
        this.handleCreateCharacter();
      } else if (key.length === 1) {
        this.characterNameInput.value += key;
        this.updateInputDisplay();
      }
    });
  }

  private createInputField(x: number, y: number): InputField {
    const placeholder = "Nhập tên nhân vật...";
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 260, 40, 0x1a1a1a);
    bg.setStrokeStyle(2, 0x444444);
    const inputText = this.add
      .text(-120, -8, placeholder, {
        fontSize: "14px",
        fontFamily: "Arial",
        color: "#888888",
      })
      .setOrigin(0, 0);
    container.add([bg, inputText]);
    bg.setInteractive();
    bg.on("pointerdown", () => {
      bg.setStrokeStyle(2, 0x06a77d);
      inputText.setColor("#ffffff");
    });
    return { container, input: inputText, value: "", placeholder };
  }

  private updateInputDisplay() {
    const field = this.characterNameInput;
    if (field.value === "") {
      field.input.setText(field.placeholder);
      field.input.setColor("#888888");
    } else {
      field.input.setText(field.value);
      field.input.setColor("#ffffff");
    }
  }

  private async handleCreateCharacter() {
    if (this.isCreating) return;
    const name = this.characterNameInput.value.trim();
    if (!name) {
      this.popupErrorText.setText("Tên nhân vật không được để trống");
      return;
    }
    if (name.length < 2) {
      this.popupErrorText.setText("Tên nhân vật phải ít nhất 2 ký tự");
      return;
    }
    this.isCreating = true;
    this.popupErrorText.setColor("#06a77d");
    this.popupErrorText.setText("Đang tạo nhân vật...");
    try {
      const ok = await CharacterService.create(name);
      if (!ok) {
        this.popupErrorText.setColor("#e74c3c");
        this.popupErrorText.setText("Tạo nhân vật thất bại, thử lại");
        return;
      }
      const character = await CharacterService.getDetail();
      if (character) {
        this.createPopup.destroy();
        this.renderLobbyCharacter(character);
      }
    } catch (err: any) {
      this.popupErrorText.setColor("#e74c3c");
      this.popupErrorText.setText("Lỗi: " + err.message);
    } finally {
      this.isCreating = false;
    }
  }

  // ─── PLAYING ──────────────────────────────────────────────────────────────

  private startPlaying(character: CharacterDetail) {
    Logger.info("Starting game for character:", character.name);
    this.state = "playing";

    // Destroy all lobby UI
    this.lobbyUI.destroy(true);

    // Create tilemap
    this.tileMap = TileMapService.generateMap();
    this.tileMapRenderer = new TileMapRenderer(this);
    this.tileMapRenderer.renderMap(this.tileMap);

    // Setup physics world bounds
    this.physics.world.setBounds(0, 0, 24000, 24000);

    // Player với tên từ character - spawn ở giữa bản đồ
    this.player = new Player(this, 12000, 12000, "local", character.name);

    // Setup camera
    const camera = this.cameras.main;
    camera.setBounds(0, 0, 24000, 24000);
    camera.startFollow(this.player);
    camera.setLerp(0.1, 0.1);

    // HUD - Character name
    const nameText = this.add.text(10, 10, character.name, {
      fontSize: "14px",
      color: "#06a77d",
    });
    nameText.setScrollFactor(0);

    const instructionText = this.add.text(
      10,
      28,
      "WASD / Arrow keys to move • Walk to farm",
      {
        fontSize: "11px",
        color: "#aaaaaa",
      },
    );
    instructionText.setScrollFactor(0);

    // HUD - Resources
    this.resourcesUI = this.add.text(10, 46, "Resources Farmed: 0", {
      fontSize: "13px",
      color: "#ffff00",
      fontStyle: "bold",
    });
    this.resourcesUI.setScrollFactor(0);

    // HUD - Coordinates (relative to map center)
    this.coordinatesUI = this.add.text(10, 64, "Position: (0, 0)", {
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
  }

  // ─── AUTO FARM ────────────────────────────────────────────────────────────

  private autoFarmCurrentTile() {
    if (!this.player) return;

    // Get tile at player position
    const tile = TileMapService.getTileByPixel(
      this.tileMap,
      this.player.x,
      this.player.y,
    );

    if (!tile || !tile.isFarmable || tile.isDepleted) return;

    // Check if it's a different tile or cooldown expired
    if (
      !this.lastFarmedTile ||
      this.lastFarmedTile.x !== tile.x ||
      this.lastFarmedTile.y !== tile.y ||
      this.farmCooldown <= 0
    ) {
      // Damage the tile
      TileMapService.damageTile(this.tileMap, tile.x, tile.y, 10);

      Logger.info(
        `Farmed tile at (${tile.x}, ${tile.y}) - Health: ${tile.health}/${tile.maxHealth}`,
      );

      // Update UI
      this.totalResourcesMined += 1;
      this.resourcesUI.setText(`Resources Farmed: ${this.totalResourcesMined}`);

      // Update visual
      this.tileMapRenderer.updateTileVisual(tile.x, tile.y);

      // Update last farmed tile
      this.lastFarmedTile = { x: tile.x, y: tile.y };
      this.farmCooldown = this.FARM_COOLDOWN_TIME;
    }
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  update() {
    if (this.state !== "playing" || !this.player) return;

    // Auto farm current tile
    this.autoFarmCurrentTile();

    // Decrease farm cooldown
    this.farmCooldown -= this.game.loop.delta;

    // Update tile regeneration and get regenerated tiles
    const regeneratedTiles = TileMapService.updateTileRegeneration(
      this.tileMap,
    );

    // Update visual for regenerated tiles
    regeneratedTiles.forEach((tile) => {
      this.tileMapRenderer.updateTileVisual(tile.x, tile.y);
    });

    // Update visible tiles based on camera position (viewport culling)
    this.tileMapRenderer.updateVisibleTiles(this.cameras.main);

    // Update player coordinates display
    const gridX = Math.floor(this.player.x / 60);
    const gridY = Math.floor(this.player.y / 60);
    const relativeX = gridX - 200; // Center is at grid (200, 200)
    const relativeY = gridY - 200;
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
  }
}
