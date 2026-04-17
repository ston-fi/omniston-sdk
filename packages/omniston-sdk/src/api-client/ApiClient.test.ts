import { beforeEach, describe, expect, test, vi } from "vitest";

import { ApiClient } from "./ApiClient";
import type { ConnectionErrorEvent } from "./ConnectionStatus";
import { MockTransport } from "./MockTransport";

describe("ApiClient tests", () => {
  const testMethod = "testMethod";
  const testEventMethod = "testEvent";
  const testUnsubscribeMethod = "testUnsubscribe";
  const testPayload = { testKey: "testValue" };
  const testError = new Error("test error");
  const testSubscriptionId = 1;
  const testConnectionError: ConnectionErrorEvent = {
    status: "error",
    errorMessage: "test error",
  };

  let apiClient: ApiClient;
  let mockTransport: MockTransport;

  beforeEach(() => {
    mockTransport = new MockTransport();
    apiClient = new ApiClient({ transport: mockTransport });
  });

  // Make a simple server to respond "ok" to all methods
  function setUpSimpleServer() {
    vi.spyOn(mockTransport, "send").mockImplementation(async (message) => {
      const requestId = JSON.parse(message).id;
      mockTransport.messages.next(
        JSON.stringify(
          jsonRpcPayload({
            id: requestId,
            result: "ok",
          }),
        ),
      );
    });
  }

  // Make server to respond to the request with the given subscription id
  function setUpSubscription(method: string, subscriptionId: number) {
    return vi.spyOn(mockTransport, "send").mockImplementation(async (message) => {
      const { id: requestId, method: requestMethod } = JSON.parse(message);
      if (method === requestMethod) {
        mockTransport.messages.next(
          JSON.stringify(
            jsonRpcPayload({
              id: requestId,
              result: subscriptionId,
            }),
          ),
        );
      }
    });
  }

  test("method call", async () => {
    const sendSpy = vi.spyOn(mockTransport, "send");
    const expectedResponse = { testKey2: "testValue2" };

    const response = apiClient.send(testMethod, testPayload);
    await Promise.resolve();
    const expectedRequest = jsonRpcPayload({
      id: 1,
      method: testMethod,
      params: testPayload,
    });

    expect(sendSpy).toBeCalledWith(JSON.stringify(expectedRequest));

    const serverResponse = jsonRpcPayload({
      id: 1,
      result: expectedResponse,
    });
    mockTransport.messages.next(JSON.stringify(serverResponse));

    await expect(response).resolves.toEqual(expectedResponse);
  });

  test("returns an error if transport throws", async () => {
    vi.spyOn(mockTransport, "send").mockRejectedValue(testError);

    await expect(apiClient.send(testMethod, testPayload)).rejects.toThrowError(testError.message);
  });

  test("returns an error if server returns an error", async () => {
    const response = apiClient.send(testMethod, testPayload);
    await Promise.resolve();

    const serverErrorResponse = jsonRpcPayload({
      id: 1,
      error: { code: 1, message: "Test error" },
    });
    mockTransport.messages.next(JSON.stringify(serverErrorResponse));

    await expect(response).rejects.toThrowError("Test error");
  });

  test("subscribe to event stream", async () => {
    setUpSubscription(testMethod, testSubscriptionId);
    const eventStream = apiClient.subscribeToStream(testMethod, testEventMethod, testPayload);
    const events = await eventStream.stream;
    const testResult1 = "testResult1";
    const testResult2 = "testResult2";

    const received: unknown[] = [];
    events.subscribe((event) => received.push(event));

    const serverNotification1 = jsonRpcPayload({
      method: testEventMethod,
      params: {
        subscription: testSubscriptionId,
        result: testResult1,
      },
    });
    mockTransport.messages.next(JSON.stringify(serverNotification1));

    expect(received).toEqual([testResult1]);

    const serverNotification2 = jsonRpcPayload({
      method: testEventMethod,
      params: {
        subscription: testSubscriptionId,
        result: testResult2,
      },
    });
    mockTransport.messages.next(JSON.stringify(serverNotification2));

    expect(received).toEqual([testResult1, testResult2]);
  });

  test("event subscription ignores other subscription events", async () => {
    setUpSubscription(testMethod, testSubscriptionId);
    const eventStream = apiClient.subscribeToStream(testMethod, testEventMethod, testPayload);
    const events = await eventStream.stream;
    const testResult1 = "testResult1";

    const received: unknown[] = [];
    events.subscribe((event) => received.push(event));

    const serverNotification1 = jsonRpcPayload({
      method: "other method",
      params: {
        subscription: testSubscriptionId,
        result: testResult1,
      },
    });
    mockTransport.messages.next(JSON.stringify(serverNotification1));

    expect(received).toEqual([]);

    const otherSubscriptionId = 2;
    const serverNotification2 = jsonRpcPayload({
      method: testEventMethod,
      params: {
        subscription: otherSubscriptionId,
        result: testResult1,
      },
    });
    mockTransport.messages.next(JSON.stringify(serverNotification2));

    expect(received).toEqual([]);
  });

  test("event subscription propagates errors", async () => {
    setUpSubscription(testMethod, testSubscriptionId);
    const eventStream = apiClient.subscribeToStream(testMethod, testEventMethod, testPayload);
    const events = await eventStream.stream;

    const received: unknown[] = [];
    let receivedError: Error | undefined;
    events.subscribe({
      next: (event) => received.push(event),
      error: (err) => {
        receivedError = err;
      },
    });

    const serverErrorNotification = jsonRpcPayload({
      method: testEventMethod,
      params: {
        subscription: testSubscriptionId,
        error: { code: 1, message: "Test error" },
      },
    });
    mockTransport.messages.next(JSON.stringify(serverErrorNotification));

    expect(received).toEqual([]);
    expect(receivedError?.message ?? "").toContain("Test error");
  });

  test("unsubscribe sends a message", async () => {
    const sendSpy = setUpSubscription(testMethod, testSubscriptionId);
    const eventStream = apiClient.subscribeToStream(testMethod, testEventMethod, testPayload);

    mockTransport.connectionStatusEvents.next({ status: "connected" });
    (await eventStream.stream).subscribe();

    const expectedSubscriptionRequest = jsonRpcPayload({
      id: 1,
      method: testMethod,
      params: testPayload,
    });
    expect(sendSpy).toBeCalledWith(JSON.stringify(expectedSubscriptionRequest));

    const response = eventStream.unsubscribeFromStream(testUnsubscribeMethod);
    await Promise.resolve();

    const expectedRequest = jsonRpcPayload({
      id: 2,
      method: testUnsubscribeMethod,
      params: [testSubscriptionId],
    });
    expect(sendSpy).toBeCalledWith(JSON.stringify(expectedRequest));

    const serverResponse = jsonRpcPayload({
      id: 2,
      result: true,
    });
    mockTransport.messages.next(JSON.stringify(serverResponse));

    await expect(response).resolves.toBe(true);
  });

  test("does not call unsubscribe before getting event stream", async () => {
    const sendSpy = setUpSubscription(testMethod, testSubscriptionId);
    const eventStream = apiClient.subscribeToStream(testMethod, testEventMethod, testPayload);

    await expect(eventStream.unsubscribeFromStream(testUnsubscribeMethod)).resolves.toBe(true);

    expect(sendSpy).not.toHaveBeenCalled();
  });

  test("does not call unsubscribe after close", async () => {
    const sendSpy = setUpSubscription(testMethod, testSubscriptionId);
    const eventStream = apiClient.subscribeToStream(testMethod, testEventMethod, testPayload);
    (await eventStream.stream).subscribe();
    sendSpy.mockClear();

    mockTransport.close();
    mockTransport.connectionStatusEvents.next({ status: "closed" });

    await expect(eventStream.unsubscribeFromStream(testUnsubscribeMethod)).resolves.toBe(true);

    expect(sendSpy).not.toHaveBeenCalled();
  });

  test("calls connect before calling send", async () => {
    const connectSpy = vi.spyOn(mockTransport, "connect");
    setUpSimpleServer();

    await apiClient.send("test", testPayload);
    expect(connectSpy).toHaveBeenCalledTimes(1);

    // Does not call connect the second time
    await apiClient.send("test2", testPayload);
    expect(connectSpy).toHaveBeenCalledTimes(1);
  });

  test("calls connect again after receiving a connection error", async () => {
    const connectSpy = vi.spyOn(mockTransport, "connect");
    setUpSimpleServer();

    await apiClient.send("test", testPayload);
    expect(connectSpy).toHaveBeenCalledTimes(1);

    mockTransport.connectionStatusEvents.next(testConnectionError);
    await apiClient.send("test2", testPayload);
    expect(connectSpy).toHaveBeenCalledTimes(2);
  });

  test("does not call connect again after receiving a connection error with isReconnecting = true", async () => {
    const connectSpy = vi.spyOn(mockTransport, "connect");
    setUpSimpleServer();

    await apiClient.send("test", testPayload);
    expect(connectSpy).toHaveBeenCalledTimes(1);

    mockTransport.connectionStatusEvents.next({
      ...testConnectionError,
      isReconnecting: true,
    });
    await apiClient.send("test2", testPayload);
    expect(connectSpy).toHaveBeenCalledTimes(1);
  });

  test("restores pending subscriptions after reconnecting", async () => {
    vi.spyOn(mockTransport, "reconnect").mockImplementation(async () => {
      mockTransport.connectionStatusEvents.next({ status: "connected" });
    });
    const sendSpy = setUpSubscription(testMethod, testSubscriptionId);
    const eventStream = apiClient.subscribeToStream(testMethod, testEventMethod, testPayload);
    (await eventStream.stream).subscribe();

    const expectedSubscriptionRequest = jsonRpcPayload({
      id: 1,
      method: testMethod,
      params: testPayload,
    });
    expect(sendSpy).toBeCalledWith(JSON.stringify(expectedSubscriptionRequest));
    sendSpy.mockClear();

    await mockTransport.reconnect();

    const expectedResubscribeRequest = jsonRpcPayload({
      id: 2,
      method: testMethod,
      params: testPayload,
    });
    expect(sendSpy).toBeCalledWith(JSON.stringify(expectedResubscribeRequest));
  });
});

function jsonRpcPayload(payload: Record<string, unknown>) {
  return {
    jsonrpc: "2.0",
    ...payload,
  };
}
