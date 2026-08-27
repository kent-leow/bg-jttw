import { waitForIceGatheringComplete, type OfferPayload } from "./generateHostOffer";
import { stripTcpCandidates } from "./sdpCompaction";

export interface AnswerPayload {
  readonly type: "answer";
  readonly sdp: string;
}

function isValidOfferPayload(value: unknown): value is OfferPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Partial<OfferPayload>).type === "offer" &&
    typeof (value as Partial<OfferPayload>).sdp === "string" &&
    (value as OfferPayload).sdp.length > 0
  );
}

export interface JoinAnswerResult {
  readonly answer: AnswerPayload;
  readonly peerConnection: RTCPeerConnection;
  readonly dataChannel: RTCDataChannel;
}

const DEFAULT_DATA_CHANNEL_TIMEOUT_MS = 5000;

function waitForDataChannel(peerConnection: RTCPeerConnection, timeoutMs: number): Promise<RTCDataChannel> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      peerConnection.removeEventListener("datachannel", handler as EventListener);
      reject(new Error("Timed out waiting for the host's data channel."));
    }, timeoutMs);

    function handler(event: RTCDataChannelEvent) {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutId);
      peerConnection.removeEventListener("datachannel", handler as EventListener);
      resolve(event.channel);
    }

    peerConnection.addEventListener("datachannel", handler as EventListener);
  });
}

export async function generateJoinAnswer(
  hostOffer: unknown,
  createPeerConnection: () => RTCPeerConnection = () => new RTCPeerConnection(),
  dataChannelTimeoutMs = DEFAULT_DATA_CHANNEL_TIMEOUT_MS,
): Promise<JoinAnswerResult> {
  if (!isValidOfferPayload(hostOffer)) {
    throw new Error("Malformed host offer: expected an object of shape { type: 'offer', sdp: string }.");
  }

  const peerConnection = createPeerConnection();
  // Registered before setRemoteDescription so the handler can never miss the host's channel.
  const dataChannelPromise = waitForDataChannel(peerConnection, dataChannelTimeoutMs);

  await peerConnection.setRemoteDescription({ type: "offer", sdp: hostOffer.sdp });

  const answerDescription = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answerDescription);
  await waitForIceGatheringComplete(peerConnection);

  const sdp = peerConnection.localDescription?.sdp;
  if (!sdp) {
    throw new Error("Failed to generate a local SDP answer.");
  }
  const dataChannel = await dataChannelPromise;
  return { answer: { type: "answer", sdp: stripTcpCandidates(sdp) }, peerConnection, dataChannel };
}
