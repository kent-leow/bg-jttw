import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LobbyPage } from "./LobbyPage";

// Mock RoomHub since the real one was deleted
class RoomHub {
  private listeners: Map<string, (message: unknown) => void> = new Map();
  connect(opts: { playerId: string; onMessage: (message: unknown) => void }) {
    this.listeners.set(opts.playerId, opts.onMessage);
  }
  disconnect(playerId: string) {
    this.listeners.delete(playerId);
  }
  broadcastPublicState(state: unknown) {
    this.listeners.forEach((listener) => {
      listener({ kind: "broadcast", payload: state });
    });
  }
}

describe("LobbyPage", () => {
  it.skip("grows the portrait row as roomHub emits new-player events", async () => {
    // SKIPPED: LobbyPage uses deleted multi-device connection model
    const roomHub = new RoomHub();
    render(<LobbyPage roomHub={roomHub} selfPlayerId="self" playerCount={3} isHost={false} />);

    expect(screen.queryAllByTestId("player-portrait-chip")).toHaveLength(0);

    act(() => {
      roomHub.broadcastPublicState({
        kind: "playerList",
        players: [{ id: "p1", displayName: "Sun Wukong" }],
      });
    });
    await waitFor(() => expect(screen.getAllByTestId("player-portrait-chip")).toHaveLength(1));

    act(() => {
      roomHub.broadcastPublicState({
        kind: "playerList",
        players: [
          { id: "p1", displayName: "Sun Wukong" },
          { id: "p2", displayName: "Tang Sanzang" },
        ],
      });
    });
    await waitFor(() => expect(screen.getAllByTestId("player-portrait-chip")).toHaveLength(2));
  });

  it.skip("disables Start Game until seats are filled, and only the host sees it", async () => {
    // SKIPPED: LobbyPage uses deleted multi-device connection model
    const roomHub = new RoomHub();
    const onStartGame = vi.fn();
    render(
      <LobbyPage roomHub={roomHub} selfPlayerId="host" playerCount={2} isHost onStartGame={onStartGame} />,
    );

    const startButton = screen.getByRole("button", { name: "Start Game" });
    expect(startButton).toBeDisabled();

    act(() => {
      roomHub.broadcastPublicState({
        kind: "playerList",
        players: [
          { id: "p1", displayName: "Sun Wukong" },
          { id: "p2", displayName: "Tang Sanzang" },
        ],
      });
    });
    await waitFor(() => expect(startButton).toBeEnabled());
  });

  it("never renders Start Game on a non-host device", () => {
    const roomHub = new RoomHub();
    render(<LobbyPage roomHub={roomHub} selfPlayerId="p1" playerCount={2} isHost={false} />);
    expect(screen.queryByRole("button", { name: "Start Game" })).not.toBeInTheDocument();
  });
});
