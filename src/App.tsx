import { useState } from "react";
import { LandingPage } from "./pages/LandingPage";
import { HostSetupPage, type RosterPlayer } from "./pages/HostSetupPage";

type AppScreen = "landing" | "setup";

/**
 * App.tsx: Main application shell for the single-device pass-and-play game.
 */
export function App() {
  const [screen, setScreen] = useState<AppScreen>("landing");
  const [roster, setRoster] = useState<readonly RosterPlayer[]>([]);

  const handleStartGame = () => {
    setScreen("setup");
  };

  const handleRosterSetup = (setupRoster: readonly RosterPlayer[]) => {
    setRoster(setupRoster);
    // TODO: Transition to game board / role assignment when implemented
    console.log("Game started with roster:", setupRoster);
  };

  const handleBackToLanding = () => {
    setScreen("landing");
    setRoster([]);
  };

  return (
    <>
      {screen === "landing" && <LandingPage onStartGame={handleStartGame} />}
      {screen === "setup" && (
        <HostSetupPage
          onStartGame={handleRosterSetup}
          onBack={handleBackToLanding}
        />
      )}
    </>
  );
}
