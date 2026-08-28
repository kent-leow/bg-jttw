export interface LobbyPlayer {
  readonly id: string;
  readonly displayName: string;
}

export interface PlayerListBroadcast {
  readonly kind: "playerList";
  readonly players: readonly LobbyPlayer[];
}

export function isPlayerListBroadcast(payload: unknown): payload is PlayerListBroadcast {
  return (
    typeof payload === "object" &&
    payload !== null &&
    (payload as Partial<PlayerListBroadcast>).kind === "playerList" &&
    Array.isArray((payload as Partial<PlayerListBroadcast>).players)
  );
}
