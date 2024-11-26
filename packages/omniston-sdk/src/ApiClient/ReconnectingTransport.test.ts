import { beforeEach, describe, expect, test, vi } from "vitest";

import { FakeTimer } from "../helpers/timer/FakeTimer";
import { MockTransport } from "./MockTransport";
import { ReconnectingTransport } from "./ReconnectingTransport";

describe("ReconnectingTransport tests", () => {
  let fakeTimer: FakeTimer;

  beforeEach(() => {
    fakeTimer = new FakeTimer();
  });

  function setUp(
    options: Omit<
      ConstructorParameters<typeof ReconnectingTransport>[0],
      "timer"
    >,
  ) {
    return new ReconnectingTransport({
      timer: fakeTimer,
      ...options,
    });
  }

  async function passTime(time: number) {
    fakeTimer.time += time;
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }

  test("second call to ensureConnection does not trigger another reconnection sequence", async () => {
    const mockTransport = new MockTransport();
    const testTransport = setUp({
      factory: () => mockTransport,
    });

    let resolve = () => {};
    const spy = vi.spyOn(mockTransport, "ensureConnection").mockReturnValue(
      new Promise((_resolve) => {
        resolve = _resolve;
      }),
    );

    const result1 = testTransport.ensureConnection();
    const result2 = testTransport.ensureConnection();

    resolve();

    await expect(result1).resolves.toBeUndefined();
    await expect(result2).resolves.toBeUndefined();

    expect(spy).toHaveBeenCalledOnce();
  });

  test("reconnection logic uses maxRetries and reconnectDelayMs", async () => {
    let factoryInvokedTimes = 0;
    let hasResolved = false;
    let lastError: Error | undefined;

    const testTransport = setUp({
      factory: () => {
        ++factoryInvokedTimes;

        const transport = new MockTransport();
        vi.spyOn(transport, "ensureConnection").mockRejectedValue(
          new Error("test error"),
        );
        return transport;
      },
      maxRetries: 2,
      reconnectDelayMs: 1000,
    });

    testTransport
      .ensureConnection()
      .finally(() => {
        hasResolved = true;
      })
      .catch((err) => {
        lastError = err;
      });

    await passTime(0);
    expect(hasResolved).toBe(false);
    expect(factoryInvokedTimes).toBe(1);
    await passTime(100);
    expect(hasResolved).toBe(false);
    expect(factoryInvokedTimes).toBe(1);
    await passTime(1000);
    expect(hasResolved).toBe(false);
    expect(factoryInvokedTimes).toBe(2);
    await passTime(1000);
    expect(hasResolved).toBe(true);
    expect(factoryInvokedTimes).toBe(3);
    expect(lastError?.message).toContain("Failed to reconnect");
    expect((lastError?.cause as Error).message).toContain("test error");
  });

  test("does not allow to send() before ensureConnection()", async () => {
    const testTransport = setUp({
      factory: () => new MockTransport(),
    });

    await expect(testTransport.send("test")).rejects.toThrowError(
      "ensureConnection",
    );
  });

  test("propagates send()", async () => {
    const mockTransport = new MockTransport();
    const testTransport = setUp({
      factory: () => mockTransport,
    });

    const sendSpy = vi.spyOn(mockTransport, "send");
    await expect(testTransport.ensureConnection()).resolves.toBeUndefined();
    await expect(testTransport.send("test")).resolves.toBeUndefined();

    expect(sendSpy).toHaveBeenCalledWith("test");
  });

  test("messages work after reconnection", async () => {
    const mockTransport1 = new MockTransport();
    const mockTransport2 = new MockTransport();
    const transportsIter = [mockTransport1, mockTransport2].values();
    const testMessage1 = "test message 1";
    const testMessage2 = "test message 2";

    const testTransport = setUp({
      // biome-ignore lint/style/noNonNullAssertion: test code
      factory: () => transportsIter.next().value!,
      reconnectDelayMs: 1,
    });
    const received: unknown[] = [];
    testTransport.messages.subscribe((message) => received.push(message));

    await expect(testTransport.ensureConnection()).resolves.toBeUndefined();

    mockTransport1.messages.next(testMessage1);
    expect(received).toEqual([testMessage1]);

    vi.spyOn(mockTransport1, "ensureConnection").mockRejectedValue(
      new Error("test error"),
    );

    const result = testTransport.ensureConnection();
    // Wait for the first connection to fail.
    await passTime(0);
    // Wait for reconnection.
    await passTime(1);
    // Now the second mock transport should be connected.
    await expect(result).resolves.toBeUndefined();

    mockTransport2.messages.next(testMessage2);
    expect(received).toEqual([testMessage1, testMessage2]);
  });

  test("closes the underlying transport and does not allow to reconnect after closing", async () => {
    const mockTransport = new MockTransport();
    const testTransport = setUp({
      factory: () => mockTransport,
    });

    await expect(testTransport.ensureConnection()).resolves.toBeUndefined();

    const closeSpy = vi.spyOn(mockTransport, "close");
    testTransport.close();
    expect(closeSpy).toHaveBeenCalled();

    await expect(testTransport.ensureConnection()).rejects.toThrowError(
      "Connection is closed",
    );
  });
});
