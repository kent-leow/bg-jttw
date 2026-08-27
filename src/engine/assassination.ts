export interface AssassinationResolution {
  readonly result: "GoodWin" | "EvilWin";
  readonly reason: string;
}

export function resolveAssassination(targetPlayerId: string, merlinPlayerId: string): AssassinationResolution {
  if (targetPlayerId === merlinPlayerId) {
    return { result: "EvilWin", reason: "Assassin correctly identified Merlin" };
  }
  return { result: "GoodWin", reason: "Assassin failed to identify Merlin" };
}
