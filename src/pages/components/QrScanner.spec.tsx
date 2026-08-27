import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QrScanner } from "./QrScanner";

describe("QrScanner", () => {
  it("emits the decoded payload on a successful scan", async () => {
    const onDecoded = vi.fn();
    const onError = vi.fn();
    const fakeStream = {} as MediaStream;
    const requestCamera = vi.fn().mockResolvedValue(fakeStream);
    const startScanLoop = vi.fn((_stream: MediaStream, onFrame: (payload: string | null) => void) => {
      onFrame("decoded-qr-payload");
      return () => {};
    });

    render(
      <QrScanner
        onDecoded={onDecoded}
        onError={onError}
        requestCamera={requestCamera}
        startScanLoop={startScanLoop}
      />,
    );

    await waitFor(() => expect(onDecoded).toHaveBeenCalledWith("decoded-qr-payload"));
    expect(onError).not.toHaveBeenCalled();
  });

  it("emits an explicit error on camera-permission denial, not a silent failure", async () => {
    const onDecoded = vi.fn();
    const onError = vi.fn();
    const requestCamera = vi.fn().mockRejectedValue(new DOMException("Permission denied", "NotAllowedError"));

    render(<QrScanner onDecoded={onDecoded} onError={onError} requestCamera={requestCamera} />);

    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.stringMatching(/camera/i)));
    expect(onDecoded).not.toHaveBeenCalled();
  });
});
