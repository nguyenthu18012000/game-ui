import { SOCKET_EVENTS } from "../constants/SocketEvents";
import { WEBSOCKET_SERVER_URL } from "../constants/GameConfig";
import { Logger } from "../utils/logger";

type SocketCallback = (...args: any[]) => void;

interface SocketMessage<T = any> {
  event?: string;
  payload?: T;
}

export class SocketManager {
  private socket: WebSocket | null = null;
  private connected = false;
  private listeners = new Map<string, Set<SocketCallback>>();
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
      this.dispatch(SOCKET_EVENTS.CONNECT);
      this.flushPendingMessages();
    };

    this.socket.onclose = () => {
      this.connected = false;
      Logger.warn("WebSocket disconnected");
      this.dispatch(SOCKET_EVENTS.DISCONNECT);
    };

    this.socket.onerror = (error) => {
      Logger.error("WebSocket error", error);
      this.dispatch(SOCKET_EVENTS.ERROR, error);
    };

    this.socket.onmessage = (message) => {
      this.handleMessage(message.data);
    };
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data) as SocketMessage;

      if (message.event && "payload" in message) {
        this.dispatch(message.event, message.payload);
        return;
      }

      if (this.isMovePayload(message)) {
        this.dispatch(SOCKET_EVENTS.PLAYER_MOVE, message);
        return;
      }

      this.dispatch(SOCKET_EVENTS.MESSAGE, message);
    } catch (error) {
      Logger.error("Failed to parse WebSocket message", error);
    }
  }

  private isMovePayload(message: SocketMessage) {
    return (
      typeof message === "object" &&
      message !== null &&
      ("playerId" in message || "id" in message) &&
      "x" in message &&
      "y" in message
    );
  }

  private dispatch(event: string, ...args: any[]) {
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

  emit(event: string, data: any) {
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

  on(event: string, callback: SocketCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)?.add(callback);
  }

  once(event: string, callback: SocketCallback) {
    const onceCallback: SocketCallback = (...args) => {
      this.off(event, onceCallback);
      callback(...args);
    };

    this.on(event, onceCallback);
  }

  off(event: string, callback?: SocketCallback) {
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
