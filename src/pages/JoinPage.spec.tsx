import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { encodeQrPayload } from "../connection/qrCodec";
import { JoinPage } from "./JoinPage";

function startScanLoopEmitting(payload: string) {
  return vi.fn((_stream: MediaStream, onFrame: (payload: string | null) => void) => {
    onFrame(payload);
    return () => {};
  });
}

describe("JoinPage", () => {
  it("shows an explicit error state for a malformed/invalid scanned offer, not a silent failure", async () => {
    const requestCamera = vi.fn().mockResolvedValue({} as MediaStream);
    const startScanLoop = startScanLoopEmitting("not-a-valid-base64-payload-!!!");

    render(<JoinPage requestCamera={requestCamera} startScanLoop={startScanLoop} />);

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByRole("alert").textContent).toMatch(/not a valid host invite/i);
  });

  it("renders the reply QR code after a successful scan", async () => {
    const requestCamera = vi.fn().mockResolvedValue({} as MediaStream);
    const startScanLoop = startScanLoopEmitting(encodeQrPayload({ type: "offer", sdp: "host-offer-sdp" }));
    const generateAnswer = vi.fn().mockResolvedValue({
      answer: { type: "answer", sdp: "joiner-answer-sdp" },
      peerConnection: {} as RTCPeerConnection,
    });

    render(
      <JoinPage generateAnswer={generateAnswer} requestCamera={requestCamera} startScanLoop={startScanLoop} />,
    );

    await waitFor(() => expect(screen.getByAltText("QR code")).toBeInTheDocument());
    expect(generateAnswer).toHaveBeenCalledWith({ type: "offer", sdp: "host-offer-sdp" });
  });
});
