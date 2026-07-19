import type * as Phaser from "phaser";
import { SOCKET_EVENTS } from "../constants/SocketEvents";
import { Player } from "../entities/Player";
import type { CharacterDetail } from "../services/CharacterService";
import type { PlayerData } from "../types/Player";
import { Logger } from "../utils/logger";
import { isRemoteMovePayload } from "./SocketPayloads";
import { SocketManager } from "./SocketManager";

const MOVEMENT_SYNC_INTERVAL = 50;
const POSITION_EPSILON = 1;

export class NetworkPlayerController {
  private socketManager: SocketManager | null = null;
  private readonly remotePlayers = new Map<string, Player>();
  private lastMovementSync = 0;
  private lastSyncedPosition = { x: Number.NaN, y: Number.NaN };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly localPlayer: Player,
    private readonly character: CharacterDetail,
  ) {}

  connect() {
    this.destroy();
    this.socketManager = new SocketManager();
    this.socketManager.on(SOCKET_EVENTS.CONNECT, () => this.sync("idle-right", true));
    this.socketManager.on(SOCKET_EVENTS.PLAYER_MOVE, this.handleRemoteMove);
  }

  sync(animation: string, force = false) {
    if (!this.socketManager) return;

    const now = this.scene.time.now;
    const dx = Math.abs(this.localPlayer.x - this.lastSyncedPosition.x);
    const dy = Math.abs(this.localPlayer.y - this.lastSyncedPosition.y);
    const changed = dx > POSITION_EPSILON || dy > POSITION_EPSILON;

    if (!force && (!changed || now - this.lastMovementSync < MOVEMENT_SYNC_INTERVAL)) return;

    this.lastMovementSync = now;
    this.lastSyncedPosition = { x: this.localPlayer.x, y: this.localPlayer.y };
    this.socketManager.emit(SOCKET_EVENTS.PLAYER_MOVE, {
      playerId: this.character.id,
      id: this.character.id,
      name: this.character.name,
      x: this.localPlayer.x,
      y: this.localPlayer.y,
      animation,
    });
  }

  destroy() {
    if (this.socketManager) {
      this.socketManager.off(SOCKET_EVENTS.PLAYER_MOVE, this.handleRemoteMove);
      this.socketManager.disconnect();
      this.socketManager = null;
    }

    this.remotePlayers.forEach((player) => player.destroy());
    this.remotePlayers.clear();
  }

  private handleRemoteMove = (...args: unknown[]) => {
    const data = args[0];
    if (!isRemoteMovePayload(data)) {
      Logger.warn("Ignored invalid remote player movement", data);
      return;
    }

    const playerId = data.playerId ?? data.id;
    if (!playerId || playerId === this.character.id) return;

    const playerData: PlayerData = {
      id: playerId,
      name: data.name ?? `Player ${playerId.slice(0, 4)}`,
      x: data.x,
      y: data.y,
      level: 1,
      hp: 100,
      maxHp: 100,
      equipment: {},
    };
    if (data.animation !== undefined) playerData.animation = data.animation;

    this.upsertRemotePlayer(playerData);
  };

  private upsertRemotePlayer(data: PlayerData) {
    let remotePlayer = this.remotePlayers.get(data.id);
    if (!remotePlayer) {
      remotePlayer = new Player(this.scene, data.x, data.y, data.id, data.name);
      this.remotePlayers.set(data.id, remotePlayer);
    }

    remotePlayer.setPosition(data.x, data.y);
    (remotePlayer.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    remotePlayer.setMoving(data.animation?.startsWith("walk") ?? false);
    if (data.animation?.includes("left")) remotePlayer.faceLeft();
    else if (data.animation?.includes("right")) remotePlayer.faceRight();
  }
}
