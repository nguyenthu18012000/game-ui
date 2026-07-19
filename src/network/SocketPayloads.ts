export interface RemoteMovePayload {
  playerId?: string;
  id?: string;
  name?: string;
  x: number;
  y: number;
  animation?: string;
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
    (payload.name === undefined || typeof payload.name === "string") &&
    (payload.animation === undefined || typeof payload.animation === "string")
  );
};
