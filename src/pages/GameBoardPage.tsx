import { useState } from "react";
import { validateTeamProposal } from "../engine/teamProposal";
import type { Vote } from "../engine/voteResolution";
import { resolveVotes } from "../engine/voteResolution";
import { resolveMission } from "../engine/missionResolution";
import type { MissionCard } from "../engine/missionResolution";
import { useTranslation } from "../i18n";
import { JourneyPathScene } from "../theme/scenes/journeyPathScene";
import type { LobbyPlayer } from "./LobbyPage";
import { PlayerPortraitChip } from "./components/PlayerPortraitChip";
import { VotingSequence } from "./components/VotingSequence";
import { MissionCardSequence } from "./components/MissionCardSequence";
import { ScrollCard } from "./components/ScrollCard";
import { MissionResultPage } from "./MissionResultPage";

export interface GameBoardPageProps {
  readonly players: readonly LobbyPlayer[];
  readonly leaderId: string;
  readonly requiredTeamSize: number;
  readonly failThreshold: number;
  readonly isHost: boolean;
  readonly isLeader: boolean;
  readonly resolvedMissionCount?: number;
  readonly onProposeTeam?: (team: readonly string[]) => void;
  readonly onAllVotesCast?: (votes: Readonly<Record<string, Vote>>) => void;
  readonly onMissionResult?: (result: "Success" | "Fail") => void;
  readonly onNext?: () => void;
}

export function GameBoardPage({
  players,
  leaderId,
  requiredTeamSize,
  failThreshold,
  isLeader,
  isHost,
  resolvedMissionCount = 0,
  onProposeTeam,
  onAllVotesCast,
  onMissionResult,
  onNext,
}: GameBoardPageProps) {
  const [selectedTeam, setSelectedTeam] = useState<readonly string[]>([]);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [teamProposed, setTeamProposed] = useState(false);
  const [votesCollected, setVotesCollected] = useState<Readonly<Record<string, Vote>> | null>(null);
  const [missionResult, setMissionResult] = useState<"Success" | "Fail" | null>(null);
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
    setTeamProposed(true);
    onProposeTeam?.(selectedTeam);
  }

  function handleAllVotesCast(votes: Readonly<Record<string, Vote>>) {
    setVotesCollected(votes);
    onAllVotesCast?.(votes);
  }

  function handleAllCardsSubmitted(cards: Readonly<Record<string, MissionCard>>) {
    // Convert selectedTeam (player IDs) to card array in correct order
    const orderedCards = selectedTeam.map((playerId) => cards[playerId]!);
    const { result } = resolveMission(orderedCards, failThreshold);
    setMissionResult(result);
    onMissionResult?.(result);
  }

  // Show team proposal phase
  if (!teamProposed) {
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
          <ScrollCard>
            <button type="button" className="btn btn--primary" onClick={submitProposal}>
              {t("common.proposeTeam")}
            </button>
            {proposalError && <p role="alert" className="alert-text">{proposalError}</p>}
          </ScrollCard>
        )}
      </section>
    );
  }

  // Show voting sequence phase
  if (!votesCollected) {
    return (
      <section className="page page--centered">
        <h1>{t("gameBoard.title")}</h1>
        <VotingSequence players={players} onAllVotesCast={handleAllVotesCast} />
      </section>
    );
  }

  // Check if vote passed
  const voteResolution = resolveVotes(votesCollected);
  const votePassed = voteResolution.passed;

  // If vote didn't pass, show result and next button
  if (!votePassed) {
    return (
      <section className="page page--centered">
        <h1>{t("gameBoard.title")}</h1>
        <JourneyPathScene resolvedMissionCount={resolvedMissionCount} />
        <ScrollCard>
          <p data-testid="vote-rejected">{t("gameBoard.teamRejected")}</p>
          {isHost && (
            <button type="button" className="btn btn--secondary" onClick={onNext}>
              {t("common.next")}
            </button>
          )}
        </ScrollCard>
      </section>
    );
  }

  // Vote passed - show mission card collection phase
  if (missionResult === null) {
    const approvedTeam = selectedTeam
      .map((playerId) => players.find((p) => p.id === playerId))
      .filter((p): p is LobbyPlayer => p !== undefined);

    return (
      <section className="page page--centered">
        <h1>{t("gameBoard.title")}</h1>
        <MissionCardSequence
          approvedTeam={approvedTeam}
          onAllCardsSubmitted={handleAllCardsSubmitted}
        />
      </section>
    );
  }

  // Mission result phase
  return (
    <section className="page page--centered">
      <h1>{t("gameBoard.title")}</h1>
      <MissionResultPage result={missionResult} />
      {isHost && (
        <ScrollCard>
          <button type="button" className="btn btn--secondary" onClick={onNext}>
            {t("common.next")}
          </button>
        </ScrollCard>
      )}
    </section>
  );
}
