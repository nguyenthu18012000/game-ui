import type * as Phaser from "phaser";

export interface TextInputOptions {
  label: string;
  x: number;
  y: number;
  placeholder: string;
  width?: number;
  height?: number;
  labelFontSize?: string;
  inputFontSize?: string;
  password?: boolean;
  onFocus?: (input: TextInput) => void;
}

export class TextInput {
  readonly container: Phaser.GameObjects.Container;

  private readonly inputText: Phaser.GameObjects.Text;
  private readonly messageText: Phaser.GameObjects.Text;
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly placeholder: string;
  private readonly password: boolean;
  private hasError = false;
  private value = "";

  constructor(scene: Phaser.Scene, options: TextInputOptions) {
    this.placeholder = options.placeholder;
    this.password = options.password ?? false;

    const width = options.width ?? 300;
    const height = options.height ?? 40;
    const labelFontSize = options.labelFontSize ?? "12px";
    const inputFontSize = options.inputFontSize ?? "14px";

    this.container = scene.add.container(options.x, options.y);

    this.background = scene.add.rectangle(0, 0, width, height, 0x2d2d2d);
    this.background.setStrokeStyle(2, 0x06a77d);
    this.background.setInteractive();

    const labelText = scene.add.text(-width / 2 + 10, -height / 2, options.label, {
      fontSize: labelFontSize,
      fontFamily: "Arial",
      color: "#888888",
    });

    this.inputText = scene.add.text(-width / 2 + 20, -height / 2 + 12, this.placeholder, {
      fontSize: inputFontSize,
      fontFamily: "Arial",
      color: "#888888",
    });

    this.messageText = scene.add.text(-width / 2 + 10, height / 2 + 4, "", {
      fontSize: "11px",
      fontFamily: "Arial",
      color: "#e74c3c",
    });

    this.container.add([this.background, labelText, this.inputText, this.messageText]);

    this.background.on("pointerdown", () => {
      this.focus();
      options.onFocus?.(this);
    });
  }

  getValue() {
    return this.value;
  }

  focus() {
    this.background.setStrokeStyle(2, this.hasError ? 0xe74c3c : 0x06a77d);
    this.inputText.setColor("#ffffff");
  }

  blur() {
    this.inputText.setColor(this.value ? "#ffffff" : "#888888");
  }

  handleKey(key: string) {
    if (key === "Backspace") {
      this.setValue(this.value.slice(0, -1));
      this.clearMessage();
      return;
    }

    if (key.length === 1) {
      this.setValue(this.value + key);
      this.clearMessage();
    }
  }

  setError(message: string) {
    this.hasError = true;
    this.messageText.setText(message);
    this.messageText.setColor("#e74c3c");
    this.background.setStrokeStyle(2, 0xe74c3c);
  }

  setInfo(message: string) {
    this.hasError = false;
    this.messageText.setText(message);
    this.messageText.setColor("#888888");
    this.background.setStrokeStyle(2, 0x06a77d);
  }

  clearMessage() {
    this.hasError = false;
    this.messageText.setText("");
    this.background.setStrokeStyle(2, 0x06a77d);
  }

  private setValue(value: string) {
    this.value = value;
    this.updateDisplay();
  }

  private updateDisplay() {
    if (!this.value) {
      this.inputText.setText(this.placeholder);
      this.inputText.setColor("#888888");
      return;
    }

    const displayText = this.password ? "*".repeat(this.value.length) : this.value;
    this.inputText.setText(displayText);
    this.inputText.setColor("#ffffff");
  }
}
