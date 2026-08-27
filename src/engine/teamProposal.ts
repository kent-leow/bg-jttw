export interface TeamProposalValidation {
  readonly valid: boolean;
  readonly reason?: string;
}

export function validateTeamProposal(
  proposedPlayerIds: readonly string[],
  requiredSize: number,
): TeamProposalValidation {
  const uniqueCount = new Set(proposedPlayerIds).size;
  if (uniqueCount !== proposedPlayerIds.length) {
    return { valid: false, reason: "Team proposal contains duplicate players." };
  }
  if (proposedPlayerIds.length !== requiredSize) {
    return {
      valid: false,
      reason: `Team must have exactly ${requiredSize} players, got ${proposedPlayerIds.length}.`,
    };
  }
  return { valid: true };
}
