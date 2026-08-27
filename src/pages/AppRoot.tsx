import { useEffect, useState, type ReactElement } from "react";
import { readLocalIdentity as defaultReadLocalIdentity, type LocalIdentity } from "../state/localIdentity";
import { reestablishConnection, type HostReachabilityCheck } from "../connection/reestablishConnection";

type AppRootStatus = "checking" | "new" | "restored" | "failed";

export interface AppRootProps {
  readonly renderNewPlayerEntry: () => ReactElement;
  readonly renderRestoredState: (currentState: unknown) => ReactElement;
  readonly readLocalIdentity?: () => LocalIdentity | null;
  readonly checkHostReachable?: HostReachabilityCheck;
}

export function AppRoot({
  renderNewPlayerEntry,
  renderRestoredState,
  readLocalIdentity = defaultReadLocalIdentity,
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
      setFailureMessage("host unreachable, cannot resume without a backend");
      return;
    }
    reestablishConnection(identity.roomId, identity.playerId, checkHostReachable).then((result) => {
      if (result.reconnected) {
        setStatus("restored");
        setCurrentState(result.currentState);
      } else {
        setStatus("failed");
        setFailureMessage(result.message ?? "host unreachable, cannot resume without a backend");
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
  return <p role="alert">{failureMessage}</p>;
}
