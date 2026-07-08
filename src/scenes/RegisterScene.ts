import * as Phaser from "phaser";
import { Logger } from "../utils/logger";
import { AuthService } from "../services/AuthService";
import { TextInput } from "../ui/TextInput";

export class RegisterScene extends Phaser.Scene {
  private usernameInput!: TextInput;
  private passwordInput!: TextInput;
  private confirmPasswordInput!: TextInput;
  private errorText!: Phaser.GameObjects.Text;
  private isLoading = false;
  private focusedInput: TextInput | null = null;

  constructor() {
    super({ key: "RegisterScene" });
  }

  create() {
    Logger.info("RegisterScene created");

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a1a);

    this.add
      .text(width / 2, 40, "CREATE ACCOUNT", {
        fontSize: "32px",
        fontFamily: "Arial",
        color: "#06a77d",
        align: "center",
      })
      .setOrigin(0.5);

    this.usernameInput = this.createInput(
      "Username",
      width / 2,
      100,
      "Your name here",
    );
    this.setFocusedInput(this.usernameInput);
    this.passwordInput = this.createInput(
      "Password",
      width / 2,
      160,
      "********",
      true,
    );
    this.confirmPasswordInput = this.createInput(
      "Confirm Password",
      width / 2,
      220,
      "********",
      true,
    );

    this.errorText = this.add
      .text(width / 2, 290, "", {
        fontSize: "12px",
        fontFamily: "Arial",
        color: "#e74c3c",
        align: "center",
        wordWrap: { width: 300 },
      })
      .setOrigin(0.5);

    const registerBtn = this.add
      .rectangle(width / 2, 340, 200, 50, 0x06a77d)
      .setInteractive();

    this.add
      .text(width / 2, 340, "REGISTER", {
        fontSize: "16px",
        fontFamily: "Arial",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    registerBtn.on("pointerdown", () => this.handleRegister());

    const backText = this.add
      .text(width / 2, 410, "Already have account? LOGIN", {
        fontSize: "14px",
        fontFamily: "Arial",
        color: "#06a77d",
        align: "center",
      })
      .setOrigin(0.5);

    backText.setInteractive();
    backText.on("pointerdown", () => {
      Logger.info("Going back to LoginScene");
      this.scene.start("LoginScene");
    });

    this.setupKeyboard();
  }

  private createInput(
    label: string,
    x: number,
    y: number,
    placeholder: string,
    password = false,
  ) {
    return new TextInput(this, {
      label,
      x,
      y,
      placeholder,
      password,
      height: 35,
      labelFontSize: "11px",
      inputFontSize: "12px",
      onFocus: (input) => this.setFocusedInput(input),
    });
  }

  private setupKeyboard() {
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      const key = event.key;

      if (key === "Enter") {
        this.handleRegister();
        return;
      }

      this.focusedInput?.handleKey(key);
    });
  }

  private setFocusedInput(input: TextInput) {
    this.focusedInput?.blur();
    this.focusedInput = input;
    this.focusedInput.focus();
  }

  private async handleRegister() {
    if (this.isLoading) return;

    this.clearFieldMessages();
    this.errorText.setText("");

    const username = this.usernameInput.getValue().trim();
    const password = this.passwordInput.getValue().trim();
    const confirmPassword = this.confirmPasswordInput.getValue().trim();
    let firstInvalidInput: TextInput | null = null;

    if (!username) {
      this.usernameInput.setError("Username không được để trống");
      firstInvalidInput = this.usernameInput;
    } else if (username.length < 3) {
      this.usernameInput.setError("Username phải ít nhất 3 ký tự");
      firstInvalidInput = this.usernameInput;
    }

    if (!password) {
      this.passwordInput.setError("Password không được để trống");
      firstInvalidInput ??= this.passwordInput;
    } else if (password.length < 6) {
      this.passwordInput.setError("Password phải ít nhất 6 ký tự");
      firstInvalidInput ??= this.passwordInput;
    }

    if (!confirmPassword) {
      this.confirmPasswordInput.setError("Confirm password không được để trống");
      firstInvalidInput ??= this.confirmPasswordInput;
    } else if (password && password !== confirmPassword) {
      this.confirmPasswordInput.setError("Password không khớp");
      firstInvalidInput ??= this.confirmPasswordInput;
    }

    if (firstInvalidInput) {
      this.setFocusedInput(firstInvalidInput);
      return;
    }

    this.isLoading = true;
    this.errorText.setText("Đang tạo account...");
    this.errorText.setColor("#06a77d");

    try {
      const result = await AuthService.register(username, password);

      if (result.success) {
        Logger.info("Registration successful:", result.data);
        this.errorText.setText("Tài khoản tạo thành công! Chuyển sang game...");
        this.errorText.setColor("#2ecc71");

        this.time.delayedCall(2000, () => {
          this.scene.start("GameScene");
        });
      } else {
        this.showError(result.error || "Tạo account thất bại");
      }
    } catch (error: any) {
      this.showError("Lỗi kết nối: " + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  private showError(message: string) {
    this.errorText.setText(message);
    this.errorText.setColor("#e74c3c");

    this.time.delayedCall(5000, () => {
      this.errorText.setText("");
    });
  }

  private clearFieldMessages() {
    this.usernameInput.clearMessage();
    this.passwordInput.clearMessage();
    this.confirmPasswordInput.clearMessage();
  }
}
