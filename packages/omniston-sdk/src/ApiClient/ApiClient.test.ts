import { beforeEach, describe, expect, test, vi } from "vitest";

import { ApiClient } from "./ApiClient";
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

  test("ensureConnection propagates to transport", async () => {
    const spy = vi.spyOn(mockTransport, "ensureConnection").mockResolvedValue();

    await expect(apiClient.ensureConnection()).resolves.toBeUndefined();

    expect(spy).toBeCalled();
  });

  test("method call", async () => {
    const sendSpy = vi.spyOn(mockTransport, "send");
    const expectedResponse = { testKey2: "testValue2" };

    const response = apiClient.send(testMethod, testPayload);
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

    await expect(apiClient.send(testMethod, testPayload)).rejects.toEqual(
      testError,
    );
  });

  test("returns an error if server returns an error", async () => {
    const response = apiClient.send(testMethod, testPayload);

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

  test("rejects all pending requests when transport closes the connection", async () => {
    const response = apiClient.send(testMethod, testPayload);

    mockTransport.messages.complete();

    await expect(response).rejects.toThrowError("Connection is closed");
  });

  test("closes the underlying transport", async () => {
    const closeSpy = vi.spyOn(mockTransport, "close");

    apiClient.close();

    expect(closeSpy).toHaveBeenCalledOnce();
  });

  test("unsubscribe sends a message", async () => {
    const sendSpy = vi.spyOn(mockTransport, "send");

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

    await expect(
      apiClient.unsubscribeFromStream(testMethod, testSubscriptionId),
    ).resolves.toBe(true);

    expect(sendSpy).not.toHaveBeenCalled();
  });
});

function jsonRpcPayload(payload: Record<string, unknown>) {
  return {
    jsonrpc: "2.0",
    ...payload,
  };
}
