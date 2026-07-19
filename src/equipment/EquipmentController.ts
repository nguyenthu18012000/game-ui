import type * as Phaser from "phaser";
import type { Player } from "../entities/Player";
import { EquipmentHUD, type HotbarSlot } from "../ui/EquipmentHUD";

const HOTBAR_KEYS = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN"] as const;

export class EquipmentController {
  private readonly equipmentHUD: EquipmentHUD;
  private readonly hotbarHandlers: Array<{ eventName: string; handler: () => void }> = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
  ) {
    this.equipmentHUD = new EquipmentHUD(scene);
    this.equipmentHUD.onEquip = (item) => this.player.equip(item);
    this.equipmentHUD.onUnequip = (slot) => this.player.unequip(slot);
    this.bindHotbarKeys();
  }

  destroy() {
    this.hotbarHandlers.forEach(({ eventName, handler }) => {
      this.scene.input.keyboard?.off(eventName, handler);
    });
    this.hotbarHandlers.length = 0;
    this.equipmentHUD.destroy();
  }

  private bindHotbarKeys() {
    HOTBAR_KEYS.forEach((keyName, index) => {
      const eventName = `keydown-${keyName}`;
      const handler = () => this.equipmentHUD.setActiveHotbar(index as HotbarSlot);
      this.scene.input.keyboard?.on(eventName, handler);
      this.hotbarHandlers.push({ eventName, handler });
    });
  }
}
