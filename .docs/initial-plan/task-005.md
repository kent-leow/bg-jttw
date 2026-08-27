# Task 005 — P2P Connection Layer: Game-State Relay & Encrypted Secret Delivery

## Goal
Once connected, the host can broadcast public game-state updates to all players and relay per-player encrypted secret data (e.g., roles) that only the intended player's device can decrypt, satisfying AC3.

## Prerequisites
- [x] task-004.md completed
- [x] task-002.md completed

## Tasks

### Encryption
- [x] `src/crypto/keyPair.ts` — generates a per-player asymmetric key pair on that player's own device (new)
  - [x] `src/crypto/keyPair.spec.ts` — generates a usable key pair; private key never leaves the module's return value (i.e., not logged/serialized elsewhere)
- [x] `src/crypto/encryptForPlayer.ts` — encrypts a payload (e.g., role + hidden knowledge) using the target player's public key (new)
  - [x] `src/crypto/encryptForPlayer.spec.ts` — ciphertext is undecryptable without the matching private key
- [x] `src/crypto/decryptOwnPayload.ts` — decrypts a payload using the local device's own private key (new)
  - [x] `src/crypto/decryptOwnPayload.spec.ts` — decrypts a payload encrypted for this key pair; throws an explicit error for a payload encrypted for a different key pair

### Relay / Broadcast
- [x] `src/connection/roomHub.ts` — host-hub message relay: broadcasts public state (player list, votes progress, mission results) to all connected peers, and relays opaque encrypted blobs addressed to a single player id without inspecting their contents (new)
  - [x] `src/connection/roomHub.spec.ts` — public broadcast reaches all simulated peers; an encrypted blob addressed to player B is delivered to B and the hub itself cannot decrypt it (assert hub has no access to the private key)

## Done When
- [x] A simulated host + 2 peers can exchange a public state broadcast and a private encrypted role delivery, with the host unable to read the private payload
- [x] All new/modified tests pass
- [x] No existing tests broken
