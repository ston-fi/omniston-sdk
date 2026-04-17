import { Subject } from "rxjs";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { type ApiClientWrapper, ApiStreamController } from "./ApiStreamController";
import type { ConnectionStatusEvent } from "./ConnectionStatus";

describe("ApiStreamController tests", () => {
  const testMethod = "testMethod";
  const testEventMethod = "testEventMethod";
  const testPayload = { test: "payload" };
  type SendFn = ApiClientWrapper["send"];

  let connectionStatusEvents: Subject<ConnectionStatusEvent>;
  let sendSpy: ReturnType<typeof vi.fn<SendFn>>;
  let apiClient: ApiClientWrapper;
  let streamController: ApiStreamController;
  let nextSubscriptionId: number;
  let streamMap: Map<string, Subject<unknown>>;

  const streamKey = (method: string, subscriptionId: number) => `${method}:${subscriptionId}`;

  const getStream = (method: string, subscriptionId: number) => {
    const key = streamKey(method, subscriptionId);
    let stream = streamMap.get(key);
    if (!stream) {
      stream = new Subject<unknown>();
      streamMap.set(key, stream);
    }
    return stream;
  };

  beforeEach(() => {
    connectionStatusEvents = new Subject<ConnectionStatusEvent>();
    nextSubscriptionId = 1;
    streamMap = new Map();

    sendSpy = vi.fn<SendFn>(async (method: string, _payload) => {
      if (method === testMethod) {
        return nextSubscriptionId++;
      }
      return true;
    });

    apiClient = {
      send: sendSpy,
      readStream: (method, subscriptionId) => getStream(method, subscriptionId).asObservable(),
    };

    streamController = new ApiStreamController({
      apiClient,
      connectionStatusEvents,
      method: testMethod,
      eventMethod: testEventMethod,
      payload: testPayload,
    });
  });

  test("stream init", async () => {
    const stream = await streamController.stream;

    expect(stream).toBeDefined();
    expect(sendSpy).toHaveBeenCalledTimes(1);
    expect(sendSpy).toHaveBeenCalledWith(testMethod, testPayload);
    expect(streamController.subscriptionId).toBe(1);
  });

  test("stream events pass through", async () => {
    const stream = await streamController.stream;
    const received: unknown[] = [];
    stream.subscribe((event) => received.push(event));

    getStream(testEventMethod, 1).next("event-1");
    getStream(testEventMethod, 1).next("event-2");

    expect(received).toEqual(["event-1", "event-2"]);
  });

  test("when transport is not connected subscriptions are not dropped", async () => {
    const stream = await streamController.stream;
    const received: unknown[] = [];
    stream.subscribe((event) => received.push(event));

    getStream(testEventMethod, 1).next("before-disconnect");
    connectionStatusEvents.next({
      status: "error",
      errorMessage: "network issue",
      isReconnecting: true,
    });
    getStream(testEventMethod, 1).next("after-disconnect");

    expect(sendSpy).toHaveBeenCalledTimes(1);
    expect(received).toEqual(["before-disconnect", "after-disconnect"]);
  });

  test("after reconnect new events are passed to existing consumer subscription", async () => {
    const stream = await streamController.stream;
    const received: unknown[] = [];
    stream.subscribe((event) => received.push(event));

    connectionStatusEvents.next({ status: "connected" });
    connectionStatusEvents.next({ status: "connected" });
    await Promise.resolve();

    expect(sendSpy).toHaveBeenCalledTimes(2);
    expect(streamController.subscriptionId).toBe(2);

    getStream(testEventMethod, 2).next("after-reconnect");
    expect(received).toEqual(["after-reconnect"]);
  });

  test("on *.closed notification streamClosedByServer emits and completes", async () => {
    await streamController.stream;

    let closeSignalCount = 0;
    let closeSignalCompleted = false;
    streamController.streamClosedByServer.subscribe({
      next: () => {
        closeSignalCount += 1;
      },
      complete: () => {
        closeSignalCompleted = true;
      },
    });

    getStream(`${testEventMethod}.closed`, 1).next({});

    expect(closeSignalCount).toBe(1);
    expect(closeSignalCompleted).toBe(true);
  });

  test("after *.closed no more updates are passed to consumer", async () => {
    const stream = await streamController.stream;
    const received: unknown[] = [];
    let isCompleted = false;
    stream.subscribe({
      next: (event) => received.push(event),
      complete: () => {
        isCompleted = true;
      },
    });

    getStream(testEventMethod, 1).next("before-close");
    getStream(`${testEventMethod}.closed`, 1).next({});
    getStream(testEventMethod, 1).next("after-close");
    connectionStatusEvents.next({ status: "connected" });
    connectionStatusEvents.next({ status: "connected" });
    await Promise.resolve();

    expect(isCompleted).toBe(true);
    expect(received).toEqual(["before-close"]);
    expect(sendSpy).toHaveBeenCalledTimes(1);
  });
});
