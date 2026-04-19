import { io, Socket } from "socket.io-client";
import { SOCKET_SERVER_URL } from "../constants/GameConfig";
import { SOCKET_EVENTS } from "../constants/SocketEvents";
import { Logger } from "../utils/logger";

export class SocketManager {
  private socket: Socket | null = null;
  private connected = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      this.socket = io(SOCKET_SERVER_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      this.setupListeners();
      Logger.info("Socket initialized");
    } catch (error) {
      Logger.error("Failed to initialize socket", error);
    }
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      this.connected = true;
      Logger.info("Socket connected");
    });

    this.socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      this.connected = false;
      Logger.warn("Socket disconnected");
    });

    this.socket.on(SOCKET_EVENTS.ERROR, (error: any) => {
      Logger.error("Socket error", error);
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  emit(event: string, data: any) {
    if (!this.socket) {
      Logger.warn("Socket not initialized");
      return;
    }
    this.socket.emit(event, data);
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      Logger.warn("Socket not initialized");
      return;
    }
    this.socket.on(event, callback);
  }

  once(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      Logger.warn("Socket not initialized");
      return;
    }
    this.socket.once(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (!this.socket) {
      Logger.warn("Socket not initialized");
      return;
    }
    this.socket.off(event, callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      Logger.info("Socket disconnected");
    }
  }
}
