# Task 003 — Single-Device Roster Setup (Names & Optional Photos)

## Goal
One person, on one device, can pick a player count (5–10) and enter every player's display name plus an optional camera-captured photo, ending on a reviewable roster before starting the game.

## Prerequisites
- [ ] task-001.md completed

## Tasks

### Photo Capture
- [ ] `src/pages/components/PhotoCapture.tsx` (new) — button that requests the camera only on explicit tap (mirrors the existing camera-gating pattern from the removed `QrScanner`), shows a live preview, and lets the user snap or skip; returns the captured image as a data URL via an `onCapture` callback
  - [ ] `src/pages/components/PhotoCapture.spec.tsx` (new) — camera is not requested on mount; requested only after the enable-camera tap; `onCapture` fires with a data URL after snapping; "skip" proceeds without one

### Player Portrait Update
- [ ] `src/pages/components/PlayerPortraitChip.tsx` — add optional `photoUrl` prop; renders the photo in place of the initial-letter avatar when present
  - [ ] `src/pages/components/PlayerPortraitChip.spec.tsx` — renders photo image when `photoUrl` is provided; falls back to initial-letter avatar when absent

### Setup Page
- [ ] `src/pages/HostSetupPage.tsx` — repurpose into the single-device roster setup: choose player count, then step through one name-entry (+ optional `PhotoCapture`) form per seat, then a final roster review screen (reusing the existing `LobbyPage` player-row rendering) before enabling "Start Game" (new/modified, no QR/host-offer wiring)
  - [ ] `src/pages/HostSetupPage.spec.tsx` — entering all names enables review; review lists every entered name/photo; "Start Game" only enabled once every seat has a name; a seat can be entered without a photo

### Landing Simplification
- [ ] `src/pages/LandingPage.tsx` — single "Start Game" action replaces the separate Host/Join choice (modified)
  - [ ] `src/pages/LandingPage.spec.tsx` — renders one "Start Game" action; no "Join" action present

## Done When
- [ ] A full 5–10 player roster (names, with or without photos) can be entered and reviewed on one device with no networking involved
- [ ] All new/modified tests pass
- [ ] No existing tests broken
