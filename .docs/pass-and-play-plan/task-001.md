# Task 001 — Remove Multi-Device Connection Layer

## Goal
The WebRTC/QR/encryption stack and every page/component/dependency that existed only to support it is fully removed, leaving a clean base for the single-device pass-and-play rework, with no broken imports and the existing test suite still green for everything untouched.

## Prerequisites
- [ ] None

## Tasks

### Connection & Crypto Removal
- [ ] `src/connection/` — delete entire folder (`completeConnection.ts`, `dataChannelTransport.ts`, `endSession.ts`, `generateHostOffer.ts`, `generateJoinAnswer.ts`, `hostOrchestrator.ts`, `playerListBroadcast.ts`, `qrCodec.ts`, `reestablishConnection.ts`, `roomHub.ts`, `sdpCompaction.ts`, and their `.spec.ts` files)
- [ ] `src/crypto/` — delete entire folder (`decryptOwnPayload.ts`, `encryptForPlayer.ts`, `keyPair.ts`, and their `.spec.ts` files)

### Dependent Pages & Components Removal
- [ ] `src/pages/JoinPage.tsx` — delete (`.spec.tsx` too)
- [ ] `src/pages/components/QrDisplay.tsx` — delete (`.spec.tsx` too)
- [ ] `src/pages/components/QrScanner.tsx` — delete (`.spec.tsx` too)
- [ ] `src/pages/AppRoot.tsx` — delete (`.spec.tsx` too); replaced in task 002
- [ ] `src/state/localIdentity.ts` — delete (`.spec.ts` too); replaced in task 002

### Dependency Cleanup
- [ ] `package.json` — remove `jsqr`, `qrcode`, `@types/qrcode` (dependency and devDependency entries no longer used by anything)
- [ ] `README.md` — update `src/connection/` and `src/crypto/` bullet points in the Structure section to describe the new single-device model (finalized in task 010 once the new structure exists; for this task, just remove references to deleted folders)

## Done When
- [ ] `npm install` completes cleanly with the removed dependencies gone from the lockfile
- [ ] `npm run lint` and `tsc -b` report no errors from dangling imports of deleted modules
- [ ] All new/modified tests pass
- [ ] No existing tests broken (aside from those deleted alongside their now-removed source files)
