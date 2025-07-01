import { beforeEach, describe, expect, test, vi } from "vitest";

import { Subject, firstValueFrom } from "rxjs";
import { FakeTimer } from "../helpers/timer/FakeTimer";
import {
  AutoReconnectTransport,
  type AutoReconnectTransportOptions,
} from "./AutoReconnectTransport";
import type {
  ConnectionConnectedEvent,
  ConnectionErrorEvent,
  ConnectionStatusEvent,
} from "./ConnectionStatus";
import { MockTransport } from "./MockTransport";

describe("AutoReconnectTransport tests", () => {
  const testConnectionError: ConnectionErrorEvent = {
    status: "error",
    errorMessage: "test error",
  };

  let fakeTimer: FakeTimer;
  let mockTransport: MockTransport;

  beforeEach(() => {
    fakeTimer = new FakeTimer();
    mockTransport = new MockTransport();
  });

  function setUp(
    options?: Omit<AutoReconnectTransportOptions, "timer" | "transport">,
  ) {
    return new AutoReconnectTransport({
      timer: fakeTimer,
      transport: mockTransport,
      ...options,
    });
  }

  async function passTime(time: number) {
    fakeTimer.time += time;
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }

  test("messages are propagated", () => {
    const testTransport = setUp();
    const received: string[] = [];
    testTransport.messages.subscribe((message) => received.push(message));
    mockTransport.messages.next("test");
    expect(received).toEqual(["test"]);
  });

  test("connection events are propagated", () => {
    const testTransport = setUp();
    const received: ConnectionStatusEvent[] = [];
    testTransport.connectionStatusEvents.subscribe((event) =>
      received.push(event),
    );
    const connectedEvent: ConnectionConnectedEvent = { status: "connected" };
    mockTransport.connectionStatusEvents.next(connectedEvent);
    expect(received).toEqual([connectedEvent]);
  });

  test("connect() method is called on underlying transport", () => {
    const testTransport = setUp();
    const connectSpy = vi.spyOn(mockTransport, "connect");
    testTransport.connect();
    expect(connectSpy).toHaveBeenCalledOnce();
  });

  test("connect() method masks errors", async () => {
    const testTransport = setUp();
    const connectSpy = vi
      .spyOn(mockTransport, "connect")
      .mockRejectedValue("Test error");
    await expect(testTransport.connect()).resolves.toBeUndefined();
    expect(connectSpy).toHaveBeenCalledOnce();
  });

  test("close() method is called on underlying transport", () => {
    const testTransport = setUp();
    const closeSpy = vi.spyOn(mockTransport, "close");
    testTransport.close();
    expect(closeSpy).toHaveBeenCalledOnce();
  });

  test("does not try to reconnect if the connection hasn't been created yet", async () => {
    const testTransport = setUp();
    const connectSpy = vi.spyOn(mockTransport, "connect");
    const sendSpy = vi.spyOn(mockTransport, "send").mockResolvedValue();
    await testTransport.send("hello");
    expect(sendSpy).toHaveBeenCalledWith("hello");
    expect(connectSpy).not.toHaveBeenCalled();
  });

  test("waits for reconnection before sending messages", async () => {
    const testTransport = setUp({ reconnectDelayMs: 1000 });
    const connectSubject = new Subject<void>();
    const connectSpy = vi
      .spyOn(mockTransport, "connect")
      .mockReturnValueOnce(firstValueFrom(connectSubject));
    const sendSpy = vi.spyOn(mockTransport, "send").mockResolvedValue();

    // Set up connection error so the reconnection process is started.
    mockTransport.connectionStatusEvents.next(testConnectionError);

    // Try to send a message.
    let sendHasResolved = false;
    testTransport.send("hello").then(() => {
      sendHasResolved = true;
    });

    // The transport should wait before attempting to reconnect.
    await passTime(0);
    expect(sendHasResolved).toBe(false);
    expect(connectSpy).not.toHaveBeenCalled();
    expect(sendSpy).not.toHaveBeenCalled();

    await passTime(1000);
    expect(sendHasResolved).toBe(false);
    expect(connectSpy).toHaveBeenCalledOnce();
    expect(sendSpy).not.toHaveBeenCalled();

    // Now, resolve the connection so send is actually called.
    connectSubject.next();
    await passTime(0);
    expect(connectSpy).toHaveBeenCalledOnce();
    expect(sendSpy).toHaveBeenCalledOnce();
    expect(sendHasResolved).toBe(true);
  });

  test("reconnection logic uses maxRetries and reconnectDelayMs", async () => {
    const maxRetries = 3;
    const reconnectDelayMs = 500;
    const testTransport = setUp({
      maxRetries,
      reconnectDelayMs,
    });

    // Set up the connection to fail every time.
    const connectSpy = vi
      .spyOn(mockTransport, "connect")
      .mockImplementation(() => {
        mockTransport.connectionStatusEvents.next(testConnectionError);
        return Promise.reject(new Error("test error"));
      });

    await testTransport.connect();
    expect(connectSpy).toHaveBeenCalledTimes(1);

    // First attempt
    await passTime(reconnectDelayMs - 1);
    expect(connectSpy).toHaveBeenCalledTimes(1);
    await passTime(1);
    expect(connectSpy).toHaveBeenCalledTimes(2);

    // Second attempt
    await passTime(reconnectDelayMs * 2 - 1);
    expect(connectSpy).toHaveBeenCalledTimes(2);
    await passTime(1);
    expect(connectSpy).toHaveBeenCalledTimes(3);

    // Third attempt
    await passTime(reconnectDelayMs * 4 - 1);
    expect(connectSpy).toHaveBeenCalledTimes(3);
    await passTime(1);
    expect(connectSpy).toHaveBeenCalledTimes(4);

    // No more attempts to connect
    await passTime(reconnectDelayMs * 9999);
    expect(connectSpy).toHaveBeenCalledTimes(4);

    await expect(testTransport.send("hello")).rejects.toThrowError(
      "Unable to reconnect after 3 attempts",
    );
  });

  test("calling connect() manually aborts the reconnection process", async () => {
    const testTransport = setUp();

    // Set up an error to start reconnecting
    mockTransport.connectionStatusEvents.next(testConnectionError);

    // Try to send a message.
    let sendHasSettled = false;
    let sendError: unknown;
    testTransport.send("hello").then(
      () => {
        sendHasSettled = true;
      },
      (error) => {
        sendHasSettled = true;
        sendError = error;
      },
    );

    await passTime(0);
    expect(sendHasSettled).toBe(false);

    await testTransport.connect();
    await passTime(0);
    expect(sendHasSettled).toBe(true);
    expect(`${sendError}`).toMatch("Cancelled by client");

    // Now the connection is restored, so we can send messages normally.
    await expect(testTransport.send("bye")).resolves.toBeUndefined();
  });

  test("calling close() aborts the reconnection process", async () => {
    const testTransport = setUp();

    // Set up an error to start reconnecting
    mockTransport.connectionStatusEvents.next(testConnectionError);

    // Try to send a message.
    let sendHasSettled = false;
    let sendError: unknown;
    testTransport.send("hello").then(
      () => {
        sendHasSettled = true;
      },
      (error) => {
        sendHasSettled = true;
        sendError = error;
      },
    );

    await passTime(0);
    expect(sendHasSettled).toBe(false);

    testTransport.close();
    await passTime(0);
    expect(sendHasSettled).toBe(true);
    expect(`${sendError}`).toMatch("Cancelled by client");
  });
});
