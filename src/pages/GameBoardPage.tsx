import { useState } from "react";
import { validateTeamProposal } from "../engine/teamProposal";
import type { Vote } from "../engine/voteResolution";
import type { LobbyPlayer } from "./LobbyPage";
import { PlayerPortraitChip } from "./components/PlayerPortraitChip";

export interface GameBoardPageProps {
  readonly players: readonly LobbyPlayer[];
  readonly leaderId: string;
  readonly requiredTeamSize: number;
  readonly isHost: boolean;
  readonly isLeader: boolean;
  readonly votes: Readonly<Record<string, Vote>>;
  readonly onProposeTeam?: (team: readonly string[]) => void;
  readonly onCastVote?: (vote: Vote) => void;
  readonly onNext?: () => void;
}

export function GameBoardPage({
  players,
  leaderId,
  requiredTeamSize,
  isHost,
  isLeader,
  votes,
  onProposeTeam,
  onCastVote,
  onNext,
}: GameBoardPageProps) {
  const [selectedTeam, setSelectedTeam] = useState<readonly string[]>([]);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  function toggleSelect(playerId: string) {
    setSelectedTeam((current) =>
      current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId],
    );
  }

  function submitProposal() {
    const validation = validateTeamProposal(selectedTeam, requiredTeamSize);
    if (!validation.valid) {
      setProposalError(validation.reason ?? "Invalid team selection.");
      return;
    }
    setProposalError(null);
    onProposeTeam?.(selectedTeam);
  }

  function castVote(vote: Vote) {
    setHasVoted(true);
    onCastVote?.(vote);
  }

  const votedCount = Object.keys(votes).length;
  const allVoted = votedCount === players.length;

  return (
    <section>
      <h1>Main Game Board</h1>
      <ul aria-label="Players">
        {players.map((player) => (
          <li key={player.id}>
            <PlayerPortraitChip
              displayName={player.displayName}
              isLeader={player.id === leaderId}
              selected={selectedTeam.includes(player.id)}
              disabled={!isLeader}
              onClick={() => toggleSelect(player.id)}
            />
          </li>
        ))}
      </ul>
      {isLeader && (
        <div>
          <button type="button" onClick={submitProposal}>
            Propose Team
          </button>
          {proposalError && <p role="alert">{proposalError}</p>}
        </div>
      )}
      <div>
        <button type="button" disabled={hasVoted} onClick={() => castVote("Approve")}>
          Approve
        </button>
        <button type="button" disabled={hasVoted} onClick={() => castVote("Reject")}>
          Reject
        </button>
      </div>
      {isHost && (
        <>
          <p data-testid="vote-progress">{`${votedCount}/${players.length} voted`}</p>
          <button type="button" disabled={!allVoted} onClick={onNext}>
            Next
          </button>
        </>
      )}
    </section>
  );
}
