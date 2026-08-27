/**
 * Encodes/decodes an offer or answer payload for QR-code transport: JSON -> UTF-8 bytes -> gzip
 * -> base64. A real WebRTC SDP offer/answer is large and highly repetitive (near-identical
 * "a=candidate" lines), which gzip compresses well; QR codes have a hard data-capacity limit,
 * and a smaller payload means fewer QR modules, which is what actually makes a code scannable by
 * a phone camera at a normal distance. Falls back to plain (uncompressed) base64 if the
 * CompressionStream/DecompressionStream APIs are unavailable, prefixed with a one-byte flag so
 * either form can always be decoded.
 */
const GZIP_FLAG = "1";
const RAW_FLAG = "0";

function hasCompressionStreams(): boolean {
  return typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64(encoded: string): Uint8Array {
  const binary = atob(encoded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function toReadableStream(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

async function gzip(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = toReadableStream(bytes).pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = toReadableStream(bytes).pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function encodeQrPayload<T extends object>(payload: T): Promise<string> {
  const jsonBytes = new TextEncoder().encode(JSON.stringify(payload));
  if (hasCompressionStreams()) {
    const compressed = await gzip(jsonBytes);
    return `${GZIP_FLAG}${toBase64(compressed)}`;
  }
  return `${RAW_FLAG}${toBase64(jsonBytes)}`;
}

export async function decodeQrPayload<T extends object = Record<string, unknown>>(encoded: string): Promise<T> {
  const flag = encoded.charAt(0);
  const body = encoded.slice(1);
  let json: string;
  try {
    const bytes = fromBase64(body);
    const jsonBytes = flag === GZIP_FLAG ? await gunzip(bytes) : bytes;
    json = new TextDecoder().decode(jsonBytes);
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

