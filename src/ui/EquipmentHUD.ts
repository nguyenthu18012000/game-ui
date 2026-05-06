import * as Phaser from "phaser";
import { type EquipmentItem, EQUIPMENT_ITEMS } from "../types/Equipment";
import { PLAYER_ASSET_KEYS } from "../entities/Player";
import { AssetLoader } from "../services/AssetLoader";

// â”€â”€â”€ Slot definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type EquipSlot = "weapon" | "head" | "body" | "legs" | "accessory";
export type HotbarSlot = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface SlotConfig {
  key: EquipSlot;
  label: string;
}

const EQUIP_SLOTS: SlotConfig[] = [
  { key: "weapon",    label: "VK"   },
  { key: "head",      label: "Đầu"  },
  { key: "body",      label: "Áo"   },
  { key: "legs",      label: "Quần" },
  { key: "accessory", label: "Phụ kiện"  },
];

const HOTBAR_COUNT = 7;
const SLOT_SIZE    = 46;
const SLOT_GAP     = 6;
const BORDER_COL   = 0x5c3a1e;
const BG_COL       = 0x2b1a0e;
const HOVER_COL    = 0x7a5230;
const PANEL_BG     = 0x3d2710;
const PANEL_ALPHA  = 0.92;

// EquipmentHUD
export class EquipmentHUD {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;

  // Left equip panel
  private equipPanel!: Phaser.GameObjects.Container;
  private equipSlotGraphics: Map<EquipSlot, Phaser.GameObjects.Graphics> = new Map();
  private equipSlotLabels:   Map<EquipSlot, Phaser.GameObjects.Text>     = new Map();
  private equipSlotImages:   Map<EquipSlot, Phaser.GameObjects.Image>    = new Map();
  private equippedItems:     Map<EquipSlot, EquipmentItem>               = new Map();

  // Hotbar (also serves as inventory)
  private hotbarContainer!: Phaser.GameObjects.Container;
  private hotbarGraphics: Phaser.GameObjects.Graphics[] = [];
  private hotbarImages:   Phaser.GameObjects.Image[]    = [];
  private hotbarLabels:   Phaser.GameObjects.Text[]     = [];
  private activeHotbar = 0;

  // Inventory bag
  private inventoryItems: EquipmentItem[] = [...EQUIPMENT_ITEMS];

