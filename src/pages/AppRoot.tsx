import { useEffect, useState, type ReactElement } from "react";
import {
  clearLocalIdentity as defaultClearLocalIdentity,
  readLocalIdentity as defaultReadLocalIdentity,
  type LocalIdentity,
} from "../state/localIdentity";
import { reestablishConnection, type HostReachabilityCheck } from "../connection/reestablishConnection";

type AppRootStatus = "checking" | "new" | "restored" | "failed";

export interface AppRootProps {
  readonly renderNewPlayerEntry: () => ReactElement;
  readonly renderRestoredState: (currentState: unknown) => ReactElement;
  readonly readLocalIdentity?: () => LocalIdentity | null;
  readonly clearLocalIdentity?: () => void;
  readonly checkHostReachable?: HostReachabilityCheck;
}

export function AppRoot({
  renderNewPlayerEntry,
  renderRestoredState,
  readLocalIdentity = defaultReadLocalIdentity,
  clearLocalIdentity = defaultClearLocalIdentity,
  checkHostReachable,
}: AppRootProps) {
  const [status, setStatus] = useState<AppRootStatus>("checking");
  const [currentState, setCurrentState] = useState<unknown>(null);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);

  useEffect(() => {
    const identity = readLocalIdentity();
    if (!identity) {
      setStatus("new");
      return;
    }
    if (!checkHostReachable) {
      setStatus("failed");
      setFailureMessage(
        "Host unreachable: your connection was lost when the page reloaded, and this app has no backend to reconnect you automatically.",
      );
      return;
    }
    reestablishConnection(identity.roomId, identity.playerId, checkHostReachable).then((result) => {
      if (result.reconnected) {
        setStatus("restored");
        setCurrentState(result.currentState);
      } else {
        setStatus("failed");
        setFailureMessage(
          result.message ??
            "Host unreachable: your connection was lost when the page reloaded, and this app has no backend to reconnect you automatically.",
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "checking") {
    return <p role="status">Checking for an existing session…</p>;
  }
  if (status === "new") {
    return renderNewPlayerEntry();
  }
  if (status === "restored") {
    return renderRestoredState(currentState);
  }
  // A live WebRTC connection cannot survive a page reload (its RTCPeerConnection/RTCDataChannel
  // are destroyed with the old JS runtime) — this is unavoidable without a signaling backend, so
  // give the player an explicit way back in instead of leaving them on inert, dead-end text.
  return (
    <section className="page page--centered">
      <p role="alert" className="alert-text">
        {failureMessage}
      </p>
      <button
        type="button"
        className="btn btn--primary"
        onClick={() => {
          clearLocalIdentity();
          setStatus("new");
        }}
      >
        Start Over
      </button>
    </section>
  );
}
