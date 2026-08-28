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
        failThreshold={1}
        isHost={false}
        isLeader
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

  it("shows voting sequence after leader proposes valid team", async () => {
    const onProposeTeam = vi.fn();
    const onAllVotesCast = vi.fn();
    render(
      <GameBoardPage
        players={players}
        leaderId="p1"
        requiredTeamSize={2}
        failThreshold={1}
        isHost={false}
        isLeader
        onProposeTeam={onProposeTeam}
        onAllVotesCast={onAllVotesCast}
      />,
    );

    // Select team
    await userEvent.click(screen.getByRole("button", { name: "Sun Wukong" }));
    await userEvent.click(screen.getByRole("button", { name: "Tang Sanzang" }));
    await userEvent.click(screen.getByRole("button", { name: "Propose Team" }));

    // Verify team proposal callback fired
    expect(onProposeTeam).toHaveBeenCalledWith(["p1", "p2"]);

    // Verify voting sequence is shown (pass-device gate should appear)
    expect(screen.getByTestId("pass-device-gate-instruction")).toBeInTheDocument();
    expect(screen.getByTestId("pass-device-gate-instruction")).toHaveTextContent("Pass to Sun Wukong");
  });

  it("shows mission card collection after vote is approved", async () => {
    const onProposeTeam = vi.fn();
    const onAllVotesCast = vi.fn();
    render(
      <GameBoardPage
        players={players}
        leaderId="p1"
        requiredTeamSize={2}
        failThreshold={1}
        isHost
        isLeader
        onProposeTeam={onProposeTeam}
        onAllVotesCast={onAllVotesCast}
      />,
    );

    // Propose team (p1 and p2)
    await userEvent.click(screen.getByRole("button", { name: "Sun Wukong" }));
    await userEvent.click(screen.getByRole("button", { name: "Tang Sanzang" }));
    await userEvent.click(screen.getByRole("button", { name: "Propose Team" }));

    // All vote approve
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p1"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p2"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p3"));

    // After vote is approved, mission card sequence should appear
    // The gate should be for the first team member
    expect(screen.getByTestId("pass-device-gate-instruction")).toHaveTextContent("Pass to Sun Wukong");
    expect(screen.queryByTestId("card-success-p1")).not.toBeInTheDocument(); // Not visible until confirm
  });

  it("completes full mission cycle and shows mission result for host", async () => {
    const onProposeTeam = vi.fn();
    const onAllVotesCast = vi.fn();
    const onMissionResult = vi.fn();
    const onNext = vi.fn();
    render(
      <GameBoardPage
        players={players}
        leaderId="p1"
        requiredTeamSize={2}
        failThreshold={1}
        isHost
        isLeader
        onProposeTeam={onProposeTeam}
        onAllVotesCast={onAllVotesCast}
        onMissionResult={onMissionResult}
        onNext={onNext}
      />,
    );

    // Propose team (p1 and p2)
    await userEvent.click(screen.getByRole("button", { name: "Sun Wukong" }));
    await userEvent.click(screen.getByRole("button", { name: "Tang Sanzang" }));
    await userEvent.click(screen.getByRole("button", { name: "Propose Team" }));

    // All vote approve
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p1"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p2"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p3"));

    // Team members submit cards
    // p1 submits Success
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("card-success-p1"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    // p2 submits Fail
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("card-fail-p2"));

    // Mission result should be shown (with failThreshold=1, one Fail means mission Fails)
    expect(screen.getByTestId("mission-result")).toBeInTheDocument();
    expect(screen.getByTestId("mission-result")).toHaveTextContent("Fail");

    // onMissionResult callback should be called
    expect(onMissionResult).toHaveBeenCalledOnce();
    expect(onMissionResult).toHaveBeenCalledWith("Fail");

    // Next button should be visible for host
    const nextButton = screen.getByRole("button", { name: "Next" });
    expect(nextButton).toBeInTheDocument();
    expect(nextButton).not.toBeDisabled();

    // Click next
    await userEvent.click(nextButton);
    expect(onNext).toHaveBeenCalledOnce();
  });

  it("completes full voting cycle and shows Next button for host (rejected vote)", async () => {
    const onProposeTeam = vi.fn();
    const onAllVotesCast = vi.fn();
    const onNext = vi.fn();
    render(
      <GameBoardPage
        players={players}
        leaderId="p1"
        requiredTeamSize={2}
        failThreshold={1}
        isHost
        isLeader
        onProposeTeam={onProposeTeam}
        onAllVotesCast={onAllVotesCast}
        onNext={onNext}
      />,
    );

    // Propose team
    await userEvent.click(screen.getByRole("button", { name: "Sun Wukong" }));
    await userEvent.click(screen.getByRole("button", { name: "Tang Sanzang" }));
    await userEvent.click(screen.getByRole("button", { name: "Propose Team" }));

    // p1 and p2 approve, p3 rejects
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p1"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p2"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-reject-p3"));

    // Vote is approved (2 approves > 1 reject)
    expect(onAllVotesCast).toHaveBeenCalledOnce();
    expect(onAllVotesCast).toHaveBeenCalledWith({
      p1: "Approve",
      p2: "Approve",
      p3: "Reject",
    });

    // Mission cards should now be collected
    expect(screen.getByTestId("pass-device-gate-instruction")).toHaveTextContent("Pass to Sun Wukong");
  });

  it("non-leader does not see team proposal UI", () => {
    render(
      <GameBoardPage
        players={players}
        leaderId="p1"
        requiredTeamSize={2}
        failThreshold={1}
        isHost={false}
        isLeader={false}
      />,
    );

    // Propose Team button should not be visible for non-leader
    expect(screen.queryByRole("button", { name: "Propose Team" })).not.toBeInTheDocument();

    // But player portraits should still be visible
    expect(screen.getByRole("button", { name: "Sun Wukong" })).toBeInTheDocument();
  });

  it("non-host does not see Next button after mission result", async () => {
    const onProposeTeam = vi.fn();
    const onAllVotesCast = vi.fn();
    render(
      <GameBoardPage
        players={players}
        leaderId="p1"
        requiredTeamSize={2}
        failThreshold={1}
        isHost={false}
        isLeader
        onProposeTeam={onProposeTeam}
        onAllVotesCast={onAllVotesCast}
      />,
    );

    // Propose team
    await userEvent.click(screen.getByRole("button", { name: "Sun Wukong" }));
    await userEvent.click(screen.getByRole("button", { name: "Tang Sanzang" }));
    await userEvent.click(screen.getByRole("button", { name: "Propose Team" }));

    // Complete voting cycle
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p1"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p2"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-reject-p3"));

    // Complete mission card collection
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("card-success-p1"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("card-success-p2"));

    // Mission result should be visible
    expect(screen.getByTestId("mission-result")).toBeInTheDocument();

    // Next button should not be visible on non-host device
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });

  it("shows mission success when cards meet success condition", async () => {
    const onMissionResult = vi.fn();
    const onNext = vi.fn();
    render(
      <GameBoardPage
        players={players}
        leaderId="p1"
        requiredTeamSize={2}
        failThreshold={2}
        isHost
        isLeader
        onMissionResult={onMissionResult}
        onNext={onNext}
      />,
    );

    // Propose team
    await userEvent.click(screen.getByRole("button", { name: "Sun Wukong" }));
    await userEvent.click(screen.getByRole("button", { name: "Tang Sanzang" }));
    await userEvent.click(screen.getByRole("button", { name: "Propose Team" }));

    // All approve
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p1"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p2"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p3"));

    // Both team members submit Success
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("card-success-p1"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("card-success-p2"));

    // Mission should succeed (failThreshold=2, only 0 failures)
    expect(screen.getByTestId("mission-result")).toBeInTheDocument();
    expect(screen.getByTestId("mission-result")).toHaveTextContent("Success");
    expect(onMissionResult).toHaveBeenCalledWith("Success");
  });

  it("mission result never shows individual cards", async () => {
    const onNext = vi.fn();
    render(
      <GameBoardPage
        players={players}
        leaderId="p1"
        requiredTeamSize={2}
        failThreshold={1}
        isHost
        isLeader
        onNext={onNext}
      />,
    );

    // Propose team
    await userEvent.click(screen.getByRole("button", { name: "Sun Wukong" }));
    await userEvent.click(screen.getByRole("button", { name: "Tang Sanzang" }));
    await userEvent.click(screen.getByRole("button", { name: "Propose Team" }));

    // All approve
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p1"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p2"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("vote-approve-p3"));

    // Collect cards
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("card-success-p1"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("card-fail-p2"));

    // Mission result shown - should only show aggregate, never the individual cards
    const resultElement = screen.getByTestId("mission-result");
    expect(resultElement).toBeInTheDocument();
    // Should only show "Fail", not individual cards like "p1: Success" or "p2: Fail"
    expect(resultElement).toHaveTextContent("Fail");
    expect(screen.queryByTestId("mission-card-panel-p1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mission-card-panel-p2")).not.toBeInTheDocument();
  });
});
