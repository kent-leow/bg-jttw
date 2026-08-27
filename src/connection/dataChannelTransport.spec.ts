import { describe, expect, it, vi } from "vitest";
import { createLoopbackChannelPair, FakeRTCDataChannel } from "./generateHostOffer.spec";
import { createDataChannelTransport } from "./dataChannelTransport";

describe("createDataChannelTransport", () => {
  it("queues messages sent before the channel opens and flushes them in order on open", () => {
    const channel = new FakeRTCDataChannel();
    const sendSpy = vi.spyOn(channel, "send");
    const transport = createDataChannelTransport(channel as unknown as RTCDataChannel);

    transport.send({ order: 1 });
    transport.send({ order: 2 });
    expect(sendSpy).not.toHaveBeenCalled();

    channel.open();

    expect(sendSpy).toHaveBeenNthCalledWith(1, JSON.stringify({ order: 1 }));
    expect(sendSpy).toHaveBeenNthCalledWith(2, JSON.stringify({ order: 2 }));
  });

  it("drops a malformed inbound frame without throwing and without invoking the handler", () => {
    const channel = new FakeRTCDataChannel();
    channel.open();
    const transport = createDataChannelTransport(channel as unknown as RTCDataChannel);
    const handler = vi.fn();
    transport.onMessage(handler);

    expect(() => channel.receiveRaw("{not-valid-json")).not.toThrow();
    expect(handler).not.toHaveBeenCalled();
  });

  it("delivers a message end-to-end across two loopback fake channels", () => {
    const [channelA, channelB] = createLoopbackChannelPair();
    channelA.open();
    channelB.open();
    const transportA = createDataChannelTransport(channelA as unknown as RTCDataChannel);
    const transportB = createDataChannelTransport(channelB as unknown as RTCDataChannel);
    const received = vi.fn();
    transportB.onMessage(received);

    transportA.send({ hello: "world" });

    expect(received).toHaveBeenCalledWith({ hello: "world" });
  });
});
