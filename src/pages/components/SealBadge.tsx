export type SealBadgeVariant = "host" | "good" | "evil";

const SEAL_LABELS: Readonly<Record<SealBadgeVariant, string>> = {
  host: "Host",
  good: "Lotus Seal",
  evil: "Demon-Mask Seal",
};

export interface SealBadgeProps {
  readonly variant: SealBadgeVariant;
}

/** Red seal/stamp badge — used as the host marker and the win-side marker on the reveal screen. */
export function SealBadge({ variant }: SealBadgeProps) {
  return (
    <span data-testid={`seal-badge-${variant}`} role="img" aria-label={SEAL_LABELS[variant]}>
      {SEAL_LABELS[variant]}
    </span>
  );
}
