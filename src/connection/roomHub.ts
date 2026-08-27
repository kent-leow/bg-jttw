export type RoomHubMessage =
  | { readonly kind: "broadcast"; readonly payload: unknown }
  | { readonly kind: "direct"; readonly targetPlayerId: string; readonly payload: unknown };

export interface RoomHubPeer {
  readonly playerId: string;
  readonly onMessage: (message: RoomHubMessage) => void;
}

/**
 * Host-hub message relay: broadcasts public state to every connected peer, and forwards opaque
 * encrypted blobs addressed to a single player id. The hub only ever handles ciphertext for
 * direct messages — it has no decryption capability and never inspects the payload's contents.
 */
export class RoomHub {
  private readonly peers = new Map<string, RoomHubPeer>();

  connect(peer: RoomHubPeer): void {
    this.peers.set(peer.playerId, peer);
  }

  disconnect(playerId: string): void {
    this.peers.delete(playerId);
  }

  broadcastPublicState(payload: unknown): void {
    for (const peer of this.peers.values()) {
      peer.onMessage({ kind: "broadcast", payload });
    }
  }

  relayToPlayer(targetPlayerId: string, encryptedPayload: unknown): void {
    const peer = this.peers.get(targetPlayerId);
    if (!peer) {
      return;
    }
    peer.onMessage({ kind: "direct", targetPlayerId, payload: encryptedPayload });
  }
}
