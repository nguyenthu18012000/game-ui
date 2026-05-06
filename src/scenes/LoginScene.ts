import * as Phaser from "phaser";
import { Logger } from "../utils/logger";
import { AuthService } from "../services/AuthService";
import { InputField } from "../ui/InputField";
import { Form } from "../ui/Form";

export class LoginScene extends Phaser.Scene {
  private form!: Form;
  private usernameField!: InputField;
  private passwordField!: InputField;
  private errorText!: Phaser.GameObjects.Text;
  private isLoading = false;

  constructor() {
    super({ key: "LoginScene" });
  }

  create() {
    Logger.info("LoginScene created");

    const { width, height } = this.cameras.main;

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

    this.usernameField = new InputField(this, width / 2, 170, {
      label: "Username",
      placeholder: "your username",
      validators: [
        {
          validate: (v) => v.trim().length > 0,
          message: "Username không được để trống",
        },
        {
          validate: (v) => v.trim().length >= 3,
          message: "Username phải ít nhất 3 ký tự",
        },
      ],
    });

    this.passwordField = new InputField(this, width / 2, 270, {
      label: "Password",
      placeholder: "••••••••",
      isPassword: true,
      validators: [
        {
          validate: (v) => v.length > 0,
          message: "Password không được để trống",
        },
      ],
    });

    // Error message display
    this.errorText = this.add
      .text(width / 2, 340, "", {
        fontSize: "14px",
        fontFamily: "Arial",
        color: "#e74c3c",
        align: "center",
        wordWrap: { width: 300 },
      })
      .setOrigin(0.5);

    // Login Button
    const loginBtn = this.add
      .rectangle(width / 2, 400, 200, 50, 0x06a77d)
      .setInteractive();

    this.add
      .text(width / 2, 400, "LOGIN", {
        fontSize: "16px",
        fontFamily: "Arial",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    loginBtn.on("pointerdown", () => this.form.submit());

    // Register Link
    const registerText = this.add
      .text(width / 2, 470, "Don't have account? REGISTER", {
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

    this.form = new Form(this, {
      fields: [
        { name: "username", field: this.usernameField },
        { name: "password", field: this.passwordField },
      ],
      onSubmit: () => this.handleLogin(),
    });
  }

  private async handleLogin() {
    if (this.isLoading) return;
    const { username, password } = this.form.getValues();
    this.isLoading = true;
    this.errorText.setText("Đang đăng nhập...");

    try {
      const result = await AuthService.login(username.trim(), password);
      if (result.success) {
        Logger.info("Login successful:", result.data);
        this.errorText.setText("");
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
