export type Vote = "Approve" | "Reject";

export interface VoteResolution {
  readonly approveCount: number;
  readonly rejectCount: number;
  /** A tie counts as Reject. */
  readonly passed: boolean;
}

export function resolveVotes(votes: Readonly<Record<string, Vote>>): VoteResolution {
  const values = Object.values(votes);
  const approveCount = values.filter((v) => v === "Approve").length;
  const rejectCount = values.filter((v) => v === "Reject").length;
  return { approveCount, rejectCount, passed: approveCount > rejectCount };
}
