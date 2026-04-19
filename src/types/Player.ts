export interface PlayerData {
  id: string;
  name: string;
  x: number;
  y: number;
  level: number;
  hp: number;
  maxHp: number;
  equipment: EquipmentSlot;
  animation?: string;
}

export interface EquipmentSlot {
  head?: string;
  body?: string;
  legs?: string;
  weapon?: string;
}

export interface Equipment {
  id: string;
  name: string;
  spriteKey: string;
  animationPrefix: string;
}
