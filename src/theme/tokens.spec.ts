import { describe, expect, it } from "vitest";
import { colorTokens, typographyTokens } from "./tokens";

describe("theme tokens", () => {
  it("resolves every color token referenced in the component library to a defined value", () => {
    const expectedColorTokens = ["inkBlack", "ricePaperWhite", "vermillion", "imperialGold", "jade", "indigo"];
    for (const key of expectedColorTokens) {
      expect(colorTokens).toHaveProperty(key);
      expect(typeof colorTokens[key as keyof typeof colorTokens]).toBe("string");
      expect(colorTokens[key as keyof typeof colorTokens].length).toBeGreaterThan(0);
    }
  });

  it("resolves every typography token referenced in the component library to a defined value", () => {
    const expectedTypographyTokens = ["chineseDisplay", "chineseBody", "latinDisplay", "latinBody"];
    for (const key of expectedTypographyTokens) {
      expect(typographyTokens).toHaveProperty(key);
      expect(typeof typographyTokens[key as keyof typeof typographyTokens]).toBe("string");
      expect(typographyTokens[key as keyof typeof typographyTokens].length).toBeGreaterThan(0);
    }
  });
});
