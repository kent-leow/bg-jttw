import { useEffect, useState } from "react";
import QRCode from "qrcode";

export interface QrDisplayProps {
  readonly payload: string;
}

export function QrDisplay({ payload }: QrDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDataUrl(null);
    QRCode.toDataURL(payload)
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  if (!dataUrl) {
    return <p role="status">Generating QR code…</p>;
  }
  return <img src={dataUrl} alt="QR code" />;
}
