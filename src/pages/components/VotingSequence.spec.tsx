import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VotingSequence } from "./VotingSequence";

const players = [
  { id: "p1", displayName: "Sun Wukong" },
  { id: "p2", displayName: "Tang Sanzang" },
  { id: "p3", displayName: "Zhu Bajie" },
];

describe("VotingSequence", () => {
  it("does not show a player's vote to subsequent voters", async () => {
    const onAllVotesCast = vi.fn();
    render(
      <VotingSequence players={players} onAllVotesCast={onAllVotesCast} />,
    );

    // First player should see their vote panel
    expect(
      screen.getByTestId("pass-device-gate-instruction"),
    ).toHaveTextContent("Pass to Sun Wukong");

    // Approve button should not be visible in the content yet (before confirm tap)
    const approveButton = screen.queryByTestId("vote-approve-p1");
    expect(approveButton).not.toBeInTheDocument();

    // Confirm tap to reveal vote panel
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));

    // Now approve button is visible
    expect(screen.getByTestId("vote-approve-p1")).toBeInTheDocument();

    // Vote (p1 votes Approve)
    await userEvent.click(screen.getByTestId("vote-approve-p1"));

    // Vote should be recorded (show submission message)
    expect(screen.getByTestId("vote-submitted")).toBeInTheDocument();

    // Hide & Continue to move to next player
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    // Second player (p2) should see their turn
    expect(
      screen.getByTestId("pass-device-gate-instruction"),
    ).toHaveTextContent("Pass to Tang Sanzang");

    // p1's vote should never be visible to p2 (not even in hidden content)
    expect(screen.queryByTestId("vote-approve-p1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("vote-reject-p1")).not.toBeInTheDocument();

    // Confirm & vote for p2
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-reject-p2"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    // Third player (p3)
    expect(
      screen.getByTestId("pass-device-gate-instruction"),
    ).toHaveTextContent("Pass to Zhu Bajie");
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p3"));

    // After all votes are cast, vote results should appear immediately
    expect(screen.getByTestId("vote-results")).toBeInTheDocument();
    expect(onAllVotesCast).toHaveBeenCalledOnce();
    expect(onAllVotesCast).toHaveBeenCalledWith({
      p1: "Approve",
      p2: "Reject",
      p3: "Approve",
    });
  });

  it("cannot change vote after hiding the pass-device gate", async () => {
    const onAllVotesCast = vi.fn();
    render(
      <VotingSequence players={players} onAllVotesCast={onAllVotesCast} />,
    );

    // p1 votes
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p1"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    // p2 cannot see p1's vote buttons
    expect(screen.queryByTestId("vote-approve-p1")).not.toBeInTheDocument();
  });

  it("fires onAllVotesCast only after every player has voted", async () => {
    const onAllVotesCast = vi.fn();
    render(
      <VotingSequence players={players} onAllVotesCast={onAllVotesCast} />,
    );

    // After p1 votes
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p1"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));
    expect(onAllVotesCast).not.toHaveBeenCalled();

    // After p2 votes
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-reject-p2"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));
    expect(onAllVotesCast).not.toHaveBeenCalled();

    // After p3 votes
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p3"));

    // Now onAllVotesCast should be called with all votes
    expect(onAllVotesCast).toHaveBeenCalledOnce();
    expect(onAllVotesCast).toHaveBeenCalledWith({
      p1: "Approve",
      p2: "Reject",
      p3: "Approve",
    });
  });

  it("shows all votes together only after every player has voted", async () => {
    const onAllVotesCast = vi.fn();
    render(
      <VotingSequence players={players} onAllVotesCast={onAllVotesCast} />,
    );

    // Vote results should not be visible yet
    expect(screen.queryByTestId("vote-results")).not.toBeInTheDocument();

    // Collect all votes
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p1"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-reject-p2"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p3"));

    // After all votes, results should be visible
    expect(screen.getByTestId("vote-results")).toBeInTheDocument();

    // All individual votes should be visible
    expect(screen.getByText("Sun Wukong:")).toBeInTheDocument();
    expect(screen.getByText("Tang Sanzang:")).toBeInTheDocument();
    expect(screen.getByText("Zhu Bajie:")).toBeInTheDocument();
    // Check that votes are rendered (using getAllByText to avoid ambiguity)
    expect(screen.getAllByText("Approve")).toHaveLength(2);
    expect(screen.getByText("Reject")).toBeInTheDocument();
  });

  it("vote resolution behaves identically to engine/voteResolution", async () => {
    const onAllVotesCast = vi.fn();
    render(
      <VotingSequence players={players} onAllVotesCast={onAllVotesCast} />,
    );

    // 2 Approve, 1 Reject -> Pass
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p1"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p2"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-reject-p3"));

    // Should show "Team Approved" (majority wins)
    expect(screen.getByTestId("vote-outcome")).toHaveTextContent("Team Approved");
  });

  it("treats tie as reject", async () => {
    const twoPlayers = [
      { id: "p1", displayName: "Alice" },
      { id: "p2", displayName: "Bob" },
    ];
    const onAllVotesCast = vi.fn();
    render(
      <VotingSequence players={twoPlayers} onAllVotesCast={onAllVotesCast} />,
    );

    // 1 Approve, 1 Reject -> Tie -> Reject
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p1"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-reject-p2"));

    // Should show "Team Rejected" (tie = reject)
    expect(screen.getByTestId("vote-outcome")).toHaveTextContent("Team Rejected");
  });

  it("works with a single player", async () => {
    const singlePlayer = [{ id: "p1", displayName: "Solo" }];
    const onAllVotesCast = vi.fn();
    render(
      <VotingSequence
        players={singlePlayer}
        onAllVotesCast={onAllVotesCast}
      />,
    );

    // Single player votes Approve
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p1"));

    // After single vote, results should show immediately (no need to hide & continue)
    expect(screen.getByTestId("vote-results")).toBeInTheDocument();
    expect(screen.getByTestId("vote-outcome")).toHaveTextContent("Team Approved");
    expect(onAllVotesCast).toHaveBeenCalledOnce();
    expect(onAllVotesCast).toHaveBeenCalledWith({ p1: "Approve" });
  });
});
