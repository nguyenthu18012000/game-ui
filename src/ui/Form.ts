import * as Phaser from "phaser";
import { InputField } from "./InputField";

export interface FormFieldDef {
  name: string;
  field: InputField;
}

export interface FormConfig {
  fields: FormFieldDef[];
  /** Called when Enter is pressed or submit() is invoked and all fields pass validation. */
  onSubmit: (values: Record<string, string>) => void;
}

export class Form {
  private readonly scene: Phaser.Scene;
  private readonly fields: FormFieldDef[];
  private readonly onSubmit: (values: Record<string, string>) => void;
  private focusedIndex = 0;
  private readonly keyListener: (event: KeyboardEvent) => void;

  constructor(
    scene: Phaser.Scene,
    config: FormConfig,
  ) {
    this.scene = scene;
    this.fields = config.fields;
    this.onSubmit = config.onSubmit;

    this.fields.forEach((f, i) => {
      f.field.setOnFocusRequest(() => this._setFocus(i));
    });

    if (this.fields.length > 0) {
      this._setFocus(0);
    }

    this.keyListener = (e: KeyboardEvent) => this._handleKey(e);
    scene.input.keyboard?.on("keydown", this.keyListener);

    // Auto-cleanup when scene shuts down
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  private _setFocus(index: number): void {
    if (this.fields[this.focusedIndex]?.field.focused) {
      this.fields[this.focusedIndex].field.blur();
    }
    this.focusedIndex = index;
    this.fields[index]?.field.focus();
  }

  private _handleKey(event: KeyboardEvent): void {
    const current = this.fields[this.focusedIndex]?.field;
    if (!current) return;

    switch (event.key) {
      case "Backspace":
        current.deleteChar();
        break;
      case "Tab":
        this._setFocus((this.focusedIndex + 1) % this.fields.length);
        break;
      case "Enter":
        this.submit();
        break;
      default:
        if (event.key.length === 1) {
          current.appendChar(event.key);
        }
    }
  }

  /** Validates all fields. Returns true if all pass. */
  validateAll(): boolean {
    let valid = true;
    for (const { field } of this.fields) {
      if (!field.validate()) valid = false;
    }
    return valid;
  }

  /** Returns current values keyed by field name. */
  getValues(): Record<string, string> {
    return Object.fromEntries(
      this.fields.map(({ name, field }) => [name, field.value]),
    );
  }

  /** Validates all fields, then calls onSubmit if valid. */
  submit(): void {
    if (this.validateAll()) {
      this.onSubmit(this.getValues());
    }
  }

  destroy(): void {
    this.scene.input.keyboard?.off("keydown", this.keyListener);
  }
}
