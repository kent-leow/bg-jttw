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
      className="portrait-chip"
      aria-pressed={selected}
      aria-label={displayName}
      data-leader={isLeader}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="portrait-chip__avatar" aria-hidden="true">
        {displayName.charAt(0).toUpperCase()}
      </span>
      <span className="portrait-chip__name">{displayName}</span>
    </button>
  );
}
