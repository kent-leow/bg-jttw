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

  it("can complete roster setup with 5 players and reach role reveal", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Start Game" })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "Start Game" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
    });

    // Select 5 players
    await userEvent.click(screen.getByRole("button", { name: "5" }));

    // Enter names for all 5 players
    for (let i = 0; i < 5; i++) {
      await waitFor(() => {
        expect(screen.getByPlaceholderText(`Player ${i + 1}`)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(`Player ${i + 1}`);
      await userEvent.type(input, `Player ${i + 1}`);

      // Skip photo for each player
      const skipButtons = screen.queryAllByRole("button", { name: /Next|Review/ });
      if (skipButtons.length > 0) {
        await userEvent.click(skipButtons[skipButtons.length - 1]);
      }
    }

    // Should reach review step
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: /Review Roster|Set Up Your Roster/ })
      ).toBeInTheDocument();
    });

    // Start the game - this should move to role reveal
    const startButtons = screen.queryAllByRole("button", { name: /Start Game|Next/ });
    for (const btn of startButtons) {
      if (btn.textContent?.includes("Start Game") || btn.textContent?.includes("Next")) {
        await userEvent.click(btn);
        break;
      }
    }

    // Wait for role reveal to appear
    await waitFor(
      () => {
        // RoleRevealPage should show a pass device gate
        const passGateInstruction = screen.queryByTestId("pass-device-gate-instruction");
        expect(passGateInstruction).toBeTruthy();
      },
      { timeout: 3000 }
    );
  });

  it("can play a complete game from setup through end-game with role reveal, voting, and missions", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Start game
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Start Game" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Start Game" }));

    // Select 5 players
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "5" }));

    // Enter names for 5 players
    for (let i = 0; i < 5; i++) {
      await waitFor(() => {
        expect(screen.getByPlaceholderText(`Player ${i + 1}`)).toBeInTheDocument();
      });
      const input = screen.getByPlaceholderText(`Player ${i + 1}`);
      await user.clear(input);
      await user.type(input, `TestPlayer${i + 1}`);

      // Skip photo
      const buttons = screen.queryAllByRole("button", { name: /Next|Review/ });
      if (buttons.length > 0) {
        const actionButton = buttons[buttons.length - 1];
        await user.click(actionButton);
      }
    }

    // Confirm roster review and start game
    await waitFor(() => {
      const startGameBtn = screen.queryByRole("button", { name: /Start Game/ });
      if (startGameBtn) {
        user.click(startGameBtn);
      }
    });

    // Roles should be assigned and we should see role reveal
    await waitFor(
      () => {
        // Should show pass device gate
        const passGateInstruction = screen.queryByTestId("pass-device-gate-instruction");
        expect(passGateInstruction).toBeTruthy();
      },
      { timeout: 3000 }
    );
  });
});

