# Task 015 — Real-Time Data Channel Transport (WebRTC Wiring)

## Goal
Messages actually travel across a real `RTCDataChannel` between the host's and a joiner's device; today `generateHostOffer`/`generateJoinAnswer` only exchange SDP, no code ever sends or receives a message over the resulting connection, and `RoomHub` only relays in-memory within a single browser tab.

## Prerequisites
- [x] task-005.md completed

## Tasks

### Data Channel Exposure
- [x] `src/connection/generateHostOffer.ts` — return the `RTCDataChannel` created alongside the offer so callers can wire it to a transport (edit)
  - [x] `src/connection/generateHostOffer.spec.ts` — result includes the created data channel instance (extend existing spec)
- [x] `src/connection/generateJoinAnswer.ts` — register an `ondatachannel` handler on the joiner's peer connection before setting the remote description, and return the received channel once it fires (edit)
  - [x] `src/connection/generateJoinAnswer.spec.ts` — result resolves only once the host-created channel has been received; rejects with an explicit error if no channel arrives

### Transport
- [x] `src/connection/dataChannelTransport.ts` — wraps an `RTCDataChannel`: `send(message: unknown)` JSON-serializes and sends, queuing sends until `readyState` is `"open"`; `onMessage(handler)` JSON-parses inbound `message` events and ignores malformed frames instead of throwing (new)
  - [x] `src/connection/dataChannelTransport.spec.ts` — messages sent before the channel opens are queued and flushed on open; a malformed inbound frame is dropped without throwing and without invoking the handler; two loopback fake channels wired together deliver a message end-to-end

### Hub Integration
- [x] `src/connection/roomHub.ts` — accept a `RoomHubPeer` whose `onMessage` is backed by a `dataChannelTransport` `send`, confirming the existing interface needs no shape change (edit only if a mismatch is found)
  - [x] `src/connection/roomHub.spec.ts` — a broadcast and a direct message reach a peer whose `onMessage` forwards through a real (loopback-paired fake) data channel transport, not just an in-memory callback (extend existing spec)

## Done When
- [x] A host-side and joiner-side fake data channel pair, wired through `dataChannelTransport`, deliver a `RoomHub` broadcast and a direct message across the simulated connection
- [x] All new/modified tests pass
- [x] No existing tests broken
