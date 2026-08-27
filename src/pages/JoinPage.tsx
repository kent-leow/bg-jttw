import { useCallback, useState } from "react";
import { generateJoinAnswer } from "../connection/generateJoinAnswer";
import { decodeQrPayload, encodeQrPayload } from "../connection/qrCodec";
import type { OfferPayload } from "../connection/generateHostOffer";
import { QrDisplay } from "./components/QrDisplay";
import { QrScanner, type QrScannerProps } from "./components/QrScanner";

type JoinPageStatus = "scanning" | "connected" | "error";

export interface JoinPageProps {
  readonly generateAnswer?: typeof generateJoinAnswer;
  readonly requestCamera?: QrScannerProps["requestCamera"];
  readonly startScanLoop?: QrScannerProps["startScanLoop"];
}

export function JoinPage({ generateAnswer = generateJoinAnswer, requestCamera, startScanLoop }: JoinPageProps) {
  const [status, setStatus] = useState<JoinPageStatus>("scanning");
  const [encodedAnswer, setEncodedAnswer] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDecodedOffer = useCallback(
    (rawPayload: string) => {
      let hostOffer: OfferPayload;
      try {
        hostOffer = decodeQrPayload<OfferPayload>(rawPayload);
      } catch {
        setStatus("error");
        setErrorMessage("The scanned code was not a valid host invite.");
        return;
      }

      generateAnswer(hostOffer)
        .then(({ answer }) => {
          setEncodedAnswer(encodeQrPayload(answer));
          setStatus("connected");
        })
        .catch(() => {
          setStatus("error");
          setErrorMessage("Could not connect to the host. Please try scanning again.");
        });
    },
    [generateAnswer],
  );

  const handleScanError = useCallback((message: string) => {
    setStatus("error");
    setErrorMessage(message);
  }, []);

  return (
    <section>
      <h1>Join a Game</h1>
      {status === "scanning" && (
        <QrScanner onDecoded={handleDecodedOffer} onError={handleScanError} requestCamera={requestCamera} startScanLoop={startScanLoop} />
      )}
      {status === "error" && <p role="alert">{errorMessage}</p>}
      {status === "connected" && encodedAnswer && (
        <>
          <p>Show this code to the host:</p>
          <QrDisplay payload={encodedAnswer} />
        </>
      )}
    </section>
  );
}
