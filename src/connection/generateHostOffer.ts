export interface OfferPayload {
  readonly type: "offer";
  readonly sdp: string;
}

/**
 * Waits for non-trickle ICE gathering to finish so the resulting SDP embeds every local
 * candidate — required because a QR code carries a single static payload with no signaling
 * channel to trickle candidates over afterward.
 */
export function waitForIceGatheringComplete(peerConnection: RTCPeerConnection): Promise<void> {
  if (peerConnection.iceGatheringState === "complete") {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    function onStateChange() {
      if (peerConnection.iceGatheringState === "complete") {
        peerConnection.removeEventListener("icegatheringstatechange", onStateChange);
        resolve();
      }
    }
    peerConnection.addEventListener("icegatheringstatechange", onStateChange);
  });
}

export interface HostOfferResult {
  readonly offer: OfferPayload;
  readonly peerConnection: RTCPeerConnection;
}

export async function generateHostOffer(
  createPeerConnection: () => RTCPeerConnection = () => new RTCPeerConnection(),
): Promise<HostOfferResult> {
  const peerConnection = createPeerConnection();
  // A data channel is required for the offer to include an application m-line for later relay use (task-005).
  peerConnection.createDataChannel("room");

  const offerDescription = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offerDescription);
  await waitForIceGatheringComplete(peerConnection);

  const sdp = peerConnection.localDescription?.sdp;
  if (!sdp) {
    throw new Error("Failed to generate a local SDP offer.");
  }
  return { offer: { type: "offer", sdp }, peerConnection };
}
