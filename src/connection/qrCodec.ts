/**
 * Encodes/decodes an offer or answer payload for QR-code transport: JSON -> UTF-8 bytes -> base64.
 * A real WebRTC SDP offer/answer is large (ICE candidates, fingerprints), and QR codes have a
 * hard data-capacity limit, so this avoids percent-encoding (which triples the size of every
 * colon/plus/equals in the SDP) in favor of encoding raw UTF-8 bytes directly — base64's fixed
 * 4/3 expansion is the only overhead, while still round-tripping non-ASCII text losslessly.
 */
export function encodeQrPayload<T extends object>(payload: T): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function decodeQrPayload<T extends object = Record<string, unknown>>(encoded: string): T {
  let json: string;
  try {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    json = new TextDecoder().decode(bytes);
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
