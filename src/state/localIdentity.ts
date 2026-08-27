export interface LocalIdentity {
  readonly playerId: string;
  readonly roomId: string;
  readonly lastKnownState: unknown;
}

const STORAGE_KEY = "jttw:local-identity";

export function readLocalIdentity(): LocalIdentity | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as LocalIdentity;
  } catch {
    return null;
  }
}

export function writeLocalIdentity(identity: LocalIdentity): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}

export function clearLocalIdentity(): void {
  localStorage.removeItem(STORAGE_KEY);
}
