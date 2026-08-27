import { useEffect, useState, type ReactNode } from "react";

export interface InkSplashTransitionProps {
  readonly durationMs?: number;
  readonly children: ReactNode;
}

/** Ink-diffusion reveal/transition wrapper: delays revealing its children until the transition completes. */
export function InkSplashTransition({ durationMs = 400, children }: InkSplashTransitionProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), durationMs);
    return () => clearTimeout(timer);
  }, [durationMs]);

  return (
    <div data-testid="ink-splash-transition" data-revealed={revealed}>
      {revealed ? children : null}
    </div>
  );
}
