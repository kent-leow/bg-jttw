import { useEffect, useState } from "react";
import QRCode from "qrcode";

export interface QrDisplayProps {
  readonly payload: string;
}

export function QrDisplay({ payload }: QrDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDataUrl(null);
    setErrorMessage(null);
    // errorCorrectionLevel "L" maximizes data capacity, since a real WebRTC SDP offer/answer
    // (with ICE candidates) is large and can otherwise exceed the QR code size limit.
    QRCode.toDataURL(payload, { errorCorrectionLevel: "L" })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error && /too big/i.test(error.message)
              ? "This code is too large to display as a QR code. Try reconnecting on a simpler network."
              : "Failed to generate the QR code. Please try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  if (errorMessage) {
    return <p role="alert">{errorMessage}</p>;
  }
  if (!dataUrl) {
    return <p role="status">Generating QR code…</p>;
  }
  return (
    <div className="qr-frame">
      <img src={dataUrl} alt="QR code" />
    </div>
  );
}
