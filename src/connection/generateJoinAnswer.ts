import { waitForIceGatheringComplete, type OfferPayload } from "./generateHostOffer";

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
}

export async function generateJoinAnswer(
  hostOffer: unknown,
  createPeerConnection: () => RTCPeerConnection = () => new RTCPeerConnection(),
): Promise<JoinAnswerResult> {
  if (!isValidOfferPayload(hostOffer)) {
    throw new Error("Malformed host offer: expected an object of shape { type: 'offer', sdp: string }.");
  }

  const peerConnection = createPeerConnection();
  await peerConnection.setRemoteDescription({ type: "offer", sdp: hostOffer.sdp });

  const answerDescription = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answerDescription);
  await waitForIceGatheringComplete(peerConnection);

  const sdp = peerConnection.localDescription?.sdp;
  if (!sdp) {
    throw new Error("Failed to generate a local SDP answer.");
  }
  return { answer: { type: "answer", sdp }, peerConnection };
}
