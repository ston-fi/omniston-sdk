import { beforeEach, describe, expect, test, vi } from "vitest";

import { ApiClient } from "./ApiClient";
import type { ConnectionStatusEvent } from "./ConnectionStatus";
import { MockTransport } from "./MockTransport";

describe("ApiClient tests", () => {
  const testMethod = "testMethod";
  const testPayload = { testKey: "testValue" };
  const testError = new Error("test error");
  const testSubscriptionId = 1;

  let apiClient: ApiClient;
  let mockTransport: MockTransport;

  beforeEach(() => {
    mockTransport = new MockTransport();
    apiClient = new ApiClient({ transport: mockTransport });
  });

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

    await expect(apiClient.send(testMethod, testPayload)).rejects.toThrowError(
      testError.message,
    );
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

  test("subscribe to event stream", () => {
    const events = apiClient.readStream(testMethod, testSubscriptionId);
    const testResult1 = "testResult1";
    const testResult2 = "testResult2";

    const received: unknown[] = [];
    events.subscribe((event) => received.push(event));

    const serverNotification1 = jsonRpcPayload({
      method: testMethod,
      params: {
        subscription: testSubscriptionId,
        result: testResult1,
      },
    });
    mockTransport.messages.next(JSON.stringify(serverNotification1));

    expect(received).toEqual([testResult1]);

    const serverNotification2 = jsonRpcPayload({
      method: testMethod,
      params: {
        subscription: testSubscriptionId,
        result: testResult2,
      },
    });
    mockTransport.messages.next(JSON.stringify(serverNotification2));

    expect(received).toEqual([testResult1, testResult2]);
  });

  test("event subscription ignores other subscription events", () => {
    const events = apiClient.readStream(testMethod, testSubscriptionId);
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
      method: testMethod,
      params: {
        subscription: otherSubscriptionId,
        result: testResult1,
      },
    });
    mockTransport.messages.next(JSON.stringify(serverNotification2));

    expect(received).toEqual([]);
  });

  test("event subscription propagates errors", () => {
    const events = apiClient.readStream(testMethod, testSubscriptionId);

    const received: unknown[] = [];
    let receivedError: Error | undefined;
    events.subscribe({
      next: (event) => received.push(event),
      error: (err) => {
        receivedError = err;
      },
    });

    const serverErrorNotification = jsonRpcPayload({
      method: testMethod,
      params: {
        subscription: testSubscriptionId,
        error: { code: 1, message: "Test error" },
      },
    });
    mockTransport.messages.next(JSON.stringify(serverErrorNotification));

    expect(received).toEqual([]);
    expect(receivedError?.message).toContain("Test error");
  });

  test("closes the underlying transport", async () => {
    const closeSpy = vi.spyOn(mockTransport, "close");

    apiClient.close();

    expect(closeSpy).toHaveBeenCalledOnce();
  });

  test("unsubscribe sends a message", async () => {
    const sendSpy = vi.spyOn(mockTransport, "send");

    mockTransport.connectionStatusEvents.next({ status: "connected" });

    const response = apiClient.unsubscribeFromStream(
      testMethod,
      testSubscriptionId,
    );
    await Promise.resolve();

    const expectedRequest = jsonRpcPayload({
      id: 1,
      method: testMethod,
      params: [testSubscriptionId],
    });
    expect(sendSpy).toBeCalledWith(JSON.stringify(expectedRequest));

    const serverResponse = jsonRpcPayload({
      id: 1,
      result: true,
    });
    mockTransport.messages.next(JSON.stringify(serverResponse));

    await expect(response).resolves.toBe(true);
  });

  test("does not call unsubscribe after close", async () => {
    const sendSpy = vi.spyOn(mockTransport, "send");

    apiClient.close();

    mockTransport.connectionStatusEvents.next({ status: "closed" });

    await expect(
      apiClient.unsubscribeFromStream(testMethod, testSubscriptionId),
    ).resolves.toBe(true);

    expect(sendSpy).not.toHaveBeenCalled();
  });

  test("propagates connection status events", () => {
    expect(apiClient.connectionStatus).toBe("ready");

    const capturedEvents: ConnectionStatusEvent[] = [];
    apiClient.connectionStatusEvents.subscribe((event) =>
      capturedEvents.push(event),
    );

    mockTransport.connectionStatusEvents.next({ status: "connected" });

    expect(apiClient.connectionStatus).toBe("connected");
    expect(capturedEvents).toEqual([{ status: "connected" }]);
  });

  test("calls connect before calling send", async () => {
    const connectSpy = vi.spyOn(mockTransport, "connect");
    // Make a simple server to respond on all methods
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

    await apiClient.send("test", testPayload);
    expect(connectSpy).toHaveBeenCalledTimes(1);

    // Does not call connect the second time
    await apiClient.send("test2", testPayload);
    expect(connectSpy).toHaveBeenCalledTimes(1);
  });
});

function jsonRpcPayload(payload: Record<string, unknown>) {
  return {
    jsonrpc: "2.0",
    ...payload,
  };
}
