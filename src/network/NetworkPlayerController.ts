import * as Phaser from "phaser";
import { SOCKET_CONNECTION_EVENTS, SOCKET_GAME_EVENTS } from "../constants/SocketEvents";
import { Player } from "../entities/Player";
import type { PlayerMovementInput } from "../input/PlayerInputController";
import type { CharacterDetail } from "../services/CharacterService";
import type { PlayerData } from "../types/Player";
import { Logger } from "../utils/logger";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../world/WorldConfig";
import {
  isPlayerLeavePayload,
  isRemoteMovePayload,
  type RemoteMovePayload,
} from "./SocketPayloads";
import { SocketManager } from "./SocketManager";

const MOVEMENT_SYNC_INTERVAL = 50;
const PLAYER_SPEED = 160;
const INPUT_EPSILON = 0.001;
const REMOTE_SMOOTHING = 0.2;
const LOCAL_RECONCILE_SMOOTHING = 0.35;
const LOCAL_TELEPORT_DISTANCE = 96;
const SNAP_DISTANCE = 0.5;

interface RemotePlayerTarget {
  x: number;
  y: number;
  animation?: string;
}

export class NetworkPlayerController {
  private socketManager: SocketManager | null = null;
  private readonly remotePlayers = new Map<string, Player>();
  private readonly remoteTargets = new Map<string, RemotePlayerTarget>();
  private lastMovementSync = 0;
  private lastSentInput: PlayerMovementInput | null = null;
  private sequence = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly localPlayer: Player,
    private readonly character: CharacterDetail,
  ) {}

  connect() {
    this.destroy();
    this.socketManager = new SocketManager();
    this.socketManager.on(SOCKET_CONNECTION_EVENTS.CONNECT, () =>
      this.sync({ directionX: 0, directionY: 0, animation: "idle-right", moving: false }, true),
    );
    this.socketManager.on(SOCKET_GAME_EVENTS.PLAYER_MOVE, this.handleRemoteMove);
    this.socketManager.on(SOCKET_GAME_EVENTS.PLAYER_LEAVE, this.handlePlayerLeave);
  }

  update(input: PlayerMovementInput) {
    this.applyLocalPrediction(input);
    this.sync(input);
    this.updateRemotePlayers();
  }

  sync(input: PlayerMovementInput, force = false) {
    if (!this.socketManager) return;

    const now = this.scene.time.now;
    const changed = this.hasInputChanged(input);

    if (!force && now - this.lastMovementSync < MOVEMENT_SYNC_INTERVAL) return;
    if (!force && !changed && !input.moving) return;

    this.lastMovementSync = now;
    this.lastSentInput = { ...input };
    this.sequence += 1;
    this.socketManager.emit(SOCKET_GAME_EVENTS.PLAYER_MOVE, {
      playerId: this.character.id,
      id: this.character.id,
      name: this.character.name,
      directionX: input.directionX,
      directionY: input.directionY,
      x: this.localPlayer.x,
      y: this.localPlayer.y,
      sequence: this.sequence,
    });
  }

  destroy() {
    if (this.socketManager) {
      this.socketManager.off(SOCKET_GAME_EVENTS.PLAYER_MOVE, this.handleRemoteMove);
      this.socketManager.off(SOCKET_GAME_EVENTS.PLAYER_LEAVE, this.handlePlayerLeave);
      this.socketManager.disconnect();
      this.socketManager = null;
    }

    this.remotePlayers.forEach((player) => player.destroy());
    this.remotePlayers.clear();
    this.remoteTargets.clear();
  }

  private handleRemoteMove = (...args: unknown[]) => {
    const data = args[0];
    if (!isRemoteMovePayload(data)) {
      Logger.warn("Ignored invalid remote player movement", data);
      return;
    }

    const playerId = data.playerId ?? data.id;
    if (!playerId) return;

    if (playerId === this.character.id) {
      this.reconcileLocalPlayer(data);
      return;
    }

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

  private handlePlayerLeave = (...args: unknown[]) => {
    const playerId = args[0];
    if (!isPlayerLeavePayload(playerId)) {
      Logger.warn("Ignored invalid player leave payload", playerId);
      return;
    }

    const remotePlayer = this.remotePlayers.get(playerId);
    if (!remotePlayer) return;

    remotePlayer.destroy();
    this.remotePlayers.delete(playerId);
    this.remoteTargets.delete(playerId);
  };

  private upsertRemotePlayer(data: PlayerData) {
    let remotePlayer = this.remotePlayers.get(data.id);
    if (!remotePlayer) {
      remotePlayer = new Player(this.scene, data.x, data.y, data.id, data.name);
      this.remotePlayers.set(data.id, remotePlayer);
    }

    const target: RemotePlayerTarget = {
      x: data.x,
      y: data.y,
    };
    if (data.animation !== undefined) target.animation = data.animation;

    this.remoteTargets.set(data.id, target);
    this.applyAnimation(remotePlayer, data.animation);
  }

  private applyLocalPrediction(input: PlayerMovementInput) {
    const deltaSeconds = Math.min(this.scene.game.loop.delta, 100) / 1000;
    const x = Phaser.Math.Clamp(
      this.localPlayer.x + input.directionX * PLAYER_SPEED * deltaSeconds,
      0,
      WORLD_WIDTH,
    );
    const y = Phaser.Math.Clamp(
      this.localPlayer.y + input.directionY * PLAYER_SPEED * deltaSeconds,
      0,
      WORLD_HEIGHT,
    );

    this.localPlayer.setPosition(x, y);
    (this.localPlayer.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.applyAnimation(this.localPlayer, input.animation);
  }

  private reconcileLocalPlayer(data: RemoteMovePayload) {
    const dx = data.x - this.localPlayer.x;
    const dy = data.y - this.localPlayer.y;
    const distance = Math.hypot(dx, dy);

    if (distance > LOCAL_TELEPORT_DISTANCE) {
      this.localPlayer.setPosition(data.x, data.y);
    } else if (distance > SNAP_DISTANCE) {
      this.localPlayer.setPosition(
        Phaser.Math.Linear(this.localPlayer.x, data.x, LOCAL_RECONCILE_SMOOTHING),
        Phaser.Math.Linear(this.localPlayer.y, data.y, LOCAL_RECONCILE_SMOOTHING),
      );
    }

    (this.localPlayer.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.applyAnimation(this.localPlayer, data.animation);
  }

  private updateRemotePlayers() {
    this.remotePlayers.forEach((player, playerId) => {
      const target = this.remoteTargets.get(playerId);
      if (!target) return;

      const dx = target.x - player.x;
      const dy = target.y - player.y;
      if (Math.hypot(dx, dy) <= SNAP_DISTANCE) {
        player.setPosition(target.x, target.y);
      } else {
        player.setPosition(
          Phaser.Math.Linear(player.x, target.x, REMOTE_SMOOTHING),
          Phaser.Math.Linear(player.y, target.y, REMOTE_SMOOTHING),
        );
      }

      (player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      this.applyAnimation(player, target.animation);
    });
  }

  private hasInputChanged(input: PlayerMovementInput) {
    if (!this.lastSentInput) return true;

    return (
      Math.abs(input.directionX - this.lastSentInput.directionX) > INPUT_EPSILON ||
      Math.abs(input.directionY - this.lastSentInput.directionY) > INPUT_EPSILON ||
      input.animation !== this.lastSentInput.animation
    );
  }

  private applyAnimation(player: Player, animation?: string) {
    player.setMoving(animation?.startsWith("walk") ?? false);
    if (animation?.includes("left")) player.faceLeft();
    else if (animation?.includes("right")) player.faceRight();
  }
}
