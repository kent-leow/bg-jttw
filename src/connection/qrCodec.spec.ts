import { describe, expect, it } from "vitest";
import type { AnswerPayload } from "./generateJoinAnswer";
import type { OfferPayload } from "./generateHostOffer";
import { decodeQrPayload, encodeQrPayload } from "./qrCodec";

describe("qrCodec", () => {
  it("round-trips an offer payload without data loss", async () => {
    const offer: OfferPayload = { type: "offer", sdp: "v=0\r\no=- 12345 2 IN IP4 127.0.0.1\r\n" };
    const decoded = await decodeQrPayload<OfferPayload>(await encodeQrPayload(offer));
    expect(decoded).toEqual(offer);
  });

  it("round-trips an answer payload without data loss", async () => {
    const answer: AnswerPayload = { type: "answer", sdp: "v=0\r\no=- 67890 2 IN IP4 127.0.0.1\r\n" };
    const decoded = await decodeQrPayload<AnswerPayload>(await encodeQrPayload(answer));
    expect(decoded).toEqual(answer);
  });

  it("round-trips non-ASCII text within the payload", async () => {
    const payload = { type: "offer" as const, sdp: "sdp", displayName: "西游记玩家" };
    expect(await decodeQrPayload(await encodeQrPayload(payload))).toEqual(payload);
  });

  it("compresses a large, repetitive SDP-like payload smaller than an uncompressed encoding would be", async () => {
    const repetitiveCandidateLines = Array.from(
      { length: 40 },
      (_, i) => `a=candidate:${i} 1 udp 2122260223 192.168.1.${i} 5432${i} typ host generation 0`,
    ).join("\r\n");
    const payload = { type: "offer" as const, sdp: repetitiveCandidateLines };
    const uncompressedBaseline = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));

    const encoded = await encodeQrPayload(payload);

    expect(encoded.length).toBeLessThan(uncompressedBaseline.length);
    expect(await decodeQrPayload(encoded)).toEqual(payload);
  });

  it("rejects malformed scanned input with an explicit error", async () => {
    await expect(decodeQrPayload("not-valid-base64-!!!")).rejects.toThrow(/malformed qr payload/i);
    await expect(decodeQrPayload(`0${btoa("not json")}`)).rejects.toThrow(/malformed qr payload/i);
    await expect(
      decodeQrPayload(`0${btoa(JSON.stringify("a string, not an object"))}`),
    ).rejects.toThrow(/malformed qr payload/i);
  });
});

