/**
 * Encodes/decodes an offer or answer payload for QR-code transport: JSON -> percent-encoded ->
 * base64, which safely round-trips non-ASCII characters through btoa/atob (both available in
 * browsers and jsdom).
 */
export function encodeQrPayload<T extends object>(payload: T): string {
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

export function decodeQrPayload<T extends object = Record<string, unknown>>(encoded: string): T {
  let json: string;
  try {
    json = decodeURIComponent(atob(encoded));
  } catch {
    throw new Error("Malformed QR payload: not valid base64.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Malformed QR payload: not valid JSON.");
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Malformed QR payload: expected a JSON object.");
  }
  return parsed as T;
}
