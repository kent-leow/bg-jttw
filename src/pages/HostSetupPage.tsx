import { useCallback, useMemo, useState } from "react";
import { completeConnection } from "../connection/completeConnection";
import { generateHostOffer, type OfferPayload } from "../connection/generateHostOffer";
import { decodeQrPayload, encodeQrPayload } from "../connection/qrCodec";
import { useTranslation } from "../i18n";
import { LanguageToggle } from "./components/LanguageToggle";
import { QrDisplay } from "./components/QrDisplay";
import { QrScanner, type QrScannerProps } from "./components/QrScanner";

const MIN_PLAYERS = 5;
const MAX_PLAYERS = 10;
const PLAYER_COUNT_OPTIONS = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (_, i) => MIN_PLAYERS + i,
);

export interface HostSetupPageProps {
  readonly generateOffer?: () => Promise<{ offer: OfferPayload; peerConnection: RTCPeerConnection }>;
  readonly completeJoin?: (
    peerConnection: RTCPeerConnection,
    answer: unknown,
  ) => Promise<{ connectionEstablished: boolean }>;
  readonly requestCamera?: QrScannerProps["requestCamera"];
  readonly startScanLoop?: QrScannerProps["startScanLoop"];
  readonly onStartGame?: (playerCount: number) => void;
}

export function HostSetupPage({
  generateOffer = generateHostOffer,
  completeJoin = completeConnection,
  requestCamera,
  startScanLoop,
  onStartGame,
}: HostSetupPageProps) {
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [offer, setOffer] = useState<{ offer: OfferPayload; peerConnection: RTCPeerConnection } | null>(null);
  const [joinedCount, setJoinedCount] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const { t } = useTranslation();

  const requestNextOffer = useCallback(() => {
    generateOffer().then(setOffer);
  }, [generateOffer]);

  const selectPlayerCount = useCallback(
    (count: number) => {
      setPlayerCount(count);
      setJoinedCount(0);
      requestNextOffer();
    },
    [requestNextOffer],
  );

  const handleScannedAnswer = useCallback(
    (rawPayload: string) => {
      if (!offer) {
        return;
      }
      let answer: unknown;
      try {
        answer = decodeQrPayload(rawPayload);
      } catch {
        setScanError(t("hostSetup.invalidReply"));
        return;
      }
      completeJoin(offer.peerConnection, answer).then(({ connectionEstablished }) => {
        if (!connectionEstablished) {
          setScanError(t("hostSetup.connectionFailed"));
          return;
        }
        setScanError(null);
        setJoinedCount((count) => {
          const next = count + 1;
          if (playerCount !== null && next < playerCount) {
            requestNextOffer();
          }
          return next;
        });
      });
    },
[offer, completeJoin, playerCount, requestNextOffer, t],
  );

  const encodedOffer = useMemo(() => (offer ? encodeQrPayload(offer.offer) : null), [offer]);
  const seatsFilled = playerCount !== null && joinedCount === playerCount;

  if (playerCount === null) {
    return (
      <section>
        <LanguageToggle />
        <h1>{t("hostSetup.title")}</h1>
        <p>{t("hostSetup.choosePlayerCount")}</p>
        <div role="group" aria-label="Player count">
          {PLAYER_COUNT_OPTIONS.map((count) => (
            <button key={count} type="button" onClick={() => selectPlayerCount(count)}>
              {count}
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <LanguageToggle />
      <h1>{t("hostSetup.title")}</h1>
      <p>{t("hostSetup.seatCounter", { joined: joinedCount, total: playerCount })}</p>
      {encodedOffer && <QrDisplay payload={encodedOffer} />}
      {!seatsFilled && offer && (
        <QrScanner
          key={joinedCount}
          onDecoded={handleScannedAnswer}
          onError={setScanError}
          requestCamera={requestCamera}
          startScanLoop={startScanLoop}
        />
      )}
      {scanError && <p role="alert">{scanError}</p>}
      <button type="button" disabled={!seatsFilled} onClick={() => onStartGame?.(playerCount)}>
        {t("common.startGame")}
      </button>
    </section>
  );
}
