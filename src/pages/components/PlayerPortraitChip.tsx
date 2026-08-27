export interface PlayerPortraitChipProps {
  readonly displayName: string;
  readonly selected?: boolean;
  readonly isLeader?: boolean;
  readonly disabled?: boolean;
  readonly onClick?: () => void;
}

export function PlayerPortraitChip({
  displayName,
  selected = false,
  isLeader = false,
  disabled = false,
  onClick,
}: PlayerPortraitChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={displayName}
      data-leader={isLeader}
      disabled={disabled}
      onClick={onClick}
    >
      {displayName}
    </button>
  );
}
