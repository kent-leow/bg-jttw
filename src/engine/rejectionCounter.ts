const HAMMER_REJECTION_COUNT = 5;

export interface RejectionOutcome {
  readonly rejectionCount: number;
  /** True when this rejection is the 5th consecutive one — evil wins immediately. */
  readonly hammer: boolean;
}

export function applyProposalVoteOutcome(currentRejectionCount: number, passed: boolean): RejectionOutcome {
  if (passed) {
    return { rejectionCount: 0, hammer: false };
  }
  const rejectionCount = currentRejectionCount + 1;
  return { rejectionCount, hammer: rejectionCount >= HAMMER_REJECTION_COUNT };
}
