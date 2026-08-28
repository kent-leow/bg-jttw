import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AssassinationPage } from "./AssassinationPage";

const players = [
  { id: "p1", displayName: "Tang Sanzang" },
  { id: "p2", displayName: "Sun Wukong" },
];

describe("AssassinationPage", () => {
  it("renders the PassDeviceGate interstitial without naming the Assassin before confirmation", () => {
    const onSelectTarget = vi.fn();
    render(<AssassinationPage isAssassin players={players} onSelectTarget={onSelectTarget} />);

    // Interstitial should be visible
    expect(screen.getByTestId("pass-device-gate-instruction")).toBeInTheDocument();
    
    // Target grid should NOT be visible yet
    expect(screen.queryByTestId("assassination-target-grid")).not.toBeInTheDocument();
    
    // Instruction should not contain the Assassin's name (should say something generic)
    const instruction = screen.getByTestId("pass-device-gate-instruction");
    expect(instruction.textContent).not.toContain("Tang Sanzang");
    expect(instruction.textContent).not.toContain("Sun Wukong");
  });

  it("reveals the target grid only after PassDeviceGate is confirmed", async () => {
    const onSelectTarget = vi.fn();
    render(<AssassinationPage isAssassin players={players} onSelectTarget={onSelectTarget} />);

    // Initially, target grid is not in DOM
    expect(screen.queryByTestId("assassination-target-grid")).not.toBeInTheDocument();

    // Confirm the gate
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));

    // Now target grid should be visible
    expect(screen.getByTestId("assassination-target-grid")).toBeInTheDocument();
  });

  it("calls onSelectTarget exactly once when a target is selected", async () => {
    const onSelectTarget = vi.fn();
    render(<AssassinationPage isAssassin players={players} onSelectTarget={onSelectTarget} />);

    // Confirm the gate first
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));

    // Select a target
    await userEvent.click(screen.getByRole("button", { name: "Tang Sanzang" }));
    
    expect(onSelectTarget).toHaveBeenCalledTimes(1);
    expect(onSelectTarget).toHaveBeenCalledWith("p1");
  });

  it("renders the shared suspense screen on non-Assassin devices", () => {
    render(<AssassinationPage isAssassin={false} players={players} />);
    expect(screen.getByTestId("assassination-suspense")).toBeInTheDocument();
    expect(screen.queryByTestId("assassination-target-grid")).not.toBeInTheDocument();
  });
});
