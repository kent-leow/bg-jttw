import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getLocale, setLocale, t, translate } from "./index";

describe("translate (pure lookup)", () => {
  it("returns the correct string for the requested locale", () => {
    const tables = { en: { greeting: "Hello" }, zh: { greeting: "你好" } };
    expect(translate("greeting", "en", tables)).toBe("Hello");
    expect(translate("greeting", "zh", tables)).toBe("你好");
  });

  it("falls back explicitly (with a warning) when a key is missing in one locale", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const tables = { en: { greeting: "Hello" }, zh: {} };

    expect(translate("greeting", "zh", tables)).toBe("Hello");
    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/missing translation/i));

    warnSpy.mockRestore();
  });

  it("warns and returns the raw key when missing everywhere", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const tables = { en: {}, zh: {} };

    expect(translate("nowhere.key", "en", tables)).toBe("nowhere.key");
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});

describe("t (active-locale lookup with interpolation)", () => {
  beforeEach(() => {
    setLocale("en");
  });
  afterEach(() => {
    setLocale("en");
  });

  it("returns the correct string for the active locale", () => {
    expect(t("common.startGame")).toBe("Start Game");
    setLocale("zh");
    expect(getLocale()).toBe("zh");
    expect(t("common.startGame")).toBe("开始游戏");
  });

  it("interpolates params into the translated string", () => {
    expect(t("hostSetup.seatCounter", { joined: 2, total: 6 })).toBe("2/6 joined");
  });
});
