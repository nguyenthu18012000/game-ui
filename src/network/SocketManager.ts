import {
  SOCKET_CONNECTION_EVENTS,
  SOCKET_GAME_EVENTS,
  normalizeSocketGameEvent,
  type SocketGameEvent,
  type SocketEvent,
} from "../constants/SocketEvents";
import { WEBSOCKET_SERVER_URL } from "../constants/GameConfig";
import { Logger } from "../utils/logger";

type SocketCallback = (...args: unknown[]) => void;

interface SocketMessage<T = unknown> {
  event?: string;
  payload?: T;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export class SocketManager {
  private socket: WebSocket | null = null;
  private connected = false;
  private listeners = new Map<SocketEvent, Set<SocketCallback>>();
  private pendingMessages: string[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      this.socket = new WebSocket(WEBSOCKET_SERVER_URL);
      this.setupListeners();
      Logger.info("WebSocket initialized");
    } catch (error) {
      Logger.error("Failed to initialize WebSocket", error);
    }
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.onopen = () => {
      this.connected = true;
      Logger.info("WebSocket connected");
      this.dispatch(SOCKET_CONNECTION_EVENTS.CONNECT);
      this.flushPendingMessages();
    };

    this.socket.onclose = () => {
      this.connected = false;
      Logger.warn("WebSocket disconnected");
      this.dispatch(SOCKET_CONNECTION_EVENTS.DISCONNECT);
    };

    this.socket.onerror = (error) => {
      Logger.error("WebSocket error", error);
      this.dispatch(SOCKET_CONNECTION_EVENTS.ERROR, error);
    };

    this.socket.onmessage = (message) => {
      if (typeof message.data === "string") {
        this.handleMessage(message.data);
      } else {
        Logger.warn("Unsupported WebSocket message type");
      }
    };
  }

  private handleMessage(data: string) {
    try {
      const parsed: unknown = JSON.parse(data);
      if (!isRecord(parsed)) {
        Logger.warn("Ignored invalid WebSocket message");
        return;
      }
      const message: SocketMessage = parsed;

      if (message.event && "payload" in message) {
        const socketGameEvent = normalizeSocketGameEvent(message.event);
        if (socketGameEvent) {
          this.dispatch(socketGameEvent, message.payload);
          return;
        }
      }

      if (this.isMovePayload(message)) {
        this.dispatch(SOCKET_GAME_EVENTS.PLAYER_MOVE, message);
        return;
      }

      this.dispatch(SOCKET_CONNECTION_EVENTS.MESSAGE, message);
    } catch (error) {
      Logger.error("Failed to parse WebSocket message", error);
    }
  }

  private isMovePayload(message: unknown): message is Record<string, unknown> {
    return (
      isRecord(message) &&
      ("playerId" in message || "id" in message) &&
      typeof message.x === "number" &&
      Number.isFinite(message.x) &&
      typeof message.y === "number" &&
      Number.isFinite(message.y)
    );
  }

  private dispatch(event: SocketEvent, ...args: unknown[]) {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;

    callbacks.forEach((callback) => callback(...args));
  }

  private flushPendingMessages() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    this.pendingMessages.forEach((message) => this.socket?.send(message));
    this.pendingMessages = [];
  }

  isConnected(): boolean {
    return this.connected;
  }

  emit(event: SocketGameEvent, data: unknown) {
    const message = JSON.stringify({ event, payload: data });

    if (!this.socket) {
      Logger.warn("WebSocket not initialized");
      return;
    }

    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
      return;
    }

    this.pendingMessages.push(message);
  }

  on(event: SocketEvent, callback: SocketCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)?.add(callback);
  }

  once(event: SocketEvent, callback: SocketCallback) {
    const onceCallback: SocketCallback = (...args) => {
      this.off(event, onceCallback);
      callback(...args);
    };

    this.on(event, onceCallback);
  }

  off(event: SocketEvent, callback?: SocketCallback) {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }

    this.listeners.get(event)?.delete(callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      Logger.info("WebSocket disconnected");
    }

    this.connected = false;
    this.pendingMessages = [];
  }
}
