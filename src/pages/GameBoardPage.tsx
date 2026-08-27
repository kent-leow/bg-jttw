import { useState } from "react";
import { validateTeamProposal } from "../engine/teamProposal";
import type { Vote } from "../engine/voteResolution";
import { useTranslation } from "../i18n";
import { JourneyPathScene } from "../theme/scenes/journeyPathScene";
import type { LobbyPlayer } from "./LobbyPage";
import { PlayerPortraitChip } from "./components/PlayerPortraitChip";

export interface GameBoardPageProps {
  readonly players: readonly LobbyPlayer[];
  readonly leaderId: string;
  readonly requiredTeamSize: number;
  readonly isHost: boolean;
  readonly isLeader: boolean;
  readonly votes: Readonly<Record<string, Vote>>;
  readonly resolvedMissionCount?: number;
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
  resolvedMissionCount = 0,
  onProposeTeam,
  onCastVote,
  onNext,
}: GameBoardPageProps) {
  const [selectedTeam, setSelectedTeam] = useState<readonly string[]>([]);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const { t } = useTranslation();

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
    <section className="page page--centered">
      <h1>{t("gameBoard.title")}</h1>
      <JourneyPathScene resolvedMissionCount={resolvedMissionCount} />
      <ul aria-label="Players" className="player-row">
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
        <div className="scroll-card">
          <button type="button" className="btn btn--primary" onClick={submitProposal}>
            {t("common.proposeTeam")}
          </button>
          {proposalError && <p role="alert" className="alert-text">{proposalError}</p>}
        </div>
      )}
      <div className="scroll-card">
        <button type="button" className="btn btn--approve" disabled={hasVoted} onClick={() => castVote("Approve")}>
          {t("common.approve")}
        </button>
        <button type="button" className="btn btn--reject" disabled={hasVoted} onClick={() => castVote("Reject")}>
          {t("common.reject")}
        </button>
      </div>
      {isHost && (
        <>
          <p data-testid="vote-progress" className="seat-counter">
            {t("gameBoard.voteProgress", { voted: votedCount, total: players.length })}
          </p>
          <button type="button" className="btn btn--secondary" disabled={!allVoted} onClick={onNext}>
            {t("common.next")}
          </button>
        </>
      )}
    </section>
  );
}
