import * as Phaser from "phaser";
import { Logger } from "../utils/logger";

// ─── Asset keys ───────────────────────────────────────────────────────────────

export const PLAYER_ASSET_KEYS = {
  HEAD: "player-head",
  BODY: "player-body",
  LEG: "player-leg",
  BODY_ANIM_PREFIX: "player-body-f",
  LEG_ANIM_PREFIX: "player-leg-f",
};

export const ANIM_FRAME_COUNT = 5;

/** Serialisable animation state – ready for network (WebSocket / server sync) */
export interface PlayerAnimState {
  frame: number;
  isMoving: boolean;
  facingLeft: boolean;
  bodyIdleKey: string; // idle texture key
  legIdleKey: string;
  bodyAnimPrefix: string; // walk animation prefix
  legAnimPrefix: string;
  bodyAssetFolder: string | null; // null = default player assets
  legAssetFolder: string | null;
}

const COLORS = { weapon: 0xc0c0c0, weaponHandle: 0x8b4513, nameText: "#ffffff" };

const HEAD_Y = -17,
  BODY_Y = 1,
  LEG_Y = 14;
const HEAD_W = 26,
  HEAD_H = 22;
const BODY_W = 30,
  BODY_H = 20;
const LEG_W = 30,
  LEG_H = 16;

const ANIM_FPS = 8;
const ANIM_FRAME_MS = 1000 / ANIM_FPS;

export class Player extends Phaser.GameObjects.Container {
  public id: string;
  public playerName: string;
  declare body: Phaser.Physics.Arcade.Body;

  private headSprite!: Phaser.GameObjects.Image;
  private bodySprite!: Phaser.GameObjects.Image;
  private legSprite!: Phaser.GameObjects.Image;
  private weaponGraphic!: Phaser.GameObjects.Graphics;
  private nameLabel!: Phaser.GameObjects.Text;

  private facingLeft = false;
  private isMoving = false;

