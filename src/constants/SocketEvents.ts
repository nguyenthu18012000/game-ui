export const SOCKET_CONNECTION_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  ERROR: "error",
  MESSAGE: "message",
} as const;

export const SOCKET_GAME_EVENTS = {
  PLAYER_LEAVE: "PLAYER_LEAVE",
  PLAYER_MOVE: "PLAYER_MOVE",
} as const;

export type SocketConnectionEvent =
  (typeof SOCKET_CONNECTION_EVENTS)[keyof typeof SOCKET_CONNECTION_EVENTS];

export type SocketGameEvent = (typeof SOCKET_GAME_EVENTS)[keyof typeof SOCKET_GAME_EVENTS];

export type SocketEvent = SocketConnectionEvent | SocketGameEvent;

export const normalizeSocketGameEvent = (event: string): SocketGameEvent | null => {
  if (Object.values(SOCKET_GAME_EVENTS).includes(event as SocketGameEvent)) {
    return event as SocketGameEvent;
  }

  return null;
};
