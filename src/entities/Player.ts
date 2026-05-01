import * as Phaser from "phaser";
import { Logger } from "../utils/logger";

const COLORS = {
  skin: 0xf5cba7,
  hair: 0x4a2c0a,
  shirt: 0x2e86de,
  pants: 0x1a1a2e,
  shoes: 0x3d2b1f,
  weapon: 0xc0c0c0,
  weaponHandle: 0x8b4513,
  nameText: "#ffffff",
};

export class Player extends Phaser.GameObjects.Container {
  public id: string;
  public playerName: string;
  declare body: Phaser.Physics.Arcade.Body;

  private headGraphic!: Phaser.GameObjects.Graphics;
  private torsoGraphic!: Phaser.GameObjects.Graphics;
  private legsGraphic!: Phaser.GameObjects.Graphics;
  private weaponGraphic!: Phaser.GameObjects.Graphics;
  private nameLabel!: Phaser.GameObjects.Text;

  private facingLeft = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    id: string,
    name: string,
  ) {
    super(scene, x, y);
    this.id = id;
    this.playerName = name;

    this.buildCharacter();

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(28, 52);
    body.setOffset(-14, -26);
    body.setCollideWorldBounds(true);

    Logger.info(`Player created: ${name} (${id})`);
  }

  private buildCharacter() {
    // --- Legs ---
    this.legsGraphic = this.scene.add.graphics();
    this.drawLegs();

    // --- Torso ---
    this.torsoGraphic = this.scene.add.graphics();
    this.drawTorso();

    // --- Head ---
    this.headGraphic = this.scene.add.graphics();
    this.drawHead();

    // --- Weapon (held in right hand) ---
    this.weaponGraphic = this.scene.add.graphics();
    this.drawWeapon();

    // --- Name label ---
    this.nameLabel = this.scene.add.text(0, -38, this.playerName, {
      fontSize: "11px",
      color: COLORS.nameText,
      stroke: "#000000",
      strokeThickness: 3,
    });
    this.nameLabel.setOrigin(0.5, 1);

    this.add([
      this.legsGraphic,
      this.torsoGraphic,
      this.headGraphic,
      this.weaponGraphic,
      this.nameLabel,
    ]);
  }

  private drawHead() {
    const g = this.headGraphic;
    g.clear();
    // Hair
    g.fillStyle(COLORS.hair);
    g.fillEllipse(0, -22, 22, 10);
    // Face
    g.fillStyle(COLORS.skin);
    g.fillCircle(0, -16, 10);
    // Eyes
    g.fillStyle(0x000000);
    g.fillCircle(this.facingLeft ? -3 : 3, -17, 2);
    // Mouth
    g.fillStyle(0xcc6666);
    g.fillRect(this.facingLeft ? -5 : 1, -13, 4, 2);
  }

  private drawTorso() {
    const g = this.torsoGraphic;
    g.clear();
    // Shirt
    g.fillStyle(COLORS.shirt);
    g.fillRect(-10, -8, 20, 18);
    // Arms
    g.fillStyle(COLORS.skin);
    const armX = this.facingLeft ? 8 : -8;
    g.fillRect(armX, -7, 6, 14); // back arm
    g.fillStyle(COLORS.shirt);
    g.fillRect(-armX - 6, -7, 6, 14); // front arm
  }

  private drawLegs() {
    const g = this.legsGraphic;
    g.clear();
    // Pants
    g.fillStyle(COLORS.pants);
    g.fillRect(-9, 10, 8, 16);
    g.fillRect(1, 10, 8, 16);
    // Shoes
    g.fillStyle(COLORS.shoes);
    g.fillRect(-10, 24, 10, 5);
    g.fillRect(0, 24, 10, 5);
  }

  private drawWeapon() {
    const g = this.weaponGraphic;
    g.clear();
    const dir = this.facingLeft ? -1 : 1;
    const wx = dir * 14;
    // Handle
    g.fillStyle(COLORS.weaponHandle);
    g.fillRect(wx - 2 * dir, -4, 4, 10);
    // Guard
    g.fillStyle(COLORS.weapon);
    g.fillRect(wx - 6 * dir, -4, 12, 3);
    // Blade
    g.fillStyle(COLORS.weapon);
    g.fillRect(wx - 2 * dir, -20, 4, 16);
    // Tip
    g.fillTriangle(wx - 2 * dir, -20, wx + 2 * dir, -20, wx, -28);
  }

  private redrawAll() {
    this.drawHead();
    this.drawTorso();
    this.drawWeapon();
  }

  faceLeft() {
    if (!this.facingLeft) {
      this.facingLeft = true;
      this.redrawAll();
    }
  }

  faceRight() {
    if (this.facingLeft) {
      this.facingLeft = false;
      this.redrawAll();
    }
  }

  changeEquipment(slot: string, _spriteKey: string) {
    Logger.info(`${this.playerName}: Equipment changed - ${slot}`);
  }

  destroy(fromScene?: boolean): void {
    super.destroy(fromScene);
  }
}
