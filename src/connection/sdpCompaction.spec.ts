import { describe, expect, it } from "vitest";
import { stripTcpCandidates } from "./sdpCompaction";

describe("stripTcpCandidates", () => {
  it("removes tcp candidate lines while keeping udp candidates and other SDP lines intact", () => {
    const sdp = [
      "v=0",
      "o=- 12345 2 IN IP4 127.0.0.1",
      "a=candidate:0 1 udp 2122260223 192.168.1.5 54321 typ host generation 0",
      "a=candidate:1 1 tcp 1518280447 192.168.1.5 9 typ host tcptype active generation 0",
      "a=candidate:2 1 udp 2122194687 10.0.0.5 54322 typ host generation 0",
      "a=end-of-candidates",
    ].join("\r\n");

    const result = stripTcpCandidates(sdp);

    expect(result).not.toContain(" tcp ");
    expect(result).toContain("a=candidate:0 1 udp 2122260223 192.168.1.5 54321 typ host generation 0");
    expect(result).toContain("a=candidate:2 1 udp 2122194687 10.0.0.5 54322 typ host generation 0");
    expect(result).toContain("a=end-of-candidates");
  });

  it("leaves an SDP with no tcp candidates unchanged", () => {
    const sdp = "v=0\r\na=candidate:0 1 udp 2122260223 192.168.1.5 54321 typ host generation 0";
    expect(stripTcpCandidates(sdp)).toBe(sdp);
  });
});
