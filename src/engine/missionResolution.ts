import type { Alignment } from "./types";

export type MissionCard = "Success" | "Fail";

export function submitMissionCard(alignment: Alignment, card: MissionCard): MissionCard {
  if (alignment === "Good" && card === "Fail") {
    throw new Error("Good-aligned players may only submit Success.");
  }
  return card;
}

export interface MissionResolution {
  readonly result: "Success" | "Fail";
  readonly failCount: number;
}

export function resolveMission(cards: readonly MissionCard[], failThreshold: number): MissionResolution {
  const failCount = cards.filter((c) => c === "Fail").length;
  return { result: failCount >= failThreshold ? "Fail" : "Success", failCount };
}
