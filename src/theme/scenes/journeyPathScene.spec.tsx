import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JourneyPathScene } from "./journeyPathScene";

describe("JourneyPathScene", () => {
  it("advances exactly one waypoint per resolved mission result", () => {
    const { rerender } = render(<JourneyPathScene resolvedMissionCount={0} />);
    expect(screen.getByTestId("journey-path-scene")).toHaveAttribute("data-waypoint", "0");

    rerender(<JourneyPathScene resolvedMissionCount={1} />);
    expect(screen.getByTestId("journey-path-scene")).toHaveAttribute("data-waypoint", "1");

    rerender(<JourneyPathScene resolvedMissionCount={2} />);
    expect(screen.getByTestId("journey-path-scene")).toHaveAttribute("data-waypoint", "2");
  });

  it("clamps out-of-range mission counts to the valid waypoint range", () => {
    const { rerender } = render(<JourneyPathScene resolvedMissionCount={-2} />);
    expect(screen.getByTestId("journey-path-scene")).toHaveAttribute("data-waypoint", "0");

    rerender(<JourneyPathScene resolvedMissionCount={99} />);
    expect(screen.getByTestId("journey-path-scene")).toHaveAttribute("data-waypoint", "5");
  });
});

