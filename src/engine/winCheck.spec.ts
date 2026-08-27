import { describe, expect, it } from "vitest";
import { checkOverallWin } from "./winCheck";

describe("checkOverallWin", () => {
  it("declares EvilWin at 3 failed missions before 3 successes are possible", () => {
    const check = checkOverallWin(["Fail", "Fail", "Fail"]);
    expect(check.result).toBe("EvilWin");
    expect(check.reason).toBe("3 failed missions");
    expect(check.proceedToAssassination).toBe(false);
  });

  it("routes to assassination (not an immediate GoodWin) at 3 successes", () => {
    const check = checkOverallWin(["Success", "Success", "Success"]);
    expect(check.result).toBeNull();
    expect(check.proceedToAssassination).toBe(true);
  });

  it("continues the round loop when neither condition is met", () => {
    const check = checkOverallWin(["Success", "Fail"]);
    expect(check.result).toBeNull();
    expect(check.proceedToAssassination).toBe(false);
  });
});
