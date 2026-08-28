import { useState } from "react";
import type { Vote } from "../../engine/voteResolution";
import { resolveVotes } from "../../engine/voteResolution";
import { useTranslation } from "../../i18n";
import type { LobbyPlayer } from "../LobbyPage";
import { PassDeviceGate } from "./PassDeviceGate";
import { ScrollCard } from "./ScrollCard";

export interface VotingSequenceProps {
  readonly players: readonly LobbyPlayer[];
  readonly onAllVotesCast: (votes: Readonly<Record<string, Vote>>) => void;
}

/**
 * VotingSequence: steps through each player in the roster, asking them to vote
 * Approve/Reject via PassDeviceGate. Once all votes are collected, displays them
 * together and calls onAllVotesCast.
 */
export function VotingSequence({
  players,
  onAllVotesCast,
}: VotingSequenceProps) {
  const [votes, setVotes] = useState<Readonly<Record<string, Vote>>>({});
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [allVotesCast, setAllVotesCast] = useState(false);
  const { t } = useTranslation();

  const currentPlayer = players[currentPlayerIndex];
  const hasCurrentPlayerVoted = currentPlayer && votes[currentPlayer.id] !== undefined;

  const handleVote = (playerId: string, vote: Vote) => {
    const newVotes = { ...votes, [playerId]: vote };
    setVotes(newVotes);

    // Check if all players have voted
    if (Object.keys(newVotes).length === players.length) {
      setAllVotesCast(true);
      onAllVotesCast(newVotes);
    }
  };

  const handlePlayerHidden = () => {
    // Move to next player (their vote is already recorded)
    setCurrentPlayerIndex((prev) => prev + 1);
  };

  // All votes collected - show results
  if (allVotesCast) {
    const resolution = resolveVotes(votes);
    return (
      <ScrollCard>
        <div data-testid="vote-results">
          <h2>{t("gameBoard.voteResults")}</h2>
          <div className="vote-summary">
            <p>
              {t("gameBoard.approveCount", { count: resolution.approveCount })}
            </p>
            <p>
              {t("gameBoard.rejectCount", { count: resolution.rejectCount })}
            </p>
            <p data-testid="vote-outcome">
              {resolution.passed
                ? t("gameBoard.teamApproved")
                : t("gameBoard.teamRejected")}
            </p>
          </div>
          <div className="vote-list">
            {players.map((player) => (
              <div key={player.id} className="vote-item">
                <span>{player.displayName}:</span>
                <span className={`vote-${votes[player.id]?.toLowerCase()}`}>
                  {votes[player.id]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </ScrollCard>
    );
  }

  // Show voting for current player
  if (!currentPlayer || currentPlayerIndex >= players.length) {
    return null; // Should not happen if onAllVotesCast is called properly
  }

  return (
    <PassDeviceGate
      key={currentPlayerIndex}
      holderName={currentPlayer.displayName}
      onHidden={handlePlayerHidden}
    >
      <div data-testid={`vote-panel-${currentPlayer.id}`}>
        <h2>
          {t("gameBoard.yourVote", {
            playerName: currentPlayer.displayName,
          })}
        </h2>
        {hasCurrentPlayerVoted ? (
          <div data-testid="vote-submitted">
            <p>
              {t("gameBoard.yourVoteIs", {
                vote: currentPlayer && votes[currentPlayer.id],
              })}
            </p>
            <p>{t("gameBoard.tapHideWhenReady")}</p>
          </div>
        ) : (
          <div className="vote-buttons">
            <button
              type="button"
              className="btn btn--approve"
              onClick={() => handleVote(currentPlayer.id, "Approve")}
              data-testid={`vote-approve-${currentPlayer.id}`}
            >
              {t("common.approve")}
            </button>
            <button
              type="button"
              className="btn btn--reject"
              onClick={() => handleVote(currentPlayer.id, "Reject")}
              data-testid={`vote-reject-${currentPlayer.id}`}
            >
              {t("common.reject")}
            </button>
          </div>
        )}
      </div>
    </PassDeviceGate>
  );
}
