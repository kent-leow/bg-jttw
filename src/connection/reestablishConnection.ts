export interface ReconnectResult {
  readonly reconnected: boolean;
  readonly currentState?: unknown;
  readonly message?: string;
}

export type HostReachabilityCheck = (
  roomId: string,
  playerId: string,
) => Promise<{ reachable: boolean; currentState?: unknown }>;

/**
 * Attempts to reconnect a stored player id to a room via the host hub. There is no backend
 * fallback: if the host device is unreachable, resuming is impossible (gameplay.md Flow 7).
 */
export async function reestablishConnection(
  roomId: string,
  playerId: string,
  checkHostReachable: HostReachabilityCheck,
): Promise<ReconnectResult> {
  const { reachable, currentState } = await checkHostReachable(roomId, playerId);
  if (!reachable) {
    return {
      reconnected: false,
      message:
        "Host unreachable: your connection was lost when the page reloaded, and this app has no backend to reconnect you automatically.",
    };
  }
  return { reconnected: true, currentState };
}
