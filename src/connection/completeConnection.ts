import type { AnswerPayload } from "./generateJoinAnswer";

function isValidAnswerPayload(value: unknown): value is AnswerPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Partial<AnswerPayload>).type === "answer" &&
    typeof (value as Partial<AnswerPayload>).sdp === "string" &&
    (value as AnswerPayload).sdp.length > 0
  );
}

export interface CompleteConnectionResult {
  readonly connectionEstablished: boolean;
}

export async function completeConnection(
  peerConnection: RTCPeerConnection,
  joinerAnswer: unknown,
): Promise<CompleteConnectionResult> {
  if (!isValidAnswerPayload(joinerAnswer)) {
    return { connectionEstablished: false };
  }
  try {
    await peerConnection.setRemoteDescription({ type: "answer", sdp: joinerAnswer.sdp });
    return { connectionEstablished: true };
  } catch {
    return { connectionEstablished: false };
  }
}
