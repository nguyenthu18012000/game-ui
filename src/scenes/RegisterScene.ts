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

export class RegisterScene extends Phaser.Scene {
  private usernameInput!: InputField;
  private passwordInput!: InputField;
  private confirmPasswordInput!: InputField;
  private errorText!: Phaser.GameObjects.Text;
  private isLoading = false;

  constructor() {
    super({ key: "RegisterScene" });
  }

  create() {
    Logger.info("RegisterScene created");

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a1a);

    // Title
    this.add
      .text(width / 2, 40, "CREATE ACCOUNT", {
        fontSize: "32px",
        fontFamily: "Arial",
        color: "#06a77d",
        align: "center",
      })
      .setOrigin(0.5);

    // Username Input
    this.usernameInput = this.createInputField(
      "Username",
      width / 2,
      100,
      "Your name here",
    );

    // Password Input
    this.passwordInput = this.createInputField(
      "Password",
      width / 2,
      160,
      "••••••••",
    );

    // Confirm Password Input
    this.confirmPasswordInput = this.createInputField(
      "Confirm Password",
      width / 2,
      220,
      "••••••••",
    );

    // Error/Info message
    this.errorText = this.add
      .text(width / 2, 290, "", {
        fontSize: "12px",
        fontFamily: "Arial",
        color: "#e74c3c",
        align: "center",
        wordWrap: { width: 300 },
      })
      .setOrigin(0.5);

    // Register Button
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

    // Back to Login
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
  }

  private createInputField(
    label: string,
    x: number,
    y: number,
    placeholder: string,
  ): InputField {
    const container = this.add.container(x, y);

    // Background
    const bg = this.add.rectangle(0, 0, 300, 35, 0x2d2d2d);
    bg.setStrokeStyle(2, 0x06a77d);

    // Label
    const labelText = this.add.text(-140, -17, label, {
      fontSize: "11px",
      fontFamily: "Arial",
      color: "#888888",
    });

    // Input text
    const inputText = this.add.text(-130, -5, placeholder, {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#888888",
    });

    container.add([bg, labelText, inputText]);

    // Make background interactive
    bg.setInteractive();
    bg.on("pointerdown", () => {
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

  private async handleRegister() {
    if (this.isLoading) return;

    const username = this.usernameInput.value.trim();
    const password = this.passwordInput.value.trim();
    const confirmPassword = this.confirmPasswordInput.value.trim();

    // Validate
    if (!username || !password || !confirmPassword) {
      this.showError("Tất cả các trường không được để trống");
      return;
    }

    if (username.length < 3) {
      this.showError("Username phải ít nhất 3 ký tự");
      return;
    }

    if (password.length < 6) {
      this.showError("Password phải ít nhất 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      this.showError("Password không khớp");
      return;
    }

    this.isLoading = true;
    this.errorText.setText("Đang tạo account...");
    this.errorText.setColor("#06a77d");

    try {
      const result = await AuthService.register(username, password);

      if (result.success) {
        Logger.info("Registration successful:", result.data);

        // Hiển thị thông báo
        this.errorText.setText("Tài khoản tạo thành công! Chuyển sang game...");
        this.errorText.setColor("#2ecc71");

        // Chuyển sang LobbyScene sau 2 giây
        this.time.delayedCall(2000, () => {
          this.scene.start("LobbyScene");
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

    // Tự động xóa thông báo lỗi sau 5 giây
    this.time.delayedCall(5000, () => {
      this.errorText.setText("");
    });
  }
}
