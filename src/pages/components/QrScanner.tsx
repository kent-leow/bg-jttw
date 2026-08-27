import { useEffect, useRef } from "react";
import jsQR from "jsqr";

export interface QrScannerProps {
  readonly onDecoded: (payload: string) => void;
  readonly onError: (message: string) => void;
  readonly requestCamera?: () => Promise<MediaStream>;
  readonly startScanLoop?: (stream: MediaStream, onFrame: (payload: string | null) => void) => () => void;
}

function defaultRequestCamera(): Promise<MediaStream> {
  // "environment" prefers the rear/back camera (what you point at a QR code); falls back to
  // whatever camera is available on devices without one (e.g. laptops) since it's not "exact".
  return navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
}

/** Real camera scan loop: draws video frames to an offscreen canvas and decodes them with jsQR. */
function defaultStartScanLoop(stream: MediaStream, onFrame: (payload: string | null) => void): () => void {
  const video = document.createElement("video");
  video.srcObject = stream;
  void video.play();
  const canvas = document.createElement("canvas");
  let frameHandle = 0;
  let stopped = false;

  function tick() {
    if (stopped) {
      return;
    }
    const context = canvas.getContext("2d");
    if (context && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const decoded = jsQR(imageData.data, imageData.width, imageData.height);
      onFrame(decoded?.data ?? null);
    }
    frameHandle = requestAnimationFrame(tick);
  }
  frameHandle = requestAnimationFrame(tick);

  return () => {
    stopped = true;
    cancelAnimationFrame(frameHandle);
    for (const track of stream.getTracks()) {
      track.stop();
    }
  };
}

export function QrScanner({
  onDecoded,
  onError,
  requestCamera = defaultRequestCamera,
  startScanLoop = defaultStartScanLoop,
}: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const decodedRef = useRef(false);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    requestCamera()
      .then((stream) => {
        if (cancelled) {
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
        cleanup = startScanLoop(stream, (payload) => {
          if (payload && !decodedRef.current) {
            decodedRef.current = true;
            onDecoded(payload);
          }
        });
      })
      .catch(() => {
        onError("Camera access was denied or is unavailable.");
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="scan-viewport">
      <video ref={videoRef} aria-label="QR scanner viewport" autoPlay muted playsInline />
    </div>
  );
}
