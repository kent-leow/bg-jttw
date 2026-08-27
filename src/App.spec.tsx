import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { createFakePeerConnection, FakeRTCDataChannel } from "./connection/generateHostOffer.spec";
import { encodeQrPayload } from "./connection/qrCodec";
import { generateKeyPair } from "./crypto/keyPair";

function neverResolves(): Promise<MediaStream> {
  return new Promise(() => {});
}

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("mounts without throwing", async () => {
    expect(() => render(<App />)).not.toThrow();
    await waitFor(() => expect(screen.getByRole("button", { name: "Host a Game" })).toBeInTheDocument());
  });

  it("reaches HostSetupPage when choosing Host from Landing", async () => {
    render(<App hostDependencies={{ requestCamera: neverResolves }} />);

    await userEvent.click(await screen.findByRole("button", { name: "Host a Game" }));

    await waitFor(() => expect(screen.getByRole("group", { name: "Player count" })).toBeInTheDocument());
  });

  it("reaches JoinPage when choosing Join from Landing", async () => {
    render(<App joinDependencies={{ requestCamera: neverResolves }} />);

    await userEvent.click(await screen.findByRole("button", { name: "Join a Game" }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "Join a Game" })).toBeInTheDocument());
  });

  it(
    "a host completing role assignment sees RoleRevealPage render before GameBoardPage",
    async () => {
    const joinerKeyPair = await generateKeyPair();
    const joinerPublicKeyJwk = await crypto.subtle.exportKey("jwk", joinerKeyPair.publicKey);
    const encodedJoinerAnswer = encodeQrPayload({
      type: "answer",
      sdp: "joiner-sdp",
      publicKeyJwk: joinerPublicKeyJwk,
    });

    render(
      <App
        hostDependencies={{
          generateOffer: async () => {
            const peerConnection = createFakePeerConnection();
            const dataChannel = new FakeRTCDataChannel();
            dataChannel.open();
            return {
              offer: { type: "offer", sdp: "host-sdp" },
              peerConnection,
              dataChannel: dataChannel as unknown as RTCDataChannel,
            };
          },
          completeJoin: async () => ({ connectionEstablished: true }),
          requestCamera: async () => ({}) as MediaStream,
          startScanLoop: (_stream, onFrame) => {
            onFrame(encodedJoinerAnswer);
            return () => {};
          },
        }}
      />,
    );

    await userEvent.click(await screen.findByRole("button", { name: "Host a Game" }));
    await waitFor(() => expect(screen.getByRole("group", { name: "Player count" })).toBeInTheDocument());

    // HostSetupPage's own seat counter requires N joiner connections beyond the host's own seat,
    // so choosing "5" here yields a 6-total-player game (host + 5 joiners) once seats are filled.
    await userEvent.click(screen.getByRole("button", { name: "5" }));

    const startGameButton = () => screen.getByRole("button", { name: "Start Game" });
    for (let expected = 1; expected <= 5; expected += 1) {
      await userEvent.click(screen.getByRole("button", { name: "Scan Player's Reply Code" }));
      await waitFor(() => expect(screen.getByText(`${expected}/5 joined`)).toBeInTheDocument(), { timeout: 5000 });
    }
    await waitFor(() => expect(startGameButton()).toBeEnabled(), { timeout: 5000 });

    await userEvent.click(startGameButton());
    await waitFor(() => expect(startGameButton()).toBeEnabled(), { timeout: 5000 });

    await userEvent.click(startGameButton());

    await waitFor(() => expect(screen.getByTestId("role-reveal-name")).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.queryByText("Main Game Board")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(screen.getByText("Main Game Board")).toBeInTheDocument());
    expect(screen.queryByTestId("role-reveal-name")).not.toBeInTheDocument();
    },
    15000,
  );

  it("a joiner's rendered page advances when a simulated host broadcast changes phase, without any local next action", async () => {
    let capturedDataChannel: FakeRTCDataChannel | undefined;
    const hostOfferPayload = encodeQrPayload({ type: "offer", sdp: "host-sdp" });

    render(
      <App
        joinDependencies={{
          requestCamera: async () => ({}) as MediaStream,
          startScanLoop: (_stream, onFrame) => {
            onFrame(hostOfferPayload);
            return () => {};
          },
          generateAnswer: async () => {
            const dataChannel = new FakeRTCDataChannel();
            dataChannel.open();
            capturedDataChannel = dataChannel;
            return {
              answer: { type: "answer", sdp: "joiner-sdp" },
              peerConnection: createFakePeerConnection(),
              dataChannel: dataChannel as unknown as RTCDataChannel,
            };
          },
        }}
      />,
    );

    await userEvent.click(await screen.findByRole("button", { name: "Join a Game" }));
    await userEvent.click(screen.getByRole("button", { name: "Start Scanning" }));

    // Wait until JoinFlowInGame has actually mounted (and usePlayerGameState has subscribed to
    // the local hub) before simulating an inbound host broadcast.
    await waitFor(() => expect(screen.getByRole("heading", { name: "Lobby" })).toBeInTheDocument());

    const simulatedGameState = {
      kind: "gameState",
      players: ["host-id", "me"],
      leaderId: "host-id",
      missionNumber: 1,
      requiredTeamSize: 2,
      phase: "TeamProposal",
      votes: {},
      missionResults: [],
      result: null,
    };
    act(() => {
      capturedDataChannel!.receiveRaw(JSON.stringify({ kind: "broadcast", payload: simulatedGameState }));
    });

    await waitFor(() => expect(screen.getByText("Revealing your role…")).toBeInTheDocument());

    // Non-host devices never see the host-only vote-progress indicator, "Next", or "Start Game" actions.
    expect(screen.queryByTestId("vote-progress")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start Game" })).not.toBeInTheDocument();
  });
});
