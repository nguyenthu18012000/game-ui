import type { GameState, Message, Notification } from "../types/GameState";
import type { PlayerData } from "../types/Player";
import { Logger } from "../utils/logger";

export class GameStateService {
  private state: GameState = {
    isConnected: false,
    players: new Map(),
    gameStarted: false,
    mapName: "Main Map",
  };

  private messages: Message[] = [];
  private notifications: Notification[] = [];

  getState(): GameState {
    return { ...this.state };
  }

  setConnected(connected: boolean) {
    this.state.isConnected = connected;
    Logger.info(`Connection status: ${connected}`);
  }

  setCurrentPlayer(player: PlayerData) {
    this.state.currentPlayer = player;
    Logger.info(`Current player set: ${player.name}`);
  }

  addPlayer(player: PlayerData) {
    this.state.players.set(player.id, player);
    Logger.info(`Player added: ${player.name}`);
  }

  removePlayer(playerId: string) {
    this.state.players.delete(playerId);
    Logger.info(`Player removed: ${playerId}`);
  }

  getPlayers(): PlayerData[] {
    return Array.from(this.state.players.values());
  }

  addMessage(message: Message) {
    this.messages.push(message);
    if (this.messages.length > 100) {
      this.messages.shift();
    }
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  addNotification(notification: Notification) {
    this.notifications.push(notification);
    if (this.notifications.length > 50) {
      this.notifications.shift();
    }
  }

  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  reset() {
    this.state = {
      isConnected: false,
      players: new Map(),
      gameStarted: false,
      mapName: "Main Map",
    };
    this.messages = [];
    this.notifications = [];
    Logger.info("Game state reset");
  }
}
