import type { Equipment, EquipmentSlot } from "../types/Player";
import { Logger } from "../utils/logger";

export class EquipmentService {
  private equipment: Map<string, Equipment> = new Map();
  private playerEquipment: EquipmentSlot = {};

  constructor() {
    this.initializeEquipment();
  }

  private initializeEquipment() {
    // Khởi tạo các trang bị mẫu
    const equipmentList: Equipment[] = [
      {
        id: "armor-01",
        name: "Basic Armor",
        spriteKey: "armor-01",
        animationPrefix: "armor-01",
      },
      {
        id: "armor-02",
        name: "Iron Armor",
        spriteKey: "armor-02",
        animationPrefix: "armor-02",
      },
      {
        id: "sword-01",
        name: "Rusty Sword",
        spriteKey: "sword-01",
        animationPrefix: "sword-01",
      },
    ];

    equipmentList.forEach((eq) => {
      this.equipment.set(eq.id, eq);
    });

    Logger.info("Equipment initialized", this.equipment.size);
  }

  getEquipment(id: string): Equipment | undefined {
    return this.equipment.get(id);
  }

  equipItem(slot: keyof EquipmentSlot, equipmentId: string): EquipmentSlot {
    const equipment = this.equipment.get(equipmentId);
    if (!equipment) {
      Logger.warn(`Equipment not found: ${equipmentId}`);
      return this.playerEquipment;
    }

    this.playerEquipment[slot] = equipmentId;
    Logger.info(`Equipped ${slot}:`, equipmentId);
    return this.playerEquipment;
  }

  unequipItem(slot: keyof EquipmentSlot): EquipmentSlot {
    delete this.playerEquipment[slot];
    Logger.info(`Unequipped ${slot}`);
    return this.playerEquipment;
  }

  getPlayerEquipment(): EquipmentSlot {
    return { ...this.playerEquipment };
  }

  getEquippedSprites(): string[] {
    return Object.values(this.playerEquipment)
      .filter(Boolean)
      .map((id) => this.equipment.get(id!)?.spriteKey || "")
      .filter(Boolean);
  }
}
