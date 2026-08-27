/**
 * Strips TCP ICE candidates from a locally-generated SDP before it's embedded in a QR code.
 * TCP candidates are only a same-network fallback path; the UDP host candidates already suffice
 * for the QR-handshake use case (two devices on the same LAN), and each TCP candidate line
 * roughly doubles the total candidate count, bloating the QR code past what a phone camera can
 * reliably scan. The peer connection's own (unmodified) localDescription is unaffected — only
 * the SDP string sent over the wire via QR is trimmed.
 */
export function stripTcpCandidates(sdp: string): string {
  return sdp
    .split(/\r\n/)
    .filter((line) => !(line.startsWith("a=candidate:") && line.includes(" tcp ")))
    .join("\r\n");
}
