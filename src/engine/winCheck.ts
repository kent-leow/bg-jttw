export type GameResult = "GoodWin" | "EvilWin" | null;

export interface OverallWinCheck {
  readonly result: GameResult;
  readonly reason?: string;
  readonly proceedToAssassination: boolean;
}

export function checkOverallWin(missionResults: readonly ("Success" | "Fail")[]): OverallWinCheck {
  const failCount = missionResults.filter((r) => r === "Fail").length;
  const successCount = missionResults.filter((r) => r === "Success").length;

  if (failCount === 3) {
    return { result: "EvilWin", reason: "3 failed missions", proceedToAssassination: false };
  }
  if (successCount === 3) {
    return { result: null, proceedToAssassination: true };
  }
  return { result: null, proceedToAssassination: false };
}
