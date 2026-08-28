import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MissionCardSequence } from "./MissionCardSequence";

const approvedTeam = [
  { id: "p1", displayName: "Sun Wukong" },
  { id: "p2", displayName: "Tang Sanzang" },
];

describe("MissionCardSequence", () => {
  it("does not show a team member's card to subsequent members", async () => {
    const onAllCardsSubmitted = vi.fn();
    render(
      <MissionCardSequence
        approvedTeam={approvedTeam}
        onAllCardsSubmitted={onAllCardsSubmitted}
      />,
    );

    // First team member should see their card panel
    expect(
      screen.getByTestId("pass-device-gate-instruction"),
    ).toHaveTextContent("Pass to Sun Wukong");

    // Success button should not be visible in the content yet (before confirm tap)
    const successButton = screen.queryByTestId("card-success-p1");
    expect(successButton).not.toBeInTheDocument();

    // Confirm tap to reveal card panel
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));

    // Now success button is visible
    expect(screen.getByTestId("card-success-p1")).toBeInTheDocument();

    // Submit (p1 submits Success)
    await userEvent.click(screen.getByTestId("card-success-p1"));

    // Card should be recorded (show submission message)
    expect(screen.getByTestId("card-submitted")).toBeInTheDocument();

    // Hide & Continue to move to next team member
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    // Second team member (p2) should see their turn
    expect(
      screen.getByTestId("pass-device-gate-instruction"),
    ).toHaveTextContent("Pass to Tang Sanzang");

    // p1's card buttons should never be visible to p2 (not even in hidden content)
    expect(screen.queryByTestId("card-success-p1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-fail-p1")).not.toBeInTheDocument();

    // Confirm & submit for p2
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("card-fail-p2"));

    // After all cards are submitted, onAllCardsSubmitted should be called
    expect(onAllCardsSubmitted).toHaveBeenCalledOnce();
    expect(onAllCardsSubmitted).toHaveBeenCalledWith({
      p1: "Success",
      p2: "Fail",
    });
  });

  it("does not step through non-team members", async () => {
    const onAllCardsSubmitted = vi.fn();
    const smallTeam = [{ id: "p1", displayName: "Sun Wukong" }];
    render(
      <MissionCardSequence
        approvedTeam={smallTeam}
        onAllCardsSubmitted={onAllCardsSubmitted}
      />,
    );

    // Only p1 should be asked
    expect(
      screen.getByTestId("pass-device-gate-instruction"),
    ).toHaveTextContent("Pass to Sun Wukong");

    // Submit
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("card-success-p1"));

    // All cards should be submitted
    expect(onAllCardsSubmitted).toHaveBeenCalledOnce();
    expect(onAllCardsSubmitted).toHaveBeenCalledWith({ p1: "Success" });
  });

  it("submitted card is never rendered/exposed after submission", async () => {
    const onAllCardsSubmitted = vi.fn();
    render(
      <MissionCardSequence
        approvedTeam={approvedTeam}
        onAllCardsSubmitted={onAllCardsSubmitted}
      />,
    );

    // p1 submits
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("card-success-p1"));

    // After submission, p1's card UI should not be visible
    expect(screen.queryByTestId("card-success-p1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-fail-p1")).not.toBeInTheDocument();

    // Hide & move to p2
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    // p1's card should still never be visible to p2
    expect(screen.queryByTestId("card-success-p1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-fail-p1")).not.toBeInTheDocument();

    // p2 submits
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("card-fail-p2"));

    // After all submitted, no individual card UI should remain
    expect(screen.queryByTestId("mission-card-panel-p1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mission-card-panel-p2")).not.toBeInTheDocument();
  });

  it("fires onAllCardsSubmitted only after every team member has submitted", async () => {
    const onAllCardsSubmitted = vi.fn();
    render(
      <MissionCardSequence
        approvedTeam={approvedTeam}
        onAllCardsSubmitted={onAllCardsSubmitted}
      />,
    );

    // After p1 submits
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("card-success-p1"));
    expect(onAllCardsSubmitted).not.toHaveBeenCalled();

    // Move to p2
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    // After p2 submits
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("card-fail-p2"));

    // Now onAllCardsSubmitted should be called with correct card map
    expect(onAllCardsSubmitted).toHaveBeenCalledOnce();
    expect(onAllCardsSubmitted).toHaveBeenCalledWith({
      p1: "Success",
      p2: "Fail",
    });
  });

  it("onAllCardsSubmitted contains only team members' cards", async () => {
    const onAllCardsSubmitted = vi.fn();
    const tinyTeam = [
      { id: "p2", displayName: "Tang Sanzang" },
    ];
    render(
      <MissionCardSequence
        approvedTeam={tinyTeam}
        onAllCardsSubmitted={onAllCardsSubmitted}
      />,
    );

    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("card-success-p2"));

    expect(onAllCardsSubmitted).toHaveBeenCalledWith({ p2: "Success" });
    // p1 should not be in the result (was never asked)
    expect(onAllCardsSubmitted).toHaveBeenCalledWith(
      expect.not.objectContaining({ p1: expect.anything() })
    );
  });

  it("cannot change card after hiding the pass-device gate", async () => {
    const onAllCardsSubmitted = vi.fn();
    render(
      <MissionCardSequence
        approvedTeam={approvedTeam}
        onAllCardsSubmitted={onAllCardsSubmitted}
      />,
    );

    // p1 submits
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    await userEvent.click(screen.getByTestId("card-success-p1"));
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));

    // p2 cannot see p1's card buttons
    expect(screen.queryByTestId("card-success-p1")).not.toBeInTheDocument();
  });
});
