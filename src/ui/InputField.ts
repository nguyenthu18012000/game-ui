import * as Phaser from "phaser";

export interface ValidatorRule {
  validate: (value: string) => boolean;
  message: string;
}

export interface InputFieldConfig {
  label?: string;
  placeholder?: string;
  width?: number;
  height?: number;
  isPassword?: boolean;
  validators?: ValidatorRule[];
}

const COLORS = {
  bg: 0x2d2d2d,
  borderIdle: 0x444444,
  borderFocus: 0x06a77d,
  borderError: 0xe74c3c,
  text: "#ffffff",
  placeholder: "#888888",
  label: "#888888",
  error: "#e74c3c",
};

export class InputField {
  readonly container: Phaser.GameObjects.Container;

  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly inputText: Phaser.GameObjects.Text;
  private readonly errorText: Phaser.GameObjects.Text;

  private _value = "";
  private _focused = false;
  private _onFocusRequest?: () => void;

  private readonly cfg: Required<InputFieldConfig>;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: InputFieldConfig = {},
  ) {
    this.cfg = {
      label: config.label ?? "",
      placeholder: config.placeholder ?? "",
      width: config.width ?? 300,
      height: config.height ?? 40,
      isPassword: config.isPassword ?? false,
      validators: config.validators ?? [],
    };

    const { width: w, height: h } = this.cfg;

    this.container = scene.add.container(x, y);

    this.bg = scene.add.rectangle(0, 0, w, h, COLORS.bg);
    this.bg.setStrokeStyle(2, COLORS.borderIdle);

    const objects: Phaser.GameObjects.GameObject[] = [this.bg];

    if (this.cfg.label) {
      const labelText = scene.add
        .text(-w / 2, -h / 2 - 4, this.cfg.label, {
          fontSize: "12px",
          fontFamily: "Arial",
          color: COLORS.label,
        })
        .setOrigin(0, 1);
      objects.push(labelText);
    }

    this.inputText = scene.add
      .text(-w / 2 + 10, 0, this.cfg.placeholder, {
        fontSize: "14px",
        fontFamily: "Arial",
        color: COLORS.placeholder,
      })
      .setOrigin(0, 0.5);
    objects.push(this.inputText);

    this.errorText = scene.add
      .text(0, h / 2 + 4, "", {
        fontSize: "11px",
        fontFamily: "Arial",
        color: COLORS.error,
        align: "center",
        wordWrap: { width: w - 20 },
      })
      .setOrigin(0.5, 0);
    objects.push(this.errorText);

    this.container.add(objects);

    this.bg.setInteractive();
    this.bg.on("pointerdown", () => this._onFocusRequest?.());
    this.bg.on("pointerover", () => {
      if (!this._focused) this.bg.setStrokeStyle(2, 0x06a77d40 as any);
    });
    this.bg.on("pointerout", () => {
      if (!this._focused) {
        this.bg.setStrokeStyle(
          2,
          this.errorText.text ? COLORS.borderError : COLORS.borderIdle,
        );
      }
    });
  }

  get value(): string {
    return this._value;
  }

  get focused(): boolean {
    return this._focused;
  }

  /** @internal used by Form to wire up click-to-focus */
  setOnFocusRequest(cb: () => void): void {
    this._onFocusRequest = cb;
  }

  focus(): void {
    this._focused = true;
    this.bg.setStrokeStyle(2, COLORS.borderFocus);
  }

  blur(): void {
    this._focused = false;
    this.bg.setStrokeStyle(
      2,
      this.errorText.text ? COLORS.borderError : COLORS.borderIdle,
    );
  }

  appendChar(char: string): void {
    this._value += char;
    this._updateDisplay();
    this.clearError();
  }

  deleteChar(): void {
    if (this._value.length === 0) return;
    this._value = this._value.slice(0, -1);
    this._updateDisplay();
    this.clearError();
  }

  /** Runs all validators. Returns true if valid, false and shows inline error otherwise. */
  validate(): boolean {
    for (const rule of this.cfg.validators) {
      if (!rule.validate(this._value)) {
        this.setError(rule.message);
        return false;
      }
    }
    this.clearError();
    return true;
  }

  setError(msg: string): void {
    this.errorText.setText(msg);
    this.bg.setStrokeStyle(2, COLORS.borderError);
  }

  clearError(): void {
    this.errorText.setText("");
    this.bg.setStrokeStyle(
      2,
      this._focused ? COLORS.borderFocus : COLORS.borderIdle,
    );
  }

  private _updateDisplay(): void {
    if (this._value === "") {
      this.inputText.setText(this.cfg.placeholder);
      this.inputText.setColor(COLORS.placeholder);
    } else {
      const display = this.cfg.isPassword
        ? "•".repeat(this._value.length)
        : this._value;
      this.inputText.setText(display);
      this.inputText.setColor(COLORS.text);
    }
  }
}