  private currentFrame = 0;
  private frameTimer = 0;
  private bodyIdleKey = PLAYER_ASSET_KEYS.BODY;
  private legIdleKey = PLAYER_ASSET_KEYS.LEG;
  private bodyAnimPrefix = PLAYER_ASSET_KEYS.BODY_ANIM_PREFIX;
  private legAnimPrefix = PLAYER_ASSET_KEYS.LEG_ANIM_PREFIX;
  private bodyAssetFolder: string | null = null;
  private legAssetFolder: string | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, id: string, name: string) {
    super(scene, x, y);
    this.id = id;
    this.playerName = name;
    this.buildCharacter();
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const physBody = this.body as Phaser.Physics.Arcade.Body;
    physBody.setSize(28, 52);
    physBody.setOffset(-14, -26);
    physBody.setCollideWorldBounds(true);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.tick, this);
    Logger.info(`Player created: ${name} (${id})`);
  }

  private buildCharacter() {
    this.legSprite = this.scene.add.image(0, LEG_Y, this.legIdleKey).setDisplaySize(LEG_W, LEG_H);
    this.bodySprite = this.scene.add
      .image(0, BODY_Y, this.bodyIdleKey)
      .setDisplaySize(BODY_W, BODY_H);
    this.headSprite = this.scene.add
      .image(0, HEAD_Y, PLAYER_ASSET_KEYS.HEAD)
      .setDisplaySize(HEAD_W, HEAD_H);
    this.weaponGraphic = this.scene.add.graphics();
    this.drawWeapon();
    this.nameLabel = this.scene.add
      .text(0, -38, this.playerName, {
        fontSize: "11px",
        color: COLORS.nameText,
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1);
    this.add([
      this.legSprite,
      this.bodySprite,
      this.headSprite,
      this.weaponGraphic,
      this.nameLabel,
    ]);
  }

  private drawWeapon() {
    const g = this.weaponGraphic;
    const dir = this.facingLeft ? -1 : 1;
    const wx = dir * 14;
    g.clear();
    g.fillStyle(COLORS.weaponHandle);
    g.fillRect(wx - 2 * dir, -4, 4, 10);
    g.fillStyle(COLORS.weapon);
    g.fillRect(wx - 6 * dir, -4, 12, 3);
    g.fillStyle(COLORS.weapon);
    g.fillRect(wx - 2 * dir, -20, 4, 16);
    g.fillTriangle(wx - 2 * dir, -20, wx + 2 * dir, -20, wx, -28);
  }

  private tick(_time: number, delta: number) {
    if (!this.isMoving) return;
    this.frameTimer += delta;
    if (this.frameTimer >= ANIM_FRAME_MS) {
      this.frameTimer -= ANIM_FRAME_MS;
      this.currentFrame = (this.currentFrame + 1) % ANIM_FRAME_COUNT;
      this.applyFrame();
    }
  }

  private applyFrame() {
    const f = this.currentFrame + 1;
    this.bodySprite.setTexture(this.bodyAnimPrefix + f).setDisplaySize(BODY_W, BODY_H);
    this.legSprite.setTexture(this.legAnimPrefix + f).setDisplaySize(LEG_W, LEG_H);
  }

  private applyIdle() {
    this.bodySprite.setTexture(this.bodyIdleKey).setDisplaySize(BODY_W, BODY_H);
    this.legSprite.setTexture(this.legIdleKey).setDisplaySize(LEG_W, LEG_H);
  }

  setMoving(moving: boolean) {
    if (this.isMoving === moving) return;
    this.isMoving = moving;
    if (!moving) {
      this.currentFrame = 0;
      this.frameTimer = 0;
      this.applyIdle();
    }
  }

  faceLeft() {
    if (this.facingLeft) return;
    this.facingLeft = true;
    this.headSprite.setFlipX(true);
    this.bodySprite.setFlipX(true);
    this.legSprite.setFlipX(true);
    this.drawWeapon();
  }

  faceRight() {
    if (!this.facingLeft) return;
    this.facingLeft = false;
    this.headSprite.setFlipX(false);
    this.bodySprite.setFlipX(false);
    this.legSprite.setFlipX(false);
    this.drawWeapon();
  }

  equipBody(
    spriteKey: string | null,
    animPrefix: string | null,
    assetFolder: string | null = null,
  ) {
    this.bodyIdleKey = spriteKey ?? PLAYER_ASSET_KEYS.BODY;
    this.bodyAnimPrefix = animPrefix ?? PLAYER_ASSET_KEYS.BODY_ANIM_PREFIX;
    this.bodyAssetFolder = spriteKey ? assetFolder : null;
    if (this.isMoving) this.applyFrame();
    else this.applyIdle();
  }

  equipLegs(
    spriteKey: string | null,
    animPrefix: string | null,
    assetFolder: string | null = null,
  ) {
    this.legIdleKey = spriteKey ?? PLAYER_ASSET_KEYS.LEG;
    this.legAnimPrefix = animPrefix ?? PLAYER_ASSET_KEYS.LEG_ANIM_PREFIX;
    this.legAssetFolder = spriteKey ? assetFolder : null;
    if (this.isMoving) this.applyFrame();
    else this.applyIdle();
  }

  /** Snapshot current animation state for network transmission. */
  getAnimState(): PlayerAnimState {
    return {
      frame: this.currentFrame,
      isMoving: this.isMoving,
      facingLeft: this.facingLeft,
      bodyIdleKey: this.bodyIdleKey,
      legIdleKey: this.legIdleKey,
      bodyAnimPrefix: this.bodyAnimPrefix,
      legAnimPrefix: this.legAnimPrefix,
      bodyAssetFolder: this.bodyAssetFolder,
      legAssetFolder: this.legAssetFolder,
    };
  }

  /**
   * Apply animation state received from the server.
   * Used to update remote players without triggering local movement logic.
   */
  applyAnimState(state: PlayerAnimState) {
    this.isMoving = state.isMoving;
    this.currentFrame = state.frame;
    this.bodyIdleKey = state.bodyIdleKey;
    this.legIdleKey = state.legIdleKey;
    this.bodyAnimPrefix = state.bodyAnimPrefix;
    this.legAnimPrefix = state.legAnimPrefix;
    this.bodyAssetFolder = state.bodyAssetFolder;
    this.legAssetFolder = state.legAssetFolder;
    if (state.isMoving) this.applyFrame();
    else this.applyIdle();
    if (state.facingLeft !== this.facingLeft) {
      this.facingLeft = state.facingLeft;
      const flip = state.facingLeft;
      this.headSprite.setFlipX(flip);
      this.bodySprite.setFlipX(flip);
      this.legSprite.setFlipX(flip);
      this.drawWeapon();
    }
  }

  destroy(fromScene?: boolean): void {
    this.scene?.events?.off(Phaser.Scenes.Events.UPDATE, this.tick, this);
    super.destroy(fromScene);
  }
}
