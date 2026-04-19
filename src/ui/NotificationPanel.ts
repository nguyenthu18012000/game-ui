import * as Phaser from "phaser";
import { Logger } from "../utils/logger";
import { NOTIFICATION_DURATION } from "../constants/GameConstants";

export interface NotificationOptions {
  type: "info" | "warning" | "error" | "success";
  duration?: number;
}

export class NotificationPanel {
  private scene: Phaser.Scene;
  private notifications: Map<string, Phaser.GameObjects.Container> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    Logger.info("NotificationPanel created");
  }

  show(
    title: string,
    message: string,
    options: NotificationOptions = { type: "info" },
  ) {
    const { type = "info", duration = NOTIFICATION_DURATION } = options;

    const width = this.scene.cameras.main.width;
    const notificationCount = this.notifications.size;
    const y = 50 + notificationCount * 80;

    // Background color based on type
    const colors: Record<string, number> = {
      info: 0x3498db,
      warning: 0xf39c12,
      error: 0xe74c3c,
      success: 0x2ecc71,
    };

    const container = this.scene.add.container(width / 2, y);

    // Background
    const bg = this.scene.add.rectangle(0, 0, 400, 70, colors[type]);
    bg.setOrigin(0.5);

    // Title
    const titleText = this.scene.add.text(0, -15, title, {
      fontSize: "14px",
      fontFamily: "Arial",
      color: "#ffffff",
      fontStyle: "bold",
    });
    titleText.setOrigin(0.5);

    // Message
    const messageText = this.scene.add.text(0, 10, message, {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#ffffff",
      wordWrap: { width: 380 },
    });
    messageText.setOrigin(0.5);

    container.add([bg, titleText, messageText]);
    const id = `notification-${Date.now()}`;
    this.notifications.set(id, container);

    // Auto-remove after duration
    this.scene.time.delayedCall(duration, () => {
      this.removeNotification(id);
    });

    Logger.info(`Notification shown: ${title}`);

    return id;
  }

  private removeNotification(id: string) {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.destroy();
      this.notifications.delete(id);
    }
  }

  clear() {
    this.notifications.forEach((notification) => {
      notification.destroy();
    });
    this.notifications.clear();
  }
}
