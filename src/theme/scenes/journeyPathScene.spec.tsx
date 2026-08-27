import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JourneyPathScene } from "./journeyPathScene";

describe("JourneyPathScene", () => {
  it("advances exactly one waypoint per resolved mission result", () => {
    const { rerender } = render(<JourneyPathScene resolvedMissionCount={0} detectWebGL={() => true} />);
    expect(screen.getByTestId("journey-path-canvas")).toHaveAttribute("data-waypoint", "0");

    rerender(<JourneyPathScene resolvedMissionCount={1} detectWebGL={() => true} />);
    expect(screen.getByTestId("journey-path-canvas")).toHaveAttribute("data-waypoint", "1");

    rerender(<JourneyPathScene resolvedMissionCount={2} detectWebGL={() => true} />);
    expect(screen.getByTestId("journey-path-canvas")).toHaveAttribute("data-waypoint", "2");
  });

  it("falls back to a static image when WebGL is unavailable", () => {
    render(<JourneyPathScene resolvedMissionCount={3} detectWebGL={() => false} />);
    const fallback = screen.getByTestId("journey-path-fallback");
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveAttribute("data-waypoint", "3");
  });
});
