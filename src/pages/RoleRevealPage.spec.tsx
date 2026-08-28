import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RoleRevealPage, type LobbyPlayer } from "./RoleRevealPage";
import type { RoleDefinition } from "../engine/types";
import type { HiddenKnowledge } from "../engine/hiddenKnowledge";

describe("RoleRevealPage", () => {
  const players: LobbyPlayer[] = [
    { id: "p1", displayName: "Tang Sanzang" },
    { id: "p2", displayName: "Sun Wukong" },
    { id: "p3", displayName: "Zhu Bajie" },
  ];

  const roles = new Map<string, RoleDefinition>([
    ["p1", { name: "Merlin", alignment: "Good" }],
    ["p2", { name: "Morgana", alignment: "Evil" }],
    ["p3", { name: "LoyalServant", alignment: "Good" }],
  ]);

  const hiddenKnowledge = new Map<string, HiddenKnowledge>([
    ["p1", { playerId: "p1", evilPlayerIds: ["p2"] }],
    ["p2", { playerId: "p2" }],
    ["p3", { playerId: "p3" }],
  ]);

  it("reveals players' roles one at a time in roster order", async () => {
    render(
      <RoleRevealPage
        roster={players}
        roleByPlayerId={roles}
        hiddenKnowledgeByPlayerId={hiddenKnowledge}
      />,
    );

    // First player's role should be visible after confirm
    const confirmButton = screen.getByTestId("pass-device-gate-confirm");
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByTestId("role-name")).toHaveTextContent("Merlin");
    });
  });

  it("does not show a player's role card before confirm tap for that player", async () => {
    render(
      <RoleRevealPage
        roster={players}
        roleByPlayerId={roles}
        hiddenKnowledgeByPlayerId={hiddenKnowledge}
      />,
    );

    // Role card should not be in DOM yet
    expect(screen.queryByTestId("role-card-p1")).not.toBeInTheDocument();

    // After confirm, it should appear
    const confirmButton = screen.getByTestId("pass-device-gate-confirm");
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByTestId("role-card-p1")).toBeInTheDocument();
    });
  });

  it("advances to next player after Hide & Continue", async () => {
    render(
      <RoleRevealPage
        roster={players}
        roleByPlayerId={roles}
        hiddenKnowledgeByPlayerId={hiddenKnowledge}
      />,
    );

    // Confirm for first player
    let confirmButton = screen.getByTestId("pass-device-gate-confirm");
    await userEvent.click(confirmButton);

    // Should show Merlin
    await waitFor(() => {
      expect(screen.getByTestId("role-name")).toHaveTextContent("Merlin");
    });

    // Hide current player
    const hideButton = screen.getByTestId("pass-device-gate-hide");
    await userEvent.click(hideButton);

    // Should return to interstitial showing second player's name
    await waitFor(() => {
      expect(screen.getByTestId("pass-device-gate-instruction")).toHaveTextContent(
        "Sun Wukong",
      );
    });

    // Confirm for second player
    confirmButton = screen.getByTestId("pass-device-gate-confirm");
    await userEvent.click(confirmButton);

    // Should show Morgana
    await waitFor(() => {
      expect(screen.getByTestId("role-name")).toHaveTextContent("Morgana");
    });
  });

  it("shows hidden knowledge for Merlin (evil players list)", async () => {
    render(
      <RoleRevealPage
        roster={players}
        roleByPlayerId={roles}
        hiddenKnowledgeByPlayerId={hiddenKnowledge}
      />,
    );

    const confirmButton = screen.getByTestId("pass-device-gate-confirm");
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByTestId("known-evil-players")).toHaveTextContent("Sun Wukong");
    });
  });

  it("calls onRoleRevealComplete only after every player has been shown and hidden", async () => {
    const onRoleRevealComplete = vi.fn();

    render(
      <RoleRevealPage
        roster={players}
        roleByPlayerId={roles}
        hiddenKnowledgeByPlayerId={hiddenKnowledge}
        onRoleRevealComplete={onRoleRevealComplete}
      />,
    );

    // Not called yet
    expect(onRoleRevealComplete).not.toHaveBeenCalled();

    // First player: confirm then hide
    let confirmButton = screen.getByTestId("pass-device-gate-confirm");
    await userEvent.click(confirmButton);
    let hideButton = screen.getByTestId("pass-device-gate-hide");
    await userEvent.click(hideButton);

    // Still not called
    expect(onRoleRevealComplete).not.toHaveBeenCalled();

    // Second player: confirm then hide
    confirmButton = screen.getByTestId("pass-device-gate-confirm");
    await userEvent.click(confirmButton);
    hideButton = screen.getByTestId("pass-device-gate-hide");
    await userEvent.click(hideButton);

    // Still not called
    expect(onRoleRevealComplete).not.toHaveBeenCalled();

    // Third player: confirm then hide
    confirmButton = screen.getByTestId("pass-device-gate-confirm");
    await userEvent.click(confirmButton);
    hideButton = screen.getByTestId("pass-device-gate-hide");
    await userEvent.click(hideButton);

    // Now it should be called
    await waitFor(() => {
      expect(onRoleRevealComplete).toHaveBeenCalledTimes(1);
    });
  });

  it("makes game board available only after all players shown", async () => {
    render(
      <RoleRevealPage
        roster={players}
        roleByPlayerId={roles}
        hiddenKnowledgeByPlayerId={hiddenKnowledge}
      />,
    );

    // Game board button should not exist initially
    expect(screen.queryByTestId("start-game-board")).not.toBeInTheDocument();

    // Go through all players
    for (let i = 0; i < players.length; i++) {
      const confirmButton = screen.getByTestId("pass-device-gate-confirm");
      await userEvent.click(confirmButton);
      const hideButton = screen.getByTestId("pass-device-gate-hide");
      await userEvent.click(hideButton);
    }

    // After all players, game board button should appear
    await waitFor(() => {
      expect(screen.getByTestId("start-game-board")).toBeInTheDocument();
    });
  });
});
