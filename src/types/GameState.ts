import type { PlayerData } from "./Player";

export interface GameState {
  isConnected: boolean;
  currentPlayer?: PlayerData;
  players: Map<string, PlayerData>;
  gameStarted: boolean;
  mapName: string;
}

export interface Message {
  id: string;
  playerId: string;
  playerName: string;
  content: string;
  timestamp: number;
  type: "chat" | "system";
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  timestamp: number;
  duration?: number;
}
