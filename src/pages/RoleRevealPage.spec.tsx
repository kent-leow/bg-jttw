import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { encryptForPlayer } from "../crypto/encryptForPlayer";
import { generateKeyPair } from "../crypto/keyPair";
import { RoleRevealPage, type RoleRevealPayload } from "./RoleRevealPage";

describe("RoleRevealPage", () => {
  it("renders only this device's own role and hidden knowledge", async () => {
    const self = await generateKeyPair();
    const payload: RoleRevealPayload = {
      role: { name: "Merlin", alignment: "Good" },
      hiddenKnowledge: { playerId: "self-id", evilPlayerIds: ["morgana-id", "oberon-id"] },
    };
    const envelope = await encryptForPlayer(self.publicKey, payload);

    render(<RoleRevealPage privateKey={self.privateKey} encryptedEnvelope={envelope} />);

    await waitFor(() => expect(screen.getByTestId("role-name")).toHaveTextContent("Merlin"));
    expect(screen.getByTestId("known-evil-players")).toHaveTextContent("morgana-id");
    expect(screen.getByTestId("known-evil-players")).toHaveTextContent("oberon-id");
  });

  it("never renders a payload encrypted for a different player (decrypt failure is handled, not thrown)", async () => {
    const intendedRecipient = await generateKeyPair();
    const thisDevice = await generateKeyPair();
    const payload: RoleRevealPayload = {
      role: { name: "Assassin", alignment: "Evil" },
      hiddenKnowledge: { playerId: "other-id" },
    };
    const envelope = await encryptForPlayer(intendedRecipient.publicKey, payload);

    expect(() =>
      render(<RoleRevealPage privateKey={thisDevice.privateKey} encryptedEnvelope={envelope} />),
    ).not.toThrow();

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.queryByTestId("role-name")).not.toBeInTheDocument();
  });
});
