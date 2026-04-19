import type { PlayerData } from "./Player";

export interface SocketEvents {
  // Connection
  "player-join": (data: PlayerData) => void;
  "player-leave": (playerId: string) => void;
  "players-list": (players: PlayerData[]) => void;

  // Player movement & action
  "player-move": (data: {
    playerId: string;
    x: number;
    y: number;
    animation: string;
  }) => void;
  "player-equip-changed": (data: {
    playerId: string;
    equipment: string;
    slot: string;
  }) => void;
  "player-attack": (data: { playerId: string; targetId: string }) => void;

  // Chat & Notifications
  "chat-message": (data: {
    playerId: string;
    playerName: string;
    message: string;
  }) => void;
  notification: (data: {
    title: string;
    message: string;
    type: string;
  }) => void;

  // Game events
  "game-state-update": (state: any) => void;
}
