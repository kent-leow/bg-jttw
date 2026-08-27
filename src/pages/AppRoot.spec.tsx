import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readLocalIdentity, writeLocalIdentity } from "../state/localIdentity";
import { AppRoot } from "./AppRoot";

describe("AppRoot", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("routes to the Join/Host entry when no identity is stored", async () => {
    render(
      <AppRoot
        renderNewPlayerEntry={() => <p data-testid="new-player-entry">Join or Host</p>}
        renderRestoredState={() => <p>restored</p>}
      />,
    );

    await waitFor(() => expect(screen.getByTestId("new-player-entry")).toBeInTheDocument());
  });

  it("restores the correct in-progress page when a stored identity + reachable host is found", async () => {
    writeLocalIdentity({ playerId: "p1", roomId: "room-1", lastKnownState: null });
    const checkHostReachable = vi.fn().mockResolvedValue({ reachable: true, currentState: { phase: "TeamVote" } });

    render(
      <AppRoot
        renderNewPlayerEntry={() => <p>new</p>}
        renderRestoredState={(state) => <p data-testid="restored-state">{JSON.stringify(state)}</p>}
        checkHostReachable={checkHostReachable}
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("restored-state")).toHaveTextContent(JSON.stringify({ phase: "TeamVote" })),
    );
  });

  it("shows the reconnect-failed message when a stored identity + unreachable host is found", async () => {
    writeLocalIdentity({ playerId: "p1", roomId: "room-1", lastKnownState: null });
    const checkHostReachable = vi.fn().mockResolvedValue({ reachable: false });

    render(
      <AppRoot
        renderNewPlayerEntry={() => <p>new</p>}
        renderRestoredState={() => <p>restored</p>}
        checkHostReachable={checkHostReachable}
      />,
    );

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/host unreachable/i));
  });

  it("lets the player start over instead of being stuck on the reconnect-failed message", async () => {
    writeLocalIdentity({ playerId: "p1", roomId: "room-1", lastKnownState: null });
    const checkHostReachable = vi.fn().mockResolvedValue({ reachable: false });

    render(
      <AppRoot
        renderNewPlayerEntry={() => <p data-testid="new-player-entry">new</p>}
        renderRestoredState={() => <p>restored</p>}
        checkHostReachable={checkHostReachable}
      />,
    );

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: "Start Over" }));

    expect(screen.getByTestId("new-player-entry")).toBeInTheDocument();
    expect(readLocalIdentity()).toBeNull();
  });
});
