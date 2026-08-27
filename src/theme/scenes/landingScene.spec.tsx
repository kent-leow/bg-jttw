import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingScene } from "./landingScene";

describe("LandingScene", () => {
  it("falls back to a static image when WebGL is unavailable", () => {
    render(<LandingScene detectWebGL={() => false} />);
    expect(screen.getByTestId("landing-scene-fallback")).toBeInTheDocument();
    expect(screen.queryByTestId("landing-scene-canvas")).not.toBeInTheDocument();
  });

  it("falls back to a static image by default in this (WebGL-less) test environment", () => {
    render(<LandingScene />);
    expect(screen.getByTestId("landing-scene-fallback")).toBeInTheDocument();
  });

  it("renders the animated canvas when WebGL is available", () => {
    render(<LandingScene detectWebGL={() => true} />);
    expect(screen.getByTestId("landing-scene-canvas")).toBeInTheDocument();
    expect(screen.queryByTestId("landing-scene-fallback")).not.toBeInTheDocument();
  });
});
