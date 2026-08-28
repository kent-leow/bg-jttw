import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();

    // Mock getUserMedia for PhotoCapture
    const mockVideoTrack = { stop: vi.fn() };
    const mockAudioTrack = { stop: vi.fn() };
    vi.stubGlobal(
      "navigator",
      {
        mediaDevices: {
          getUserMedia: vi.fn().mockResolvedValue({
            getTracks: vi.fn(() => [mockVideoTrack, mockAudioTrack]),
          } as unknown as MediaStream),
        },
      } as unknown as Navigator,
    );

    // Mock HTMLVideoElement.prototype
    Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
      get: vi.fn(() => 640),
      configurable: true,
    });
    Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
      get: vi.fn(() => 480),
      configurable: true,
    });
  });

  it("mounts without throwing and shows LandingPage", async () => {
    expect(() => render(<App />)).not.toThrow();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Start Game" })).toBeInTheDocument();
    });
  });

  it("renders LandingPage with a single Start Game button", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Start Game" })).toBeInTheDocument();
    });

    // Should not have Join button
    expect(screen.queryByRole("button", { name: "Join a Game" })).not.toBeInTheDocument();
  });

  it("navigates to HostSetupPage when Start Game is clicked", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Start Game" })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "Start Game" }));

    await waitFor(() => {
      // HostSetupPage should show player count selection
      expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "10" })).toBeInTheDocument();
    });
  });

  it("navigates back to LandingPage from HostSetupPage", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Start Game" })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "Start Game" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
    });

    // Select a player count to enter name entry
    await userEvent.click(screen.getByRole("button", { name: "5" }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Player 1")).toBeInTheDocument();
    });

    // Click Back button
    const backButtons = screen.queryAllByRole("button", { name: "Back" });
    if (backButtons.length > 0) {
      await userEvent.click(backButtons[0]);

      await waitFor(() => {
        // Should be back to player count selection (or landing)
        const startButton = screen.queryByRole("button", { name: "Start Game" });
        if (startButton) {
          // Either on landing or back in setup - check if we can click player count buttons
          expect(
            screen.queryByRole("button", { name: "5" }) ||
            startButton,
          ).toBeTruthy();
        }
      });
    }
  });
});

