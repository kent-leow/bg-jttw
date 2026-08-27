import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GameBoardPage } from "./GameBoardPage";

const players = [
  { id: "p1", displayName: "Sun Wukong" },
  { id: "p2", displayName: "Tang Sanzang" },
  { id: "p3", displayName: "Zhu Bajie" },
];

describe("GameBoardPage", () => {
  it("rejects a team proposal of the wrong size", async () => {
    const onProposeTeam = vi.fn();
    render(
      <GameBoardPage
        players={players}
        leaderId="p1"
        requiredTeamSize={2}
        isHost={false}
        isLeader
        votes={{}}
        onProposeTeam={onProposeTeam}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Sun Wukong" }));
    await userEvent.click(screen.getByRole("button", { name: "Propose Team" }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(onProposeTeam).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Tang Sanzang" }));
    await userEvent.click(screen.getByRole("button", { name: "Propose Team" }));

    expect(onProposeTeam).toHaveBeenCalledWith(["p1", "p2"]);
  });

  it("keeps Next disabled until every connected player has voted (host view)", () => {
    const { rerender } = render(
      <GameBoardPage
        players={players}
        leaderId="p1"
        requiredTeamSize={2}
        isHost
        isLeader={false}
        votes={{ p1: "Approve" }}
      />,
    );
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    rerender(
      <GameBoardPage
        players={players}
        leaderId="p1"
        requiredTeamSize={2}
        isHost
        isLeader={false}
        votes={{ p1: "Approve", p2: "Reject", p3: "Approve" }}
      />,
    );
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("never shows the vote-progress indicator or Next action on a non-host device", () => {
    render(
      <GameBoardPage
        players={players}
        leaderId="p1"
        requiredTeamSize={2}
        isHost={false}
        isLeader={false}
        votes={{ p1: "Approve", p2: "Reject", p3: "Approve" }}
      />,
    );
    expect(screen.queryByTestId("vote-progress")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });
});
