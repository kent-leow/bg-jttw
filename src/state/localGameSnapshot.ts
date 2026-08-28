import type { RoleAssignment } from "../engine/types";
import type { RoundLoopState } from "../engine/roundLoop";

export interface LobbyPlayer {
  readonly id: string;
  readonly displayName: string;
}

export interface GameSnapshot {
  readonly roster: readonly LobbyPlayer[];
  readonly roleAssignments: readonly RoleAssignment[];
  readonly roundLoopState: RoundLoopState;
}

const STORAGE_KEY = "pass-and-play-game-snapshot";

/**
 * Reads the game snapshot from localStorage.
 * @returns The saved snapshot, or null if none exists or data is corrupt.
 */
export function readSnapshot(): GameSnapshot | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored) as unknown;
    // Basic validation that the structure looks like a GameSnapshot
    if (
      parsed &&
      typeof parsed === "object" &&
      "roster" in parsed &&
      "roleAssignments" in parsed &&
      "roundLoopState" in parsed
    ) {
      return parsed as GameSnapshot;
    }
    return null;
  } catch {
    // JSON parse error or other issue
    return null;
  }
}

/**
 * Writes a game snapshot to localStorage.
 */
export function writeSnapshot(snapshot: GameSnapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Silently fail if storage quota exceeded or other issue
  }
}

/**
 * Clears the saved game snapshot from localStorage.
 */
export function clearSnapshot(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}
