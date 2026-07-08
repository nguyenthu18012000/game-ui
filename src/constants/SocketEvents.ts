// Connection Events
export const SOCKET_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  ERROR: "error",
  MESSAGE: "message",

  // Player Events
  PLAYER_JOIN: "player-join",
  PLAYER_LEAVE: "player-leave",
  PLAYERS_LIST: "players-list",
  PLAYER_UPDATE: "player-update",

  // Movement Events
  PLAYER_MOVE: "MOVE",
  PLAYER_POSITION: "player-position",

  // Equipment Events
  PLAYER_EQUIP_CHANGED: "player-equip-changed",
  EQUIPMENT_UPDATE: "equipment-update",

  // Combat Events
  PLAYER_ATTACK: "player-attack",
  PLAYER_DAMAGE: "player-damage",
  PLAYER_DEATH: "player-death",

  // Chat Events
  CHAT_MESSAGE: "chat-message",
  CHAT_RECEIVE: "chat-receive",

  // Notification Events
  NOTIFICATION_SEND: "notification-send",
  NOTIFICATION_RECEIVE: "notification-receive",

  // Game State
  GAME_STATE_UPDATE: "game-state-update",
  GAME_STARTED: "game-started",
  GAME_ENDED: "game-ended",
};
