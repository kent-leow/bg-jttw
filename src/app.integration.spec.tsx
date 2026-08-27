import { render, waitFor, within, type RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { createFakePeerConnection, FakeRTCDataChannel } from "./connection/generateHostOffer.spec";
import type { HostReachabilityCheck } from "./connection/reestablishConnection";
import { encodeQrPayload } from "./connection/qrCodec";
import { generateKeyPair } from "./crypto/keyPair";
import { readLocalIdentity } from "./state/localIdentity";

/**
 * Simulated WebRTC network shared between one host `<App>` instance and several joiner `<App>`
 * instances in this process. Only the WebRTC/camera/QR *transport* boundary is faked — every
 * engine/connection/crypto module underneath (RoomHub, HostOrchestrator, usePlayerGameState,
 * dataChannelTransport, crypto/*) runs for real.
 */
interface FakeNetwork {
  currentOfferSdp: string | null;
  channelsBySdp: Map<string, FakeRTCDataChannel>;
  hostOnFrame: ((payload: string) => void) | null;
}

function createNetwork(): FakeNetwork {
  return { currentOfferSdp: null, channelsBySdp: new Map(), hostOnFrame: null };
}

let offerCounter = 0;

function makeHostDependencies(network: FakeNetwork) {
  return {
    generateOffer: async () => {
      const sdp = `offer-${++offerCounter}`;
      const dataChannel = new FakeRTCDataChannel();
      dataChannel.open();
      network.channelsBySdp.set(sdp, dataChannel);
      network.currentOfferSdp = sdp;
      return {
        offer: { type: "offer" as const, sdp },
        peerConnection: createFakePeerConnection(),
        dataChannel: dataChannel as unknown as RTCDataChannel,
      };
    },
    completeJoin: async () => ({ connectionEstablished: true }),
    requestCamera: async () => ({}) as MediaStream,
    startScanLoop: (_stream: MediaStream, onFrame: (payload: string | null) => void) => {
      network.hostOnFrame = onFrame;
      return () => {
        network.hostOnFrame = null;
      };
    },
  };
}

function makeJoinDependencies(
  network: FakeNetwork,
  onPublicKeyJwk: (jwk: JsonWebKey) => void,
  onPlayerId: (playerId: string) => void,
) {
  return {
    requestCamera: async () => ({}) as MediaStream,
    startScanLoop: (_stream: MediaStream, onFrame: (payload: string | null) => void) => {
      onFrame(encodeQrPayload({ type: "offer", sdp: network.currentOfferSdp! }));
      return () => {};
    },
    generateAnswer: async (hostOffer: unknown) => {
      const offer = hostOffer as { type: "offer"; sdp: string };
      const channelA = network.channelsBySdp.get(offer.sdp)!;
      const channelB = new FakeRTCDataChannel();
      channelB.open();
      channelA.peer = channelB;
      channelB.peer = channelA;
      return {
        answer: { type: "answer" as const, sdp: `answer-${offer.sdp}` },
        peerConnection: createFakePeerConnection(),
        dataChannel: channelB as unknown as RTCDataChannel,
      };
    },
    generateKeyPair: async () => {
      const keyPair = await generateKeyPair();
      const jwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
      onPublicKeyJwk(jwk);
      return keyPair;
    },
    generatePlayerId: () => {
      const playerId = crypto.randomUUID();
      onPlayerId(playerId);
      return playerId;
    },
  };
}

/** Scopes queries to this instance's own container — `render()`'s own bound queries default to
 * searching the whole `document.body`, which collides once multiple `<App>` trees are mounted. */
function q(instance: RenderResult) {
  return within(instance.container);
}

function getPortraitChips(instance: RenderResult): HTMLElement[] {
  return q(instance)
    .getAllByRole("button")
    .filter((btn) => btn.hasAttribute("aria-pressed"));
}

function findLeaderInstance(instances: readonly RenderResult[]): RenderResult {
  const leader = instances.find((i) => q(i).queryByRole("button", { name: "Propose Team" }));
  if (!leader) {
    throw new Error("No render instance is currently the leader.");
  }
  return leader;
}

async function connectOneJoiner(
  host: RenderResult,
  network: FakeNetwork,
): Promise<{ instance: RenderResult; publicKeyJwk: JsonWebKey }> {
  let capturedJwk: JsonWebKey | undefined;
  let capturedPlayerId: string | undefined;
  // localStorage is a single shared object across every simulated "device" in this jsdom process
  // (real devices would each have their own); clear it so AppRoot sees this new instance as a
  // brand-new player rather than picking up a previously-connected joiner's stored identity.
  localStorage.clear();
  const instance = render(
    <App
      joinDependencies={makeJoinDependencies(
        network,
        (jwk) => (capturedJwk = jwk),
        (playerId) => (capturedPlayerId = playerId),
      )}
    />,
  );
  await userEvent.click(await q(instance).findByRole("button", { name: "Join a Game" }));
  await userEvent.click(q(instance).getByRole("button", { name: "Start Scanning" }));
  await waitFor(() => expect(q(instance).getByRole("heading", { name: "Lobby" })).toBeInTheDocument());
  await waitFor(() => expect(capturedJwk).toBeDefined());
  await waitFor(() => expect(capturedPlayerId).toBeDefined());

  const answerPayload = encodeQrPayload({
    type: "answer",
    sdp: `answer-${network.currentOfferSdp}`,
    publicKeyJwk: capturedJwk,
    playerId: capturedPlayerId,
  });
  await userEvent.click(q(host).getByRole("button", { name: "Scan Player's Reply Code" }));
  network.hostOnFrame!(answerPayload);

  return { instance, publicKeyJwk: capturedJwk! };
}

describe("Full-playthrough integration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it(
    "plays a complete 6-player game end to end, rematches, and restores a mid-game reload",
    async () => {
      const network = createNetwork();

      // ---- AC1/AC2: Host setup + all 5 joiners connect via simulated QR/data-channel handshakes ----
      const host = render(<App hostDependencies={makeHostDependencies(network)} />);
      await userEvent.click(await q(host).findByRole("button", { name: "Host a Game" }));
      await waitFor(() => expect(q(host).getByRole("group", { name: "Player count" })).toBeInTheDocument());
      // HostSetupPage's minimum selectable value is 5 joiners, and its seat counter only counts
      // joiners (not the host's own seat, per the task-018 changelog note) — so "5" here yields the
      // smallest possible total game: host + 5 joiners = 6 players.
      await userEvent.click(q(host).getByRole("button", { name: "5" }));

      const joiners: RenderResult[] = [];
      for (let i = 0; i < 5; i += 1) {
        const beforeSdp = network.currentOfferSdp;
        const { instance } = await connectOneJoiner(host, network);
        joiners.push(instance);
        if (i < 4) {
          await waitFor(() => expect(network.currentOfferSdp).not.toBe(beforeSdp));
        }
      }

      const allInstances = [host, ...joiners];

      const hostStartButton = () => q(host).getByRole("button", { name: "Start Game" });
      await waitFor(() => expect(hostStartButton()).toBeEnabled(), { timeout: 10000 });
      await userEvent.click(hostStartButton());

      // ---- Lobby: host starts the game once all seats show connected ----
      await waitFor(() => expect(hostStartButton()).toBeEnabled(), { timeout: 10000 });
      await userEvent.click(hostStartButton());

      // ---- AC4/AC3: every device privately reveals its own role ----
      for (const instance of allInstances) {
        await waitFor(() => expect(q(instance).getByTestId("role-reveal-name")).toBeInTheDocument(), {
          timeout: 10000,
        });
      }
      const rolesByInstance = new Map<RenderResult, { name: string; alignment: string }>();
      for (const instance of allInstances) {
        rolesByInstance.set(instance, {
          name: q(instance).getByTestId("role-reveal-name").textContent ?? "",
          alignment: q(instance).getByTestId("role-reveal-alignment").textContent ?? "",
        });
      }
      for (const instance of allInstances) {
        await userEvent.click(q(instance).getByRole("button", { name: "Continue" }));
      }
      for (const instance of allInstances) {
        await waitFor(() => expect(q(instance).getByText("Main Game Board")).toBeInTheDocument(), {
          timeout: 10000,
        });
      }

      // ---- AC5: at least one rejected proposal (leader rotation is the observable proxy for the
      // rejection counter, which no page currently surfaces numerically) ----
      const leaderBeforeReject = findLeaderInstance(allInstances);
      const chipsToReject = getPortraitChips(leaderBeforeReject).slice(0, 2);
      for (const chip of chipsToReject) {
        await userEvent.click(chip);
      }
      await userEvent.click(q(leaderBeforeReject).getByRole("button", { name: "Propose Team" }));
      for (const instance of allInstances) {
        await userEvent.click(q(instance).getByRole("button", { name: "Reject" }));
      }
      await waitFor(() => {
        const newLeader = findLeaderInstance(allInstances);
        expect(newLeader).not.toBe(leaderBeforeReject);
      });

      // ---- AC5: one approved proposal per mission, through 3 mission successes ----
      const missionSizes = [2, 3, 4]; // 6-player mission sizes: M1=2, M2=3, M3=4
      for (let mission = 1; mission <= 3; mission += 1) {
        const leader = findLeaderInstance(allInstances);
        const missionSize = missionSizes[mission - 1]!;
        const chips = getPortraitChips(leader).slice(0, missionSize);
        for (const chip of chips) {
          await userEvent.click(chip);
        }
        await userEvent.click(q(leader).getByRole("button", { name: "Propose Team" }));
        for (const instance of allInstances) {
          await userEvent.click(q(instance).getByRole("button", { name: "Approve" }));
        }

        // Whichever instances are on the team now see the mission-card submission screen.
        for (const instance of allInstances) {
          const successButton = q(instance).queryByRole("button", { name: "Success" });
          if (successButton) {
            await userEvent.click(successButton);
          }
        }

        for (const instance of allInstances) {
          const continueButton = await waitFor(() => q(instance).getByRole("button", { name: "Continue" }), {
            timeout: 10000,
          });
          await userEvent.click(continueButton);
        }
      }

      // ---- AC5: Assassination phase ----
      let assassinInstance: RenderResult | undefined;
      let merlinName: string | undefined;
      for (const instance of allInstances) {
        const role = rolesByInstance.get(instance)!;
        if (role.name === "Assassin") {
          assassinInstance = instance;
        }
        if (role.name === "Merlin") {
          merlinName = role.name;
        }
      }
      expect(assassinInstance).toBeDefined();
      expect(merlinName).toBe("Merlin");

      await waitFor(
        () => expect(q(assassinInstance!).getByTestId("assassination-target-grid")).toBeInTheDocument(),
        { timeout: 10000 },
      );
      for (const instance of allInstances) {
        if (instance !== assassinInstance) {
          expect(q(instance).getByTestId("assassination-suspense")).toBeInTheDocument();
        }
      }
      const targets = q(assassinInstance!).getAllByRole("button");
      await userEvent.click(targets[0]!);

      // ---- Every device reaches the matching EndGamePage ----
      for (const instance of allInstances) {
        await waitFor(() => expect(q(instance).getByTestId("game-result")).toBeInTheDocument(), { timeout: 10000 });
      }
      const results = allInstances.map((instance) => q(instance).getByTestId("game-result").textContent);
      expect(new Set(results).size).toBe(1);
      expect(results[0]).toMatch(/GoodWin|EvilWin/);

      // ---- AC9: rematch reaches role reveal for all players, with no player re-scanning a QR code ----
      await userEvent.click(q(host).getByRole("button", { name: "Rematch" }));
      for (const instance of allInstances) {
        await waitFor(() => expect(q(instance).getByTestId("role-reveal-name")).toBeInTheDocument(), {
          timeout: 10000,
        });
      }
      for (const instance of allInstances) {
        await userEvent.click(q(instance).getByRole("button", { name: "Continue" }));
      }
      for (const instance of allInstances) {
        await waitFor(() => expect(q(instance).getByText("Main Game Board")).toBeInTheDocument());
      }

      // ---- AC6: a mid-game simulated reload for a non-host player restores their prior page ----
      // localStorage is shared across every simulated "device" in this jsdom process, so whichever
      // joiner most recently persisted its snapshot is the one recoverable here; the mechanism under
      // test (AppRoot -> reestablishConnection -> restore, rather than restarting at Landing) is the
      // same regardless of which specific joiner it is.
      const identityBeforeReload = readLocalIdentity();
      expect(identityBeforeReload).not.toBeNull();

      const checkHostReachable: HostReachabilityCheck = async (_roomId, playerId) => {
        const identity = readLocalIdentity();
        if (identity && identity.playerId === playerId) {
          return { reachable: true, currentState: identity.lastKnownState };
        }
        return { reachable: false };
      };
      const reloaded = render(<App checkHostReachable={checkHostReachable} />);

      // The restored view re-shows the player's last-known role reveal (their exact prior page's
      // one-time gate) before resuming the underlying game-board state — acknowledge it, same as
      // the player would on their original device.
      await waitFor(() => expect(q(reloaded).getByTestId("role-reveal-name")).toBeInTheDocument(), {
        timeout: 10000,
      });
      expect(q(reloaded).queryByRole("button", { name: "Host a Game" })).not.toBeInTheDocument();
      expect(q(reloaded).queryByRole("alert")).not.toBeInTheDocument();
      await userEvent.click(q(reloaded).getByRole("button", { name: "Continue" }));

      await waitFor(() => expect(q(reloaded).getByText("Main Game Board")).toBeInTheDocument(), { timeout: 10000 });
    },
    60000,
  );
});
