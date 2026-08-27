import { describe, expect, it } from "vitest";
import type { AnswerPayload } from "./generateJoinAnswer";
import type { OfferPayload } from "./generateHostOffer";
import { decodeQrPayload, encodeQrPayload } from "./qrCodec";

describe("qrCodec", () => {
  it("round-trips an offer payload without data loss", () => {
    const offer: OfferPayload = { type: "offer", sdp: "v=0\r\no=- 12345 2 IN IP4 127.0.0.1\r\n" };
    const decoded = decodeQrPayload<OfferPayload>(encodeQrPayload(offer));
    expect(decoded).toEqual(offer);
  });

  it("round-trips an answer payload without data loss", () => {
    const answer: AnswerPayload = { type: "answer", sdp: "v=0\r\no=- 67890 2 IN IP4 127.0.0.1\r\n" };
    const decoded = decodeQrPayload<AnswerPayload>(encodeQrPayload(answer));
    expect(decoded).toEqual(answer);
  });

  it("round-trips non-ASCII text within the payload", () => {
    const payload = { type: "offer" as const, sdp: "sdp", displayName: "西游记玩家" };
    expect(decodeQrPayload(encodeQrPayload(payload))).toEqual(payload);
  });

  it("rejects malformed scanned input with an explicit error", () => {
    expect(() => decodeQrPayload("not-valid-base64-!!!")).toThrow(/malformed qr payload/i);
    expect(() => decodeQrPayload(btoa("not json"))).toThrow(/malformed qr payload/i);
    expect(() => decodeQrPayload(btoa(JSON.stringify("a string, not an object")))).toThrow(
      /malformed qr payload/i,
    );
  });
});
