import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingScene } from "./landingScene";

describe("LandingScene", () => {
  it("renders the ink-wash mountain/cloud scene", () => {
    render(<LandingScene />);
    expect(screen.getByTestId("landing-scene")).toBeInTheDocument();
  });
});

