import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssassinationSuspenseScene } from "./assassinationSuspenseScene";

describe("AssassinationSuspenseScene", () => {
  it("falls back to a static image when WebGL is unavailable", () => {
    render(<AssassinationSuspenseScene detectWebGL={() => false} />);
    expect(screen.getByTestId("assassination-suspense-scene-fallback")).toBeInTheDocument();
  });

  it("renders the animated canvas when WebGL is available", () => {
    render(<AssassinationSuspenseScene detectWebGL={() => true} />);
    expect(screen.getByTestId("assassination-suspense-scene-canvas")).toBeInTheDocument();
  });
});
