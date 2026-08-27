import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AssassinationPage } from "./AssassinationPage";

const players = [
  { id: "p1", displayName: "Tang Sanzang" },
  { id: "p2", displayName: "Sun Wukong" },
];

describe("AssassinationPage", () => {
  it("renders the target grid only on the Assassin's device", async () => {
    const onSelectTarget = vi.fn();
    render(<AssassinationPage isAssassin players={players} onSelectTarget={onSelectTarget} />);

    expect(screen.getByTestId("assassination-target-grid")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tang Sanzang" }));
    expect(onSelectTarget).toHaveBeenCalledWith("p1");
  });

  it("renders the shared suspense screen on non-Assassin devices", () => {
    render(<AssassinationPage isAssassin={false} players={players} />);
    expect(screen.getByTestId("assassination-suspense")).toBeInTheDocument();
    expect(screen.queryByTestId("assassination-target-grid")).not.toBeInTheDocument();
  });
});
