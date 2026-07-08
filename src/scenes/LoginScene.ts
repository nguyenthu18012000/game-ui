import * as Phaser from "phaser";
import { Logger } from "../utils/logger";
import { AuthService } from "../services/AuthService";
import { TextInput } from "../ui/TextInput";

export class LoginScene extends Phaser.Scene {
  private usernameInput!: TextInput;
  private passwordInput!: TextInput;
  private errorText!: Phaser.GameObjects.Text;
  private isLoading = false;
  private focusedInput: TextInput | null = null;

  constructor() {
    super({ key: "LoginScene" });
  }

  create() {
    Logger.info("LoginScene created");

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a1a);

    this.add
      .text(width / 2, 60, "LOGIN", {
        fontSize: "36px",
        fontFamily: "Arial",
        color: "#06a77d",
        align: "center",
      })
      .setOrigin(0.5);

    this.usernameInput = new TextInput(this, {
      label: "Username",
      x: width / 2,
      y: 150,
      placeholder: "your username",
      onFocus: (input) => this.setFocusedInput(input),
    });
    this.setFocusedInput(this.usernameInput);

    this.passwordInput = new TextInput(this, {
      label: "Password",
      x: width / 2,
      y: 250,
      placeholder: "********",
      password: true,
      onFocus: (input) => this.setFocusedInput(input),
    });

    this.errorText = this.add
      .text(width / 2, 320, "", {
        fontSize: "14px",
        fontFamily: "Arial",
        color: "#e74c3c",
        align: "center",
        wordWrap: { width: 300 },
      })
      .setOrigin(0.5);

    const loginBtn = this.add
      .rectangle(width / 2, 380, 200, 50, 0x06a77d)
      .setInteractive();

    this.add
      .text(width / 2, 380, "LOGIN", {
        fontSize: "16px",
        fontFamily: "Arial",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    loginBtn.on("pointerdown", () => this.handleLogin());

    const registerText = this.add
      .text(width / 2, 450, "Don't have account? REGISTER", {
        fontSize: "14px",
        fontFamily: "Arial",
        color: "#06a77d",
        align: "center",
      })
      .setOrigin(0.5);

    registerText.setInteractive();
    registerText.on("pointerdown", () => {
      Logger.info("Going to RegisterScene");
      this.scene.start("RegisterScene");
    });

    this.setupKeyboard();
  }

  private setupKeyboard() {
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      const key = event.key;

      if (key === "Enter") {
        this.handleLogin();
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

  private async handleLogin() {
    if (this.isLoading) return;

    this.clearFieldMessages();
    this.errorText.setText("");

    const username = this.usernameInput.getValue().trim();
    const password = this.passwordInput.getValue().trim();
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
    }

    if (firstInvalidInput) {
      this.setFocusedInput(firstInvalidInput);
      return;
    }

    this.isLoading = true;
    this.errorText.setText("Đang đăng nhập...");

    try {
      const result = await AuthService.login(username, password);

      if (result.success) {
        Logger.info("Login successful:", result.data);
        this.errorText.setText("");
        this.scene.start("GameScene");
      } else {
        this.showError(result.error || "Đăng nhập thất bại");
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
  }
}
