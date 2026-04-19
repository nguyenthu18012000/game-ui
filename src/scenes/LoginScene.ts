import * as Phaser from "phaser";
import { Logger } from "../utils/logger";
import { AuthService } from "../services/AuthService";

interface InputField {
  container: Phaser.GameObjects.Container;
  input: Phaser.GameObjects.Text;
  label: Phaser.GameObjects.Text;
  value: string;
  placeholder: string;
}

export class LoginScene extends Phaser.Scene {
  private usernameInput!: InputField;
  private passwordInput!: InputField;
  private errorText!: Phaser.GameObjects.Text;
  private isLoading = false;
  private focusedField: "email" | "password" = "email";

  constructor() {
    super({ key: "LoginScene" });
  }

  create() {
    Logger.info("LoginScene created");

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a1a);

    // Title
    this.add
      .text(width / 2, 60, "LOGIN", {
        fontSize: "36px",
        fontFamily: "Arial",
        color: "#06a77d",
        align: "center",
      })
      .setOrigin(0.5);

    // Username Input
    this.usernameInput = this.createInputField(
      "Username",
      width / 2,
      150,
      "your username",
    );

    // Password Input
    this.passwordInput = this.createInputField(
      "Password",
      width / 2,
      250,
      "••••••••",
    );

    // Error message display
    this.errorText = this.add
      .text(width / 2, 320, "", {
        fontSize: "14px",
        fontFamily: "Arial",
        color: "#e74c3c",
        align: "center",
        wordWrap: { width: 300 },
      })
      .setOrigin(0.5);

    // Login Button
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

    // Register Link
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

    // Setup keyboard input
    this.setupKeyboard();
  }

  private createInputField(
    label: string,
    x: number,
    y: number,
    placeholder: string,
  ): InputField {
    const container = this.add.container(x, y);

    // Background
    const bg = this.add.rectangle(0, 0, 300, 40, 0x2d2d2d);
    bg.setStrokeStyle(2, 0x06a77d);

    // Label
    const labelText = this.add.text(-140, -20, label, {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#888888",
    });

    // Input text
    const inputText = this.add.text(-130, -8, placeholder, {
      fontSize: "14px",
      fontFamily: "Arial",
      color: "#888888",
    });

    container.add([bg, labelText, inputText]);

    // Make background interactive
    bg.setInteractive();
    bg.on("pointerdown", () => {
      // Set focus based on label text
      if (labelText.text === "Username") {
        this.focusedField = "email";
      } else {
        this.focusedField = "password";
      }
      inputText.setColor("#ffffff");
    });

    return {
      container,
      input: inputText,
      label: labelText,
      value: "",
      placeholder,
    };
  }

  private setupKeyboard() {
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      const key = event.key;

      // Xóa ký tự
      if (key === "Backspace") {
        if (this.focusedField === "email") {
          this.usernameInput.value = this.usernameInput.value.slice(0, -1);
          this.updateInputDisplay(this.usernameInput);
        } else if (this.focusedField === "password") {
          this.passwordInput.value = this.passwordInput.value.slice(0, -1);
          this.updateInputDisplay(this.passwordInput);
        }
      }

      // Nhập ký tự
      if (key.length === 1) {
        if (this.focusedField === "email") {
          this.usernameInput.value += key;
          this.updateInputDisplay(this.usernameInput);
        } else if (this.focusedField === "password") {
          this.passwordInput.value += key;
          this.updateInputDisplay(this.passwordInput);
        }
      }

      // Enter để login
      if (key === "Enter") {
        this.handleLogin();
      }
    });
  }

  private updateInputDisplay(field: InputField) {
    if (field.value === "") {
      field.input.setText(field.placeholder);
      field.input.setColor("#888888");
    } else {
      // Hiển thị *** cho password
      const displayText =
        field === this.passwordInput
          ? "*".repeat(field.value.length)
          : field.value;
      field.input.setText(displayText);
      field.input.setColor("#ffffff");
    }
  }

  private async handleLogin() {
    if (this.isLoading) return;

    const username = this.usernameInput.value.trim();
    const password = this.passwordInput.value.trim();

    // Validate
    if (!username || !password) {
      this.showError("Username và password không được để trống");
      return;
    }

    if (username.length < 3) {
      this.showError("Username phải ít nhất 3 ký tự");
      return;
    }

    this.isLoading = true;
    this.errorText.setText("Đang đăng nhập...");

    try {
      const result = await AuthService.login(username, password);

      if (result.success) {
        Logger.info("Login successful:", result.data);
        this.errorText.setText("");

        // Chuyển sang LobbyScene
        this.scene.start("LobbyScene");
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

    // Tự động xóa thông báo lỗi sau 5 giây
    this.time.delayedCall(5000, () => {
      this.errorText.setText("");
    });
  }
}
