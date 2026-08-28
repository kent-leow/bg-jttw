import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ViewMyRoleMenu } from "./ViewMyRoleMenu";
import type { RoleDefinition } from "../../engine/types";
import type { HiddenKnowledge } from "../../engine/hiddenKnowledge";

describe("ViewMyRoleMenu", () => {
  const roster = [
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

  it("does not render when not visible", () => {
    render(
      <ViewMyRoleMenu
        selfPlayerId="p1"
        selfDisplayName="Tang Sanzang"
        roster={roster}
        roleByPlayerId={roles}
        hiddenKnowledgeByPlayerId={hiddenKnowledge}
        visible={false}
      />,
    );

    expect(screen.queryByTestId("view-my-role-button")).not.toBeInTheDocument();
  });

  it("renders View My Role button when visible and menu not open", () => {
    render(
      <ViewMyRoleMenu
        selfPlayerId="p1"
        selfDisplayName="Tang Sanzang"
        roster={roster}
        roleByPlayerId={roles}
        hiddenKnowledgeByPlayerId={hiddenKnowledge}
        visible={true}
      />,
    );

    expect(screen.getByTestId("view-my-role-button")).toBeInTheDocument();
  });

  it("opens roster selection menu when button clicked", async () => {
    render(
      <ViewMyRoleMenu
        selfPlayerId="p1"
        selfDisplayName="Tang Sanzang"
        roster={roster}
        roleByPlayerId={roles}
        hiddenKnowledgeByPlayerId={hiddenKnowledge}
        visible={true}
      />,
    );

    await userEvent.click(screen.getByTestId("view-my-role-button"));

    await waitFor(() => {
      expect(screen.getByTestId("view-my-role-panel")).toBeInTheDocument();
    });

    // Roster should be displayed
    expect(screen.getByTestId("select-player-p1")).toBeInTheDocument();
    expect(screen.getByTestId("select-player-p2")).toBeInTheDocument();
    expect(screen.getByTestId("select-player-p3")).toBeInTheDocument();
  });

  it("shows only selected player's role after gate confirm tap", async () => {
    render(
      <ViewMyRoleMenu
        selfPlayerId="p1"
        selfDisplayName="Tang Sanzang"
        roster={roster}
        roleByPlayerId={roles}
        hiddenKnowledgeByPlayerId={hiddenKnowledge}
        visible={true}
      />,
    );

    // Open menu
    await userEvent.click(screen.getByTestId("view-my-role-button"));

    // Select a player
    const selectP2 = screen.getByTestId("select-player-p2");
    await userEvent.click(selectP2);

    // PassDeviceGate should show interstitial with player's name
    await waitFor(() => {
      expect(screen.getByTestId("pass-device-gate-instruction")).toHaveTextContent("Sun Wukong");
    });

    // Confirm to reveal role
    const confirmButton = screen.getByTestId("pass-device-gate-confirm");
    await userEvent.click(confirmButton);

    // Now role should be visible
    await waitFor(() => {
      expect(screen.getByTestId("view-role-name")).toHaveTextContent("Morgana");
    });
  });

  it("dismissing/hiding leaves round state unchanged", async () => {
    const onDismiss = vi.fn();

    render(
      <ViewMyRoleMenu
        selfPlayerId="p1"
        selfDisplayName="Tang Sanzang"
        roster={roster}
        roleByPlayerId={roles}
        hiddenKnowledgeByPlayerId={hiddenKnowledge}
        visible={true}
        onDismiss={onDismiss}
      />,
    );

    // Open menu
    await userEvent.click(screen.getByTestId("view-my-role-button"));

    // Select a player
    await userEvent.click(screen.getByTestId("select-player-p1"));

    // Confirm to reveal
    const confirmButton = screen.getByTestId("pass-device-gate-confirm");
    await userEvent.click(confirmButton);

    // Hide
    const hideButton = screen.getByTestId("pass-device-gate-hide");
    await userEvent.click(hideButton);

    // onDismiss should be called
    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalled();
    });

    // Menu should be closed
    await waitFor(() => {
      expect(screen.getByTestId("view-my-role-button")).toBeInTheDocument();
    });
  });

  it("closes menu when back button clicked", async () => {
    render(
      <ViewMyRoleMenu
        selfPlayerId="p1"
        selfDisplayName="Tang Sanzang"
        roster={roster}
        roleByPlayerId={roles}
        hiddenKnowledgeByPlayerId={hiddenKnowledge}
        visible={true}
      />,
    );

    // Open menu
    await userEvent.click(screen.getByTestId("view-my-role-button"));

    await waitFor(() => {
      expect(screen.getByTestId("view-my-role-panel")).toBeInTheDocument();
    });

    // Click back button
    const backButton = screen.getByTestId("close-view-my-role-menu");
    await userEvent.click(backButton);

    // Menu should close and button should be visible again
    await waitFor(() => {
      expect(screen.queryByTestId("view-my-role-panel")).not.toBeInTheDocument();
      expect(screen.getByTestId("view-my-role-button")).toBeInTheDocument();
    });
  });

  it("displays hidden knowledge (evil players) when viewing Merlin's role", async () => {
    render(
      <ViewMyRoleMenu
        selfPlayerId="p1"
        selfDisplayName="Tang Sanzang"
        roster={roster}
        roleByPlayerId={roles}
        hiddenKnowledgeByPlayerId={hiddenKnowledge}
        visible={true}
      />,
    );

    // Open menu and select Merlin (p1)
    await userEvent.click(screen.getByTestId("view-my-role-button"));
    await userEvent.click(screen.getByTestId("select-player-p1"));

    // Confirm
    const confirmButton = screen.getByTestId("pass-device-gate-confirm");
    await userEvent.click(confirmButton);

    // Hidden knowledge should be visible
    await waitFor(() => {
      expect(screen.getByTestId("view-known-evil-players")).toHaveTextContent("Sun Wukong");
    });
  });
});