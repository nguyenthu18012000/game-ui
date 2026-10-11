export interface RemoteMovePayload {
  playerId?: string;
  id?: string;
  name?: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  directionX?: number;
  directionY?: number;
  animation?: string;
  sequence?: number;
  serverTime?: number;
}

export const isRemoteMovePayload = (value: unknown): value is RemoteMovePayload => {
  if (typeof value !== "object" || value === null) return false;
  const payload = value as Record<string, unknown>;
  const playerId = payload.playerId ?? payload.id;

  return (
    typeof playerId === "string" &&
    typeof payload.x === "number" &&
    Number.isFinite(payload.x) &&
    typeof payload.y === "number" &&
    Number.isFinite(payload.y) &&
    (payload.vx === undefined || typeof payload.vx === "number") &&
    (payload.vy === undefined || typeof payload.vy === "number") &&
    (payload.directionX === undefined || typeof payload.directionX === "number") &&
    (payload.directionY === undefined || typeof payload.directionY === "number") &&
    (payload.name === undefined || typeof payload.name === "string") &&
    (payload.animation === undefined || typeof payload.animation === "string") &&
    (payload.sequence === undefined || typeof payload.sequence === "number") &&
    (payload.serverTime === undefined || typeof payload.serverTime === "number")
  );
};

export const isPlayerLeavePayload = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;
