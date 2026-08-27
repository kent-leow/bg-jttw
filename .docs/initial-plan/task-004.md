# Task 004 — P2P Connection Layer: QR Offer/Answer Handshake

## Goal
A host device can generate a join offer as a QR code, and a joining device can scan it, generate a reply QR code, and have the host scan it back to establish a direct WebRTC connection — with no backend server involved (AC2).

## Prerequisites
- [x] task-001.md completed

## Tasks

### Connection Service — Offer/Answer
- [x] `src/connection/generateHostOffer.ts` — creates a WebRTC connection offer for a new joining player per [gameplay.md](gameplay.md) Flow 1 step 3 (new)
  - [x] `src/connection/generateHostOffer.spec.ts` — produces a serializable offer payload with no external server call
- [x] `src/connection/generateJoinAnswer.ts` — consumes a scanned host offer and produces a reply answer payload per Flow 2 step 1.2 (new)
  - [x] `src/connection/generateJoinAnswer.spec.ts` — valid offer produces a serializable answer; malformed offer is rejected with an explicit error
- [x] `src/connection/completeConnection.ts` — consumes a scanned joiner answer and completes the WebRTC connection per Flow 2 step 1.5 (new)
  - [x] `src/connection/completeConnection.spec.ts` — valid answer completes the connection; invalid/expired answer returns `connectionEstablished == false`

### QR Encode/Decode
- [x] `src/connection/qrCodec.ts` — encodes an offer/answer payload to a QR-renderable string and decodes a scanned string back to a payload (new)
  - [x] `src/connection/qrCodec.spec.ts` — round-trips offer and answer payloads without data loss; rejects malformed scanned input with an explicit error

## Done When
- [x] Two browser contexts (simulated in tests) can complete a full offer → QR → answer → QR → connect handshake without any network/backend call
- [x] All new/modified tests pass
- [x] No existing tests broken
