import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EndGamePage } from "./EndGamePage";

const players = [
  { id: "p1", displayName: "Tang Sanzang", role: { name: "Merlin" as const, alignment: "Good" as const } },
  { id: "p2", displayName: "Bai Gu Jing", role: { name: "Morgana" as const, alignment: "Evil" as const } },
];

describe("EndGamePage", () => {
  it("reveals the result, reason, and every player's true role identically on every device", () => {
    render(
      <EndGamePage result="GoodWin" resultReason="Assassin failed to identify Merlin" players={players} isHost={false} />,
    );

    expect(screen.getByTestId("game-result")).toHaveTextContent("GoodWin");
    expect(screen.getByTestId("game-result-reason")).toHaveTextContent("Assassin failed to identify Merlin");
    const roles = screen.getAllByTestId("revealed-role");
    expect(roles).toHaveLength(2);
    expect(roles[0]).toHaveTextContent("Merlin");
    expect(roles[1]).toHaveTextContent("Morgana");
  });

  it("renders Rematch/End Session only on the host device", async () => {
    const onRematch = vi.fn();
    const onEndSession = vi.fn();
    render(
      <EndGamePage
        result="EvilWin"
        resultReason="3 failed missions"
        players={players}
        isHost
        onRematch={onRematch}
        onEndSession={onEndSession}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Rematch" }));
    await userEvent.click(screen.getByRole("button", { name: "End Session" }));
    expect(onRematch).toHaveBeenCalledTimes(1);
    expect(onEndSession).toHaveBeenCalledTimes(1);
  });

  it("does not render Rematch/End Session on a non-host device", () => {
    render(<EndGamePage result="EvilWin" resultReason="3 failed missions" players={players} isHost={false} />);
    expect(screen.queryByRole("button", { name: "Rematch" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "End Session" })).not.toBeInTheDocument();
  });

  it("renders the lotus seal on GoodWin and the demon-mask seal on EvilWin", () => {
    const { rerender } = render(
      <EndGamePage result="GoodWin" resultReason="Assassin failed to identify Merlin" players={players} isHost={false} />,
    );
    expect(screen.getByTestId("seal-badge-good")).toBeInTheDocument();
    expect(screen.queryByTestId("seal-badge-evil")).not.toBeInTheDocument();

    rerender(
      <EndGamePage result="EvilWin" resultReason="3 failed missions" players={players} isHost={false} />,
    );
    expect(screen.getByTestId("seal-badge-evil")).toBeInTheDocument();
    expect(screen.queryByTestId("seal-badge-good")).not.toBeInTheDocument();
  });
});
