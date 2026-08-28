import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { HostSetupPage } from "./HostSetupPage";

describe("HostSetupPage", () => {
  beforeEach(() => {
    // Mock getUserMedia for PhotoCapture tests
    const mockVideoTrack = { stop: vi.fn() };
    const mockAudioTrack = { stop: vi.fn() };
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: vi.fn(() => [mockVideoTrack, mockAudioTrack]),
        } as unknown as MediaStream),
      },
      configurable: true,
    });

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

  it("renders player count selection (5-10) on initial load", () => {
    render(<HostSetupPage />);

    expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "6" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "7" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "8" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "9" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "10" })).toBeInTheDocument();
  });

  it("moves to name entry after player count selection", async () => {
    render(<HostSetupPage />);

    await userEvent.click(screen.getByRole("button", { name: "5" }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Player 1")).toBeInTheDocument();
    });
  });

  it("enables Next button only after name is entered", async () => {
    render(<HostSetupPage />);

    await userEvent.click(screen.getByRole("button", { name: "5" }));

    const nextButton = screen.getByRole("button", { name: "Next" });
    expect(nextButton).toBeDisabled();

    const input = screen.getByPlaceholderText("Player 1") as HTMLInputElement;
    await userEvent.type(input, "Alice");

    expect(nextButton).toBeEnabled();
  });

  it("progresses through all seats when names are entered and photos are skipped", async () => {
    render(<HostSetupPage />);

    await userEvent.click(screen.getByRole("button", { name: "5" }));

    // Enter name for seat 1
    await userEvent.type(screen.getByPlaceholderText("Player 1"), "Alice");
    // Enable camera to see Skip button
    await userEvent.click(screen.getByRole("button", { name: "Capture Photo" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Skip/i })).toBeInTheDocument();
    });

    // Skip photo for seat 1
    await userEvent.click(screen.getByRole("button", { name: /Skip/i }));

    // Enter name for seat 2
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Player 2")).toBeInTheDocument();
    });
    await userEvent.type(screen.getByPlaceholderText("Player 2"), "Bob");
    // Enable camera and skip for seat 2
    await userEvent.click(screen.getByRole("button", { name: "Capture Photo" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Skip/i })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("button", { name: /Skip/i }));

    // Continue for remaining seats (3-4)
    for (let i = 3; i <= 4; i += 1) {
      await waitFor(() => {
        expect(screen.getByPlaceholderText(`Player ${i}`)).toBeInTheDocument();
      });
      await userEvent.type(screen.getByPlaceholderText(`Player ${i}`), `Player${i}`);
      // Enable camera
      await userEvent.click(screen.getByRole("button", { name: "Capture Photo" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Skip/i })).toBeInTheDocument();
      });
      // Skip photo
      await userEvent.click(screen.getByRole("button", { name: /Skip/i }));
    }

    // Last seat (5) should show "Review Roster" button
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Player 5")).toBeInTheDocument();
    });
    await userEvent.type(screen.getByPlaceholderText("Player 5"), "Player5");
    // Enable camera
    await userEvent.click(screen.getByRole("button", { name: "Capture Photo" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Skip/i })).toBeInTheDocument();
    });
    // Skip photo
    await userEvent.click(screen.getByRole("button", { name: /Skip/i }));

    // Should now be on review screen
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Start Game" })).toBeInTheDocument();
    });
  });

  it("shows Start Game button and lists all players on review screen", async () => {
    render(<HostSetupPage />);

    await userEvent.click(screen.getByRole("button", { name: "5" }));

    // Fill in all 5 players quickly by skipping photos
    for (let i = 1; i <= 5; i += 1) {
      await waitFor(() => {
        expect(screen.getByPlaceholderText(`Player ${i}`)).toBeInTheDocument();
      });
      await userEvent.type(screen.getByPlaceholderText(`Player ${i}`), `Player${i}`);
      // Enable camera
      await userEvent.click(screen.getByRole("button", { name: "Capture Photo" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Skip/i })).toBeInTheDocument();
      });
      // Skip photo
      await userEvent.click(screen.getByRole("button", { name: /Skip/i }));
    }

    // Review screen should show all names and Start Game enabled
    await waitFor(() => {
      const startButton = screen.getByRole("button", { name: "Start Game" });
      expect(startButton).toBeEnabled();
    });
  });

  it("calls onStartGame with roster when Start Game is clicked", async () => {
    const onStartGame = vi.fn();
    render(<HostSetupPage onStartGame={onStartGame} />);

    await userEvent.click(screen.getByRole("button", { name: "5" }));

    // Fill in all 5 players
    for (let i = 1; i <= 5; i += 1) {
      await waitFor(() => {
        expect(screen.getByPlaceholderText(`Player ${i}`)).toBeInTheDocument();
      });
      await userEvent.type(screen.getByPlaceholderText(`Player ${i}`), `Player${i}`);
      // Enable camera
      await userEvent.click(screen.getByRole("button", { name: "Capture Photo" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Skip/i })).toBeInTheDocument();
      });
      // Skip photo
      await userEvent.click(screen.getByRole("button", { name: /Skip/i }));
    }

    // Click Start Game
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Start Game" })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("button", { name: "Start Game" }));

    expect(onStartGame).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ displayName: "Player1" }),
        expect.objectContaining({ displayName: "Player2" }),
        expect.objectContaining({ displayName: "Player3" }),
        expect.objectContaining({ displayName: "Player4" }),
        expect.objectContaining({ displayName: "Player5" }),
      ]),
    );
  });

  it("allows editing a player during review", async () => {
    const onStartGame = vi.fn();
    render(<HostSetupPage onStartGame={onStartGame} />);

    await userEvent.click(screen.getByRole("button", { name: "5" }));

    // Fill in all players
    for (let i = 1; i <= 5; i += 1) {
      await waitFor(() => {
        expect(screen.getByPlaceholderText(`Player ${i}`)).toBeInTheDocument();
      });
      await userEvent.type(screen.getByPlaceholderText(`Player ${i}`), `Player${i}`);
      // Enable camera
      await userEvent.click(screen.getByRole("button", { name: "Capture Photo" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Skip/i })).toBeInTheDocument();
      });
      // Skip photo
      await userEvent.click(screen.getByRole("button", { name: /Skip/i }));
    }

    // Get to review screen
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Start Game" })).toBeInTheDocument();
    });

    // Click on first player to edit
    const playerChips = screen.getAllByRole("button").filter((btn) => btn.getAttribute("class")?.includes("portrait-chip"));
    await userEvent.click(playerChips[0]);

    // Should go back to name entry for seat 0
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Player 1")).toBeInTheDocument();
    });
    const input = screen.getByPlaceholderText("Player 1") as HTMLInputElement;
    expect(input.value).toBe("Player1");
  });

  it("shows Back button to return to player count selection from second seat onwards", async () => {
    render(<HostSetupPage />);

    await userEvent.click(screen.getByRole("button", { name: "5" }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Player 1")).toBeInTheDocument();
    });

    // Back button should not be visible on seat 0
    const backButtons = screen.queryAllByRole("button", { name: "Back" });
    expect(backButtons).toHaveLength(0);

    // Enter name and move to seat 2
    await userEvent.type(screen.getByPlaceholderText("Player 1"), "Alice");
    // Enable camera to see Skip button
    await userEvent.click(screen.getByRole("button", { name: "Capture Photo" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Skip/i })).toBeInTheDocument();
    });

    // Skip photo for seat 1
    await userEvent.click(screen.getByRole("button", { name: /Skip/i }));

    // Back button should be visible on seat 2
    await waitFor(() => {
      const backButtons2 = screen.queryAllByRole("button", { name: "Back" });
      expect(backButtons2.length).toBeGreaterThan(0);
    });
  });
});

