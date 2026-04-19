import * as Phaser from "phaser";
import { Logger } from "../utils/logger";

export class ChatBox {
  private scene: Phaser.Scene;
  private messages: string[] = [];
  private displayText!: Phaser.GameObjects.Text;
  private inputField!: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    this.scene = scene;
    this.create(x, y, width, height);
  }

  private create(x: number, y: number, width: number, height: number) {
    // Chat background
    this.scene.add.rectangle(
      x + width / 2,
      y + height / 2,
      width,
      height,
      0x000000,
      0.7,
    );

    // Messages display
    this.displayText = this.scene.add.text(x + 10, y + 10, "", {
      fontSize: "12px",
      color: "#ffffff",
      wordWrap: { width: width - 20 },
    });

    // Input field (placeholder)
    this.inputField = this.scene.add.text(
      x + 10,
      y + height - 30,
      "Type to chat...",
      {
        fontSize: "12px",
        color: "#888888",
        align: "left",
      },
    );

    Logger.info("ChatBox created");
  }

  addMessage(playerName: string, message: string) {
    const formattedMessage = `${playerName}: ${message}`;
    this.messages.push(formattedMessage);

    // Keep only last 10 messages
    if (this.messages.length > 10) {
      this.messages.shift();
    }

    this.updateDisplay();
  }

  private updateDisplay() {
    this.displayText.setText(this.messages.join("\n"));
  }

  updateInputField(text: string) {
    this.inputField.setText(text || "Type to chat...");
  }
}
