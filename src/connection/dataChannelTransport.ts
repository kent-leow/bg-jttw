export interface DataChannelTransport {
  send(message: unknown): void;
  onMessage(handler: (message: unknown) => void): () => void;
  close(): void;
}

/**
 * Wraps an `RTCDataChannel`: queues sends until the channel is open (flushing in order once it
 * opens), and JSON-parses inbound frames, silently dropping malformed ones instead of throwing —
 * an attacker-controlled or corrupted peer must never be able to crash this device.
 */
export function createDataChannelTransport(channel: RTCDataChannel): DataChannelTransport {
  const pendingMessages: string[] = [];
  const handlers = new Set<(message: unknown) => void>();

  function flushPending() {
    while (pendingMessages.length > 0 && channel.readyState === "open") {
      channel.send(pendingMessages.shift()!);
    }
  }

  channel.addEventListener("open", flushPending);
  channel.addEventListener("message", (event: MessageEvent<string>) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(event.data);
    } catch {
      return;
    }
    for (const handler of handlers) {
      handler(parsed);
    }
  });

  return {
    send(message: unknown) {
      const serialized = JSON.stringify(message);
      if (channel.readyState === "open") {
        channel.send(serialized);
      } else {
        pendingMessages.push(serialized);
      }
    },
    onMessage(handler: (message: unknown) => void) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    close() {
      channel.close();
    },
  };
}
