import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InkSplashTransition } from "./InkSplashTransition";

describe("InkSplashTransition", () => {
  it("completes the transition and reveals the wrapped content", async () => {
    render(
      <InkSplashTransition durationMs={10}>
        <p data-testid="revealed-content">Merlin</p>
      </InkSplashTransition>,
    );

    expect(screen.queryByTestId("revealed-content")).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId("revealed-content")).toBeInTheDocument());
    expect(screen.getByTestId("ink-splash-transition")).toHaveAttribute("data-revealed", "true");
  });
});
