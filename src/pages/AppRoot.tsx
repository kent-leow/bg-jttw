import { useEffect, useState } from "react";
import { readSnapshot, type GameSnapshot } from "../state/localGameSnapshot";
import { useTranslation } from "../i18n";

export interface AppRootProps {
  readonly onNewSetup?: () => void;
  readonly onResumedGame?: (snapshot: GameSnapshot) => void;
}

/**
 * Renders the initial setup flow for a new game (landing page, host setup, etc.).
 * This is a placeholder that will be filled in by the integration layer.
 */
function renderNewSetup(): React.ReactNode {
  // For now, return a simple placeholder
  // The App.tsx will handle routing to the actual setup pages
  return <div>{/* New game setup flow */}</div>;
}

/**
 * Renders the game resumed from a snapshot, continuing from where it left off.
 * This is a placeholder that will be filled in by the integration layer.
 */
function renderResumedGame(snapshot: GameSnapshot): React.ReactNode {
  // For now, return a simple placeholder
  // The App.tsx will handle routing to the appropriate game page based on snapshot.roundLoopState.phase
  return <div>{/* Resume game from snapshot: {JSON.stringify(snapshot, null, 2)} */}</div>;
}

/**
 * AppRoot is the main entry point that handles resume logic:
 * - On mount, checks if a game snapshot exists in localStorage
 * - If none exists, renders the new game setup flow
 * - If one exists, renders the resumed game flow
 */
export function AppRoot({ onNewSetup, onResumedGame }: AppRootProps) {
  const [snapshot, setSnapshot] = useState<GameSnapshot | null | undefined>(undefined);
  const { t } = useTranslation();

  useEffect(() => {
    // Read snapshot on mount
    const loadedSnapshot = readSnapshot();
    setSnapshot(loadedSnapshot);

    // Notify parent of which flow was chosen
    if (loadedSnapshot) {
      onResumedGame?.(loadedSnapshot);
    } else {
      onNewSetup?.();
    }
  }, [onNewSetup, onResumedGame]);

  // Still loading
  if (snapshot === undefined) {
    return null;
  }

  // No snapshot - start new game
  if (snapshot === null) {
    return renderNewSetup();
  }

  // Snapshot exists - resume game
  return renderResumedGame(snapshot);
}
