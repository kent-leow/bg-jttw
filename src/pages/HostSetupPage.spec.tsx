import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { encodeQrPayload } from "../connection/qrCodec";
import { HostSetupPage } from "./HostSetupPage";

function fakeOffer(id: number) {
  return {
    offer: { type: "offer" as const, sdp: `sdp-${id}` },
    peerConnection: { id } as unknown as RTCPeerConnection,
  };
}

describe("HostSetupPage", () => {
  it("renders the QR code only after a player count is chosen", async () => {
    const generateOffer = vi.fn().mockResolvedValue(fakeOffer(1));
    render(
      <HostSetupPage
        generateOffer={generateOffer}
        requestCamera={() => new Promise(() => {})}
      />,
    );

    expect(screen.queryByAltText("QR code")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "6" }));

    await waitFor(() => expect(screen.getByAltText("QR code")).toBeInTheDocument());
    expect(generateOffer).toHaveBeenCalledTimes(1);
  });

  it("updates the seat counter as players join and enables Start Game only once seats are filled", async () => {
    let offerId = 0;
    const generateOffer = vi.fn().mockImplementation(() => Promise.resolve(fakeOffer(++offerId)));
    const completeJoinResolvers: Array<(result: { connectionEstablished: boolean }) => void> = [];
    const completeJoin = vi.fn(
      () =>
        new Promise<{ connectionEstablished: boolean }>((resolve) => {
          completeJoinResolvers.push(resolve);
        }),
    );
    const requestCamera = vi.fn().mockResolvedValue({} as MediaStream);
    const startScanLoop = vi.fn((_stream: MediaStream, onFrame: (payload: string | null) => void) => {
      onFrame(encodeQrPayload({ type: "answer", sdp: "joiner-answer-sdp" }));
      return () => {};
    });

    render(
      <HostSetupPage
        generateOffer={generateOffer}
        completeJoin={completeJoin}
        requestCamera={requestCamera}
        startScanLoop={startScanLoop}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "5" }));
    await waitFor(() => expect(screen.getByAltText("QR code")).toBeInTheDocument());

    const startButton = () => screen.getByRole("button", { name: "Start Game" });
    expect(startButton()).toBeDisabled();

    for (let expected = 1; expected <= 5; expected += 1) {
      await waitFor(() => expect(completeJoinResolvers.length).toBeGreaterThan(0));
      completeJoinResolvers.shift()!({ connectionEstablished: true });
      await waitFor(() => expect(screen.getByText(`${expected}/5 joined`)).toBeInTheDocument());
      if (expected < 5) {
        expect(startButton()).toBeDisabled();
      }
    }

    await waitFor(() => expect(startButton()).toBeEnabled());
  });
});
