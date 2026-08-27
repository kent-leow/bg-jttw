export function endSession(peerConnections: readonly RTCPeerConnection[], clearRoomState: () => void): void {
  for (const peerConnection of peerConnections) {
    peerConnection.close();
  }
  clearRoomState();
}
