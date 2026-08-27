import type { ReactNode } from "react";

export interface ScrollCardProps {
  readonly children: ReactNode;
}

/** Base scroll/parchment panel container, reused as the shape for buttons, lists, and dialogs. */
export function ScrollCard({ children }: ScrollCardProps) {
  return (
    <div className="scroll-card" data-testid="scroll-card">
      {children}
    </div>
  );
}
