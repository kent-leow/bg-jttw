import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlayerPortraitChip } from "./PlayerPortraitChip";

describe("PlayerPortraitChip", () => {
  it("reflects the selected state", () => {
    render(<PlayerPortraitChip displayName="Sun Wukong" selected />);
    expect(screen.getByRole("button", { name: "Sun Wukong" })).toHaveAttribute("aria-pressed", "true");
  });

  it("reflects the leader state", () => {
    render(<PlayerPortraitChip displayName="Tang Sanzang" isLeader />);
    expect(screen.getByRole("button", { name: "Tang Sanzang" })).toHaveAttribute("data-leader", "true");
  });

  it("reflects the disabled state", () => {
    render(<PlayerPortraitChip displayName="Zhu Bajie" disabled />);
    expect(screen.getByRole("button", { name: "Zhu Bajie" })).toBeDisabled();
  });

  it("defaults to unselected, non-leader, enabled", () => {
    render(<PlayerPortraitChip displayName="Sha Wujing" />);
    const chip = screen.getByRole("button", { name: "Sha Wujing" });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    expect(chip).toHaveAttribute("data-leader", "false");
    expect(chip).toBeEnabled();
  });
});
