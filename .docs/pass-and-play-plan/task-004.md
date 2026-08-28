# Task 004 — Pass-Device Privacy Gate

## Goal
A single reusable component enforces the "pass to `<player>`, confirm, reveal, hide" pattern used by every private-info moment (role reveal, recheck-my-role, voting, mission cards, assassination), so no secret is shown until the intended player explicitly confirms they're holding the device, and it's hidden again before continuing.

## Prerequisites
- [ ] task-001.md completed

## Tasks

### Gate Component
- [ ] `src/pages/components/PassDeviceGate.tsx` (new) — props: `holderName` (nullable, for the generic Assassin case), `children` (the secret content to reveal), `onHidden` callback; renders a "Pass to `<holderName>`, tap when ready" interstitial by default, reveals `children` only after the confirm tap, and shows a "Hide & Continue" action that calls `onHidden` and returns to the interstitial state
  - [ ] `src/pages/components/PassDeviceGate.spec.tsx` (new) — secret content is not present in the DOM before confirm; appears only after the confirm tap; "Hide & Continue" removes it from the DOM again and fires `onHidden`; renders a generic instruction (no name) when `holderName` is `null`

## Done When
- [ ] The gate can wrap arbitrary secret content and is verified to never render it before the confirm tap
- [ ] All new/modified tests pass
- [ ] No existing tests broken
