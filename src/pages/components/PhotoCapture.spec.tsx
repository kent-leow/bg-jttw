import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { PhotoCapture } from "./PhotoCapture";

describe("PhotoCapture", () => {
  beforeEach(() => {
    const mockVideoTrack = { stop: vi.fn() };
    const mockAudioTrack = { stop: vi.fn() };

    // Mock navigator.mediaDevices with a resolved promise
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: vi.fn(() => [mockVideoTrack, mockAudioTrack]),
        } as unknown as MediaStream),
      },
      configurable: true,
    });

    // Mock HTMLVideoElement.prototype
    Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
      get: vi.fn(() => 640),
      configurable: true,
    });
    Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
      get: vi.fn(() => 480),
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the enable camera button and does not request camera on mount", () => {
    const onCapture = vi.fn();
    render(<PhotoCapture onCapture={onCapture} />);

    expect(screen.getByRole("button", { name: /Capture Photo/i })).toBeInTheDocument();
    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
  });

  it("requests camera access only after the enable camera tap", async () => {
    const onCapture = vi.fn();
    render(<PhotoCapture onCapture={onCapture} />);

    const enableBtn = screen.getByRole("button", { name: /Capture Photo/i });
    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();

    await act(async () => {
      userEvent.click(enableBtn);
    });

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });
  });

  it("shows video controls after camera is enabled", async () => {
    const onCapture = vi.fn();
    render(<PhotoCapture onCapture={onCapture} />);

    const enableBtn = screen.getByRole("button", { name: /Capture Photo/i });
    
    await act(async () => {
      userEvent.click(enableBtn);
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Snap/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Skip/i })).toBeInTheDocument();
    });
  });

  it("calls onCapture with null when skip is clicked", async () => {
    const onCapture = vi.fn();
    render(<PhotoCapture onCapture={onCapture} />);

    const enableBtn = screen.getByRole("button", { name: /Capture Photo/i });
    
    await act(async () => {
      userEvent.click(enableBtn);
    });

    const skipBtn = await waitFor(() => 
      screen.getByRole("button", { name: /Skip/i })
    );
    
    await act(async () => {
      await userEvent.click(skipBtn);
    });

    expect(onCapture).toHaveBeenCalledWith(null);
  });

  it("calls onCapture with null if camera access is denied", async () => {
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(
      new Error("Permission denied"),
    );
    const onCapture = vi.fn();
    render(<PhotoCapture onCapture={onCapture} />);

    const enableBtn = screen.getByRole("button", { name: /Capture Photo/i });
    
    await act(async () => {
      userEvent.click(enableBtn);
    });

    await waitFor(() => {
      expect(onCapture).toHaveBeenCalledWith(null);
    });
  });
});


