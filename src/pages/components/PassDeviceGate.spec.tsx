import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PassDeviceGate } from "./PassDeviceGate";

describe("PassDeviceGate", () => {
  it("does not render secret content before confirm tap", () => {
    render(
      <PassDeviceGate holderName="Alice" onHidden={vi.fn()}>
        <p>Secret role: Spy</p>
      </PassDeviceGate>,
    );

    // Secret content should not be in the DOM
    expect(screen.queryByText("Secret role: Spy")).not.toBeInTheDocument();
  });

  it("reveals secret content after confirm tap", async () => {
    render(
      <PassDeviceGate holderName="Alice" onHidden={vi.fn()}>
        <p>Secret role: Spy</p>
      </PassDeviceGate>,
    );

    const confirmButton = screen.getByTestId("pass-device-gate-confirm");
    await userEvent.click(confirmButton);

    // Secret content should now be in the DOM
    expect(screen.getByText("Secret role: Spy")).toBeInTheDocument();
  });

  it("removes secret content and fires onHidden when Hide & Continue is tapped", async () => {
    const onHidden = vi.fn();
    render(
      <PassDeviceGate holderName="Alice" onHidden={onHidden}>
        <p>Secret role: Spy</p>
      </PassDeviceGate>,
    );

    // First, reveal the content
    const confirmButton = screen.getByTestId("pass-device-gate-confirm");
    await userEvent.click(confirmButton);
    expect(screen.getByText("Secret role: Spy")).toBeInTheDocument();

    // Then, hide it
    const hideButton = screen.getByTestId("pass-device-gate-hide");
    await userEvent.click(hideButton);

    // Secret content should be removed from the DOM
    expect(screen.queryByText("Secret role: Spy")).not.toBeInTheDocument();
    // onHidden callback should have been called
    expect(onHidden).toHaveBeenCalledOnce();
  });

  it("renders generic instruction when holderName is null", () => {
    render(
      <PassDeviceGate holderName={null} onHidden={vi.fn()}>
        <p>Secret role: Assassin</p>
      </PassDeviceGate>,
    );

    // Should show generic instruction (no name)
    const instruction = screen.getByTestId("pass-device-gate-instruction");
    expect(instruction).toHaveTextContent("Tap when ready");
    // Should not contain "Pass to"
    expect(instruction).not.toHaveTextContent("Pass to");
  });

  it("renders specific instruction when holderName is provided", () => {
    render(
      <PassDeviceGate holderName="Bob" onHidden={vi.fn()}>
        <p>Secret role: Rebel</p>
      </PassDeviceGate>,
    );

    // Should show instruction with holderName
    const instruction = screen.getByTestId("pass-device-gate-instruction");
    expect(instruction).toHaveTextContent("Pass to Bob");
    expect(instruction).toHaveTextContent("tap when ready");
  });

  it("can cycle through reveal/hide multiple times", async () => {
    const onHidden = vi.fn();
    render(
      <PassDeviceGate holderName="Charlie" onHidden={onHidden}>
        <p>Secret vote: Approve</p>
      </PassDeviceGate>,
    );

    // First cycle: reveal
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    expect(screen.getByText("Secret vote: Approve")).toBeInTheDocument();

    // Hide
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));
    expect(screen.queryByText("Secret vote: Approve")).not.toBeInTheDocument();
    expect(onHidden).toHaveBeenCalledTimes(1);

    // Second cycle: reveal again
    await userEvent.click(screen.getByTestId("pass-device-gate-confirm"));
    expect(screen.getByText("Secret vote: Approve")).toBeInTheDocument();

    // Hide again
    await userEvent.click(screen.getByTestId("pass-device-gate-hide"));
    expect(screen.queryByText("Secret vote: Approve")).not.toBeInTheDocument();
    expect(onHidden).toHaveBeenCalledTimes(2);
  });
});
