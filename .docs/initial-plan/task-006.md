# Task 006 — Host Setup & Join Pages (AC1, AC2)

## Goal
A host can set the player count and see a live join QR code with seat counter (AC1); a joining player can scan it, get a reply QR code, and appear in the host's player list once scanned back (AC2).

## Prerequisites
- [x] task-004.md completed

## Tasks

### Pages
- [x] `src/pages/HostSetupPage.<ext>` — player-count selector (5–10); displays `generateHostOffer()` output as a QR code; shows live "x/y joined" seat counter per [design.md](design.md) §2 (new)
  - [x] `src/pages/HostSetupPage.spec.<ext>` — renders QR only after a player count is chosen; seat counter updates as players join; "Start Game" stays disabled until seats are filled
- [x] `src/pages/JoinPage.<ext>` — camera/QR-scan viewport; on scan, calls `generateJoinAnswer()` and displays the reply QR code; shows a confirmation animation once the host scans back per [design.md](design.md) §3 (new)
  - [x] `src/pages/JoinPage.spec.<ext>` — invalid/malformed scanned offer shows an explicit error state, not a silent failure; successful scan renders the reply QR

### Shared UI
- [x] `src/pages/components/QrDisplay.<ext>` — renders a payload string as a scannable QR code (new)
  - [x] `src/pages/components/QrDisplay.spec.<ext>` — renders a QR image for a given payload string
- [x] `src/pages/components/QrScanner.<ext>` — wraps camera access and decodes a scanned QR into a string payload (new)
  - [x] `src/pages/components/QrScanner.spec.<ext>` — emits decoded payload on successful scan; emits an explicit error on camera-permission denial

## Done When
- [x] A host can generate a join QR and see the seat counter increment as each joiner's answer QR is scanned back
- [x] All new/modified tests pass
- [x] No existing tests broken
