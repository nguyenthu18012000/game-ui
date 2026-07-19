import type * as Phaser from "phaser";
import { Player } from "../entities/Player";
import { EquipmentController } from "../equipment/EquipmentController";
import { PlayerInputController } from "../input/PlayerInputController";
import { NetworkPlayerController } from "../network/NetworkPlayerController";
import type { CharacterDetail } from "../services/CharacterService";
import { CameraController } from "../world/CameraController";
import { SPAWN_X, SPAWN_Y } from "../world/WorldConfig";
import { WorldMap } from "../world/WorldMap";

export class GameSession {
  private player: Player | null = null;
  private playerInput: PlayerInputController | null = null;
  private networkController: NetworkPlayerController | null = null;
  private equipmentController: EquipmentController | null = null;
  private coordinatesUI: Phaser.GameObjects.Text | null = null;
  private destroyed = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly character: CharacterDetail,
  ) {}

  create() {
    new WorldMap(this.scene).create();

    const player = new Player(this.scene, SPAWN_X, SPAWN_Y, this.character.id, this.character.name);
    this.player = player;
    new CameraController(this.scene).follow(player);

    this.createHud();

    this.playerInput = new PlayerInputController(this.scene, player);
    this.networkController = new NetworkPlayerController(this.scene, player, this.character);
    this.networkController.connect();
    this.equipmentController = new EquipmentController(this.scene, player);
  }

  update() {
    if (this.destroyed || !this.player || !this.playerInput || !this.networkController) return;

    this.updatePosition();
    const animation = this.playerInput.update();
    this.networkController.sync(animation);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    this.networkController?.destroy();
    this.equipmentController?.destroy();
    this.player = null;
    this.playerInput = null;
    this.networkController = null;
    this.equipmentController = null;
    this.coordinatesUI = null;
  }

  private createHud() {
    const nameText = this.scene.add.text(10, 10, this.character.name, {
      fontSize: "14px",
      color: "#06a77d",
    });
    nameText.setScrollFactor(0);

    const instructionText = this.scene.add.text(10, 28, "WASD / Arrow keys to move", {
      fontSize: "11px",
      color: "#aaaaaa",
    });
    instructionText.setScrollFactor(0);

    this.coordinatesUI = this.scene.add.text(10, 46, "Position: (0, 0)", {
      fontSize: "13px",
      color: "#00ffff",
      fontStyle: "bold",
    });
    this.coordinatesUI.setScrollFactor(0);
  }

  private updatePosition() {
    if (!this.player) return;

    const relativeX = Math.round(this.player.x - SPAWN_X);
    const relativeY = Math.round(this.player.y - SPAWN_Y);
    this.coordinatesUI?.setText(`Position: (${relativeX}, ${relativeY})`);
  }
}