  // Callbacks
  onEquip?: (item: EquipmentItem) => void;
  onUnequip?: (slot: "body" | "legs") => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.build();
  }

  // Build
  private build() {
    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(100);

    this.buildEquipPanel();
    this.buildHotbar();
  }

  // Equip panel (left side)
  private buildEquipPanel() {
    const panelW = SLOT_SIZE + 24;
    const panelH = EQUIP_SLOTS.length * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP + 32;
    const panelX = 10;
    const panelY = 80;

    this.equipPanel = this.scene.add.container(panelX, panelY);

    const bg = this.scene.add.graphics();
    bg.fillStyle(PANEL_BG, PANEL_ALPHA);
    bg.fillRoundedRect(0, 0, panelW, panelH, 8);
    bg.lineStyle(2, BORDER_COL, 1);
    bg.strokeRoundedRect(0, 0, panelW, panelH, 8);
    this.equipPanel.add(bg);

    this.equipPanel.add(
      this.scene.add
        .text(panelW / 2, 10, "TRANG BỊ", {
          fontSize: "9px",
          fontFamily: "Arial",
          color: "#c8a96e",
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0),
    );

    // Equip slots
    EQUIP_SLOTS.forEach((cfg, i) => {
      this.addEquipSlot(cfg, 12, 30 + i * (SLOT_SIZE + SLOT_GAP));
    });

    this.equipPanel.setScrollFactor(0);
    this.equipPanel.setDepth(100);
    this.container.add(this.equipPanel);
  }

  private addEquipSlot(cfg: SlotConfig, x: number, y: number) {
    const g = this.scene.add.graphics();
    this.drawSlot(g, 0, 0, SLOT_SIZE, false);
    g.setPosition(x, y);

    const label = this.scene.add
      .text(x + SLOT_SIZE / 2, y + SLOT_SIZE / 2, cfg.label, {
        fontSize: "10px",
        fontFamily: "Arial",
        color: "#666655",
      })
      .setOrigin(0.5);

    // Image hidden until equipped (use a loaded texture as placeholder)
    const img = this.scene.add
      .image(x + SLOT_SIZE / 2, y + SLOT_SIZE / 2, PLAYER_ASSET_KEYS.HEAD)
      .setDisplaySize(SLOT_SIZE - 10, SLOT_SIZE - 10)
      .setVisible(false);

    const hit = this.scene.add
      .rectangle(x, y, SLOT_SIZE, SLOT_SIZE, 0x000000, 0)
      .setOrigin(0)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    hit.on("pointerover", () => this.drawSlot(g, 0, 0, SLOT_SIZE, true));
    hit.on("pointerout",  () => this.drawSlot(g, 0, 0, SLOT_SIZE, this.equippedItems.has(cfg.key)));
    hit.on("pointerdown", () => {
      if (this.equippedItems.has(cfg.key)) this.handleUnequip(cfg.key);
    });

    this.equipPanel.add([g, label, img, hit]);
    this.equipSlotGraphics.set(cfg.key, g);
    this.equipSlotLabels.set(cfg.key, label);
    this.equipSlotImages.set(cfg.key, img);
  }

  // Inventory panel
  private refreshHotbar() {
    this.hotbarImages.forEach((img, i) => {
      const item = this.inventoryItems[i] ?? null;
      if (item) {
        img.setTexture(item.iconKey).setDisplaySize(SLOT_SIZE - 10, SLOT_SIZE - 10).setVisible(true);
      } else {
        img.setVisible(false);
      }
    });
  }

  private buildHotbar() {
    const { width, height } = this.scene.cameras.main;
    const totalW = HOTBAR_COUNT * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP + 20;
    const barX   = Math.round((width - totalW) / 2);
    const barY   = height - SLOT_SIZE - 14;

    this.hotbarContainer = this.scene.add.container(barX, barY);

    const barBg = this.scene.add.graphics();
    barBg.fillStyle(PANEL_BG, PANEL_ALPHA);
    barBg.fillRoundedRect(0, 0, totalW, SLOT_SIZE + 10, 8);
    barBg.lineStyle(2, BORDER_COL, 1);
    barBg.strokeRoundedRect(0, 0, totalW, SLOT_SIZE + 10, 8);
    this.hotbarContainer.add(barBg);

    for (let i = 0; i < HOTBAR_COUNT; i++) {
      this.addHotbarSlot(i, 10 + i * (SLOT_SIZE + SLOT_GAP), 5);
    }

    this.hotbarContainer.setScrollFactor(0);
    this.hotbarContainer.setDepth(100);
    this.container.add(this.hotbarContainer);

    this.refreshHotbar();
  }

  private addHotbarSlot(index: number, x: number, y: number) {
    const g = this.scene.add.graphics();
    this.drawSlot(g, x, y, SLOT_SIZE, index === this.activeHotbar);
    this.hotbarContainer.add(g);
    this.hotbarGraphics.push(g);

    const img = this.scene.add
      .image(x + SLOT_SIZE / 2, y + SLOT_SIZE / 2, PLAYER_ASSET_KEYS.HEAD)
      .setDisplaySize(SLOT_SIZE - 10, SLOT_SIZE - 10)
      .setScrollFactor(0)
      .setVisible(false);
    this.hotbarContainer.add(img);
    this.hotbarImages.push(img);

    const numLabel = this.scene.add
      .text(x + 4, y + 3, String(index + 1), {
        fontSize: '9px',
        fontFamily: 'Arial',
        color: '#7a6040',
      })
      .setOrigin(0, 0);
    this.hotbarContainer.add(numLabel);
    this.hotbarLabels.push(numLabel);

    const hit = this.scene.add
      .rectangle(x, y, SLOT_SIZE, SLOT_SIZE, 0x000000, 0)
      .setOrigin(0)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    hit.on('pointerover', () => this.drawSlot(g, x, y, SLOT_SIZE, true));
    hit.on('pointerout',  () => this.drawSlot(g, x, y, SLOT_SIZE, index === this.activeHotbar));
    hit.on('pointerdown', () => {
      this.setActiveHotbar(index as HotbarSlot);
      const item = this.inventoryItems[index];
      if (item) void this.handleEquip(item);
    });

    this.hotbarContainer.add(hit);
  }

  // Equip logic

  private async handleEquip(item: EquipmentItem) {
    await AssetLoader.ensureLoaded(this.scene, item);
    const slot = item.slot;

    // Return old equipped item to inventory if slot was occupied
    const oldItem = this.equippedItems.get(slot);
    if (oldItem) {
      this.inventoryItems.push(oldItem);
    }

    // Remove new item from inventory bag
    this.inventoryItems = this.inventoryItems.filter(i => i.id !== item.id);

    this.equippedItems.set(slot, item);

    const g   = this.equipSlotGraphics.get(slot);
    const lbl = this.equipSlotLabels.get(slot);
    const img = this.equipSlotImages.get(slot);
    if (g)   this.drawSlot(g, 0, 0, SLOT_SIZE, true);
    if (lbl) lbl.setVisible(false);
    if (img) img.setTexture(item.iconKey).setVisible(true);

    this.refreshHotbar();
    this.onEquip?.(item);
  }

  private handleUnequip(slot: EquipSlot) {
    const item = this.equippedItems.get(slot);
    if (!item) return;

    this.equippedItems.delete(slot);

    const cfg = EQUIP_SLOTS.find(s => s.key === slot)!;
    const g   = this.equipSlotGraphics.get(slot);
    const lbl = this.equipSlotLabels.get(slot);
    const img = this.equipSlotImages.get(slot);
    if (g)   this.drawSlot(g, 0, 0, SLOT_SIZE, false);
    if (lbl) lbl.setText(cfg.label).setColor("#666655").setVisible(true);
    if (img) img.setVisible(false);

    // Return item to inventory bag
    this.inventoryItems.push(item);

    this.refreshHotbar();
    if (slot === "body" || slot === "legs") this.onUnequip?.(slot);
  }

  // Helpers

  private drawSlot(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    size: number,
    highlighted: boolean,
  ) {
    g.clear();
    g.fillStyle(highlighted ? HOVER_COL : BG_COL, 1);
    g.fillRoundedRect(x, y, size, size, 5);
    g.lineStyle(2, highlighted ? 0xc8a96e : BORDER_COL, 1);
    g.strokeRoundedRect(x, y, size, size, 5);
    g.lineStyle(1, 0xffffff, 0.07);
    g.strokeRoundedRect(x + 1, y + 1, size - 2, size - 2, 4);
  }

  // Public API

  // toggleInventory() {
  //   this.inventoryVisible = !this.inventoryVisible;
  //   this.inventoryPanel.setVisible(this.inventoryVisible);
  // }

  setActiveHotbar(index: HotbarSlot) {
    const prev = this.activeHotbar;
    this.activeHotbar = index;
    this.drawSlot(this.hotbarGraphics[prev],  10 + prev  * (SLOT_SIZE + SLOT_GAP), 5, SLOT_SIZE, false);
    this.drawSlot(this.hotbarGraphics[index], 10 + index * (SLOT_SIZE + SLOT_GAP), 5, SLOT_SIZE, true);
  }

  destroy() {
    this.container.destroy(true);
  }
}

