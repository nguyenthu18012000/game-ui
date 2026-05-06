import * as Phaser from "phaser";
import { Logger } from "../utils/logger";
import {
  CharacterService,
  type CharacterDetail,
} from "../services/CharacterService";
import { Player } from "../entities/Player";

interface InputField {
  container: Phaser.GameObjects.Container;
  input: Phaser.GameObjects.Text;
  value: string;
  placeholder: string;
}

export class LobbyScene extends Phaser.Scene {
  private character: CharacterDetail | null = null;
  private characterNameInput!: InputField;
  private createPopup!: Phaser.GameObjects.Container;
  private popupErrorText!: Phaser.GameObjects.Text;
  private isCreating = false;

  constructor() {
    super({ key: "LobbyScene" });
  }

  create() {
    Logger.info("LobbyScene created");

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a1a);

    this.add
      .text(width / 2, 50, "CHARACTER", {
        fontSize: "36px",
        fontFamily: "Arial",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    // Back Button
    const backBtn = this.add
      .rectangle(50, 20, 80, 30, 0x4a4a4a)
      .setInteractive();
    this.add
      .text(50, 20, "BACK", {
        fontSize: "12px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    backBtn.on("pointerdown", () => {
      Logger.info("LobbyScene: Going back");
      this.scene.start("MenuScene");
    });

    this.loadCharacter();
  }

  private async loadCharacter() {
    const character = await CharacterService.getDetail();
    if (character) {
      this.renderCharacter(character);
    } else {
      this.showCreatePopup();
    }
  }

  private renderCharacter(character: CharacterDetail) {
    this.character = character;
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const cx = width / 2;
    const cy = height / 2;

    // Character preview using Player sprite
    const preview = new Player(this, cx, cy, "preview", character.name);
    (preview.body as Phaser.Physics.Arcade.Body).setEnable(false);

    // Start Game Button
    const startBtn = this.add
      .rectangle(cx, height - 50, 150, 40, 0x06a77d)
      .setInteractive();
    this.add
      .text(cx, height - 50, "START GAME", {
        fontSize: "16px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    startBtn.on("pointerdown", () => {
      Logger.info("LobbyScene: Starting game");
      this.scene.start("GameScene", { character: this.character });
    });
  }

  private showCreatePopup() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const cx = width / 2;
    const cy = height / 2;

    // Dim overlay
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

    // Name input field
    this.characterNameInput = this.createInputField(0, -20);

    // Error text
    this.popupErrorText = this.add
      .text(0, 32, "", {
        fontSize: "13px",
        fontFamily: "Arial",
        color: "#e74c3c",
        align: "center",
        wordWrap: { width: panelW - 40 },
      })
      .setOrigin(0.5);

    // Create button
    const createBtn = this.add.rectangle(0, 76, 160, 40, 0x06a77d);
    createBtn.setInteractive();
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

    this.setupPopupKeyboard();
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

  private setupPopupKeyboard() {
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (!this.createPopup?.visible) return;
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

      // Fetch detail and render
      const character = await CharacterService.getDetail();
      if (character) {
        this.createPopup.destroy();
        this.renderCharacter(character);
      }
    } catch (err: any) {
      this.popupErrorText.setColor("#e74c3c");
      this.popupErrorText.setText("Lỗi: " + err.message);
    } finally {
      this.isCreating = false;
    }
  }
}
