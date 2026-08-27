import { describe, expect, it } from "vitest";
import { resolveMission, submitMissionCard } from "./missionResolution";

describe("submitMissionCard", () => {
  it("rejects a Good-aligned player submitting Fail at the point of submission", () => {
    expect(() => submitMissionCard("Good", "Fail")).toThrow();
  });

  it("allows a Good-aligned player to submit Success", () => {
    expect(submitMissionCard("Good", "Success")).toBe("Success");
  });

  it("allows an Evil-aligned player to submit either card", () => {
    expect(submitMissionCard("Evil", "Success")).toBe("Success");
    expect(submitMissionCard("Evil", "Fail")).toBe("Fail");
  });
});

describe("resolveMission", () => {
  it("fails exactly when the fail count meets the threshold", () => {
    expect(resolveMission(["Success", "Fail"], 1).result).toBe("Fail");
    expect(resolveMission(["Success", "Success"], 1).result).toBe("Success");
    expect(resolveMission(["Fail", "Success", "Success"], 2).result).toBe("Success");
    expect(resolveMission(["Fail", "Fail", "Success"], 2).result).toBe("Fail");
  });

  it("never exposes individual submitted cards in the returned result", () => {
    const result = resolveMission(["Fail", "Success"], 1);
    expect(Object.keys(result).sort()).toEqual(["failCount", "result"]);
  });
});
