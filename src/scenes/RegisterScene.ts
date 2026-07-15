import * as Phaser from "phaser";
import { Logger } from "../utils/logger";
import { AuthService } from "../services/AuthService";
import { InputField } from "../ui/InputField";
import { Form } from "../ui/Form";

export class RegisterScene extends Phaser.Scene {
  private form!: Form;
  private usernameField!: InputField;
  private passwordField!: InputField;
  private confirmPasswordField!: InputField;
  private errorText!: Phaser.GameObjects.Text;
  private isLoading = false;

  constructor() {
    super({ key: "RegisterScene" });
  }

  create() {
    Logger.info("RegisterScene created");

    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a1a);

    // Title
    this.add
      .text(width / 2, 50, "CREATE ACCOUNT", {
        fontSize: "32px",
        fontFamily: "Arial",
        color: "#06a77d",
        align: "center",
      })
      .setOrigin(0.5);

    this.usernameField = new InputField(this, width / 2, 140, {
      label: "Username",
      placeholder: "Your name here",
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

    this.passwordField = new InputField(this, width / 2, 240, {
      label: "Password",
      placeholder: "••••••••",
      isPassword: true,
      validators: [
        {
          validate: (v) => v.length > 0,
          message: "Password không được để trống",
        },
        {
          validate: (v) => v.length >= 6,
          message: "Password phải ít nhất 6 ký tự",
        },
      ],
    });

    this.confirmPasswordField = new InputField(this, width / 2, 340, {
      label: "Confirm Password",
      placeholder: "••••••••",
      isPassword: true,
      validators: [
        {
          validate: (v) => v.length > 0,
          message: "Vui lòng xác nhận password",
        },
        {
          validate: (v) => v === this.passwordField.value,
          message: "Password không khớp",
        },
      ],
    });

    // Error/Info message
    this.errorText = this.add
      .text(width / 2, 410, "", {
        fontSize: "12px",
        fontFamily: "Arial",
        color: "#e74c3c",
        align: "center",
        wordWrap: { width: 300 },
      })
      .setOrigin(0.5);

    // Register Button
    const registerBtn = this.add.rectangle(width / 2, 460, 200, 50, 0x06a77d).setInteractive();

    this.add
      .text(width / 2, 460, "REGISTER", {
        fontSize: "16px",
        fontFamily: "Arial",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    registerBtn.on("pointerdown", () => this.form.submit());

    // Back to Login
    const backText = this.add
      .text(width / 2, 530, "Already have account? LOGIN", {
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

    this.form = new Form(this, {
      fields: [
        { name: "username", field: this.usernameField },
        { name: "password", field: this.passwordField },
        { name: "confirmPassword", field: this.confirmPasswordField },
      ],
      onSubmit: () => this.handleRegister(),
    });
  }

  private async handleRegister() {
    if (this.isLoading) return;

    const { username = "", password = "" } = this.form.getValues();

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

        // Chuyển sang GameScene sau 2 giây
        this.time.delayedCall(2000, () => {
          this.scene.start("LobbyScene");
        });
      } else {
        this.showError(result.error || "Tạo account thất bại");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.showError("Lỗi kết nối: " + message);
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
