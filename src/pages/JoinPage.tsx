import { useCallback, useState } from "react";
import { generateJoinAnswer } from "../connection/generateJoinAnswer";
import { decodeQrPayload, encodeQrPayload } from "../connection/qrCodec";
import type { OfferPayload } from "../connection/generateHostOffer";
import { useTranslation } from "../i18n";
import { LanguageToggle } from "./components/LanguageToggle";
import { QrDisplay } from "./components/QrDisplay";
import { QrScanner, type QrScannerProps } from "./components/QrScanner";

type JoinPageStatus = "idle" | "scanning" | "connected" | "error";

export interface JoinPageProps {
  readonly generateAnswer?: typeof generateJoinAnswer;
  readonly requestCamera?: QrScannerProps["requestCamera"];
  readonly startScanLoop?: QrScannerProps["startScanLoop"];
}

export function JoinPage({ generateAnswer = generateJoinAnswer, requestCamera, startScanLoop }: JoinPageProps) {
  const [status, setStatus] = useState<JoinPageStatus>("idle");
  const [encodedAnswer, setEncodedAnswer] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleDecodedOffer = useCallback(
    (rawPayload: string) => {
      let hostOffer: OfferPayload;
      try {
        hostOffer = decodeQrPayload<OfferPayload>(rawPayload);
      } catch {
        setStatus("error");
        setErrorMessage(t("joinPage.invalidOffer"));
        return;
      }

      generateAnswer(hostOffer)
        .then(({ answer }) => {
          setEncodedAnswer(encodeQrPayload(answer));
          setStatus("connected");
        })
        .catch(() => {
          setStatus("error");
          setErrorMessage(t("joinPage.connectionFailed"));
        });
    },
    [generateAnswer, t],
  );

  const handleScanError = useCallback((message: string) => {
    setStatus("error");
    setErrorMessage(message);
  }, []);

  return (
    <section className="page page--centered">
      <LanguageToggle />
      <h1>{t("joinPage.title")}</h1>
      {status === "idle" && (
        <div className="scroll-card">
          <p className="page__hint">{t("joinPage.scanInstruction")}</p>
          <button type="button" className="btn btn--primary" onClick={() => setStatus("scanning")}>
            {t("joinPage.startScanning")}
          </button>
        </div>
      )}
      {status === "scanning" && (
        <QrScanner onDecoded={handleDecodedOffer} onError={handleScanError} requestCamera={requestCamera} startScanLoop={startScanLoop} />
      )}
      {status === "error" && <p role="alert">{errorMessage}</p>}
      {status === "connected" && encodedAnswer && (
        <div className="scroll-card">
          <p className="page__hint">{t("joinPage.showToHost")}</p>
          <QrDisplay payload={encodedAnswer} />
        </div>
      )}
    </section>
  );
}
