import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../../i18n";

export interface PhotoCaptureProps {
  readonly onCapture: (dataUrl: string | null) => void;
}

/**
 * PhotoCapture component: a button that requests the camera only on explicit tap,
 * shows a live preview, and lets the user snap or skip; returns the captured image
 * as a data URL via the onCapture callback.
 *
 * Camera access is requested only after the user taps "Enable Camera" (never automatically).
 */
export function PhotoCapture({ onCapture }: PhotoCaptureProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);

  /**
   * Request camera access on explicit user tap.
   */
  const handleEnableCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      setStream(mediaStream);
      setCameraEnabled(true);

      // Attach stream to video element (may fail in test environments)
      try {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (srcError) {
        // Silently fail on srcObject assignment - component is still usable
        console.debug("Could not attach stream to video element:", srcError);
      }
    } catch (error) {
      console.error("Camera access denied or unavailable:", error);
      // If camera fails, still allow user to skip
      onCapture(null);
    }
  };

  /**
   * Capture a frame from the video stream and convert to data URL.
   */
  const handleSnap = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL("image/jpeg");
        setCaptured(dataUrl);
      }
    }
  };

  /**
   * Retake: go back to live preview.
   */
  const handleRetake = () => {
    setCaptured(null);
  };

  /**
   * Use the captured photo.
   */
  const handleUse = () => {
    onCapture(captured);
    cleanup();
  };

  /**
   * Skip without a photo.
   */
  const handleSkip = () => {
    onCapture(null);
    cleanup();
  };

  /**
   * Stop the camera stream and reset.
   */
  const cleanup = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setCameraEnabled(false);
    setCaptured(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [stream]);

  if (!cameraEnabled) {
    return (
      <button
        type="button"
        className="btn btn--secondary"
        onClick={handleEnableCamera}
      >
        {t("photoCapture.enableCamera")}
      </button>
    );
  }

  if (captured) {
    return (
      <div className="photo-capture-preview">
        <img
          src={captured}
          alt="Captured photo"
          className="photo-capture-preview__img"
        />
        <div className="photo-capture-actions">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={handleRetake}
          >
            {t("photoCapture.retake")}
          </button>
          <button type="button" className="btn btn--primary" onClick={handleUse}>
            {t("photoCapture.useThis")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="photo-capture-live">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="photo-capture-live__video"
      />
      <div className="photo-capture-actions">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={handleSkip}
        >
          {t("photoCapture.skip")}
        </button>
        <button type="button" className="btn btn--primary" onClick={handleSnap}>
          {t("photoCapture.snap")}
        </button>
      </div>
      <canvas
        ref={canvasRef}
        style={{ display: "none" }}
        className="photo-capture-canvas"
      />
    </div>
  );
}
