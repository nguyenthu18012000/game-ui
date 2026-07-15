export interface EquipmentItem {
  id: string;
  name: string;
  slot: "body" | "legs";
  iconKey: string; // Phaser texture key for inventory icon
  spriteKey: string; // Phaser texture key for idle sprite
  animPrefix: string; // Prefix for walk animation frames: animPrefix + "1" ... + "5"
  assetFolder: string; // Folder name under src/assets/equipment/ (e.g. "equipment1")
}

export const EQUIPMENT_ASSET_KEYS = {
  EQ1_BODY_ICON: "eq1-body-icon",
  EQ1_LEG_ICON: "eq1-leg-icon",
  EQ1_BODY_SPRITE: "eq1-body-sprite",
  EQ1_LEG_SPRITE: "eq1-leg-sprite",
  EQ1_BODY_ANIM_PREFIX: "eq1-body-f",
  EQ1_LEG_ANIM_PREFIX: "eq1-leg-f",
  EQ2_BODY_ICON: "eq2-body-icon",
  EQ2_LEG_ICON: "eq2-leg-icon",
  EQ2_BODY_SPRITE: "eq2-body-sprite",
  EQ2_LEG_SPRITE: "eq2-leg-sprite",
  EQ2_BODY_ANIM_PREFIX: "eq2-body-f",
  EQ2_LEG_ANIM_PREFIX: "eq2-leg-f",
};

export const EQUIPMENT_ITEMS: EquipmentItem[] = [
  {
    id: "eq1-body",
    name: "Giáp I",
    slot: "body",
    iconKey: EQUIPMENT_ASSET_KEYS.EQ1_BODY_ICON,
    spriteKey: EQUIPMENT_ASSET_KEYS.EQ1_BODY_SPRITE,
    animPrefix: EQUIPMENT_ASSET_KEYS.EQ1_BODY_ANIM_PREFIX,
    assetFolder: "equipment1",
  },
  {
    id: "eq1-legs",
    name: "Quần I",
    slot: "legs",
    iconKey: EQUIPMENT_ASSET_KEYS.EQ1_LEG_ICON,
    spriteKey: EQUIPMENT_ASSET_KEYS.EQ1_LEG_SPRITE,
    animPrefix: EQUIPMENT_ASSET_KEYS.EQ1_LEG_ANIM_PREFIX,
    assetFolder: "equipment1",
  },
  {
    id: "eq2-body",
    name: "Giáp II",
    slot: "body",
    iconKey: EQUIPMENT_ASSET_KEYS.EQ2_BODY_ICON,
    spriteKey: EQUIPMENT_ASSET_KEYS.EQ2_BODY_SPRITE,
    animPrefix: EQUIPMENT_ASSET_KEYS.EQ2_BODY_ANIM_PREFIX,
    assetFolder: "equipment2",
  },
  {
    id: "eq2-legs",
    name: "Quần II",
    slot: "legs",
    iconKey: EQUIPMENT_ASSET_KEYS.EQ2_LEG_ICON,
    spriteKey: EQUIPMENT_ASSET_KEYS.EQ2_LEG_SPRITE,
    animPrefix: EQUIPMENT_ASSET_KEYS.EQ2_LEG_ANIM_PREFIX,
    assetFolder: "equipment2",
  },
];
