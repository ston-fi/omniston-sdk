import { beforeEach, describe, expect, test, vi } from "vitest";
import { MockWebSocket, MockWebSocketConstructor } from "./MockWebSocket";

vi.mock("isomorphic-ws", () => {
  return {
    default: MockWebSocketConstructor,
  };
});

import type { ConnectionStatusEvent } from "./ConnectionStatus";
import { WebSocketTransport } from "./WebSocketTransport";

describe("WebSocketTransport tests", () => {
  let mockWebSocket: MockWebSocket;
  let testTransport: WebSocketTransport;
  let capturedMessages: string[];
  let capturedEvents: ConnectionStatusEvent[];

  beforeEach(() => {
    MockWebSocketConstructor.mockClear();
    testTransport = new WebSocketTransport("");

    capturedEvents = [];
    testTransport.connectionStatusEvents.subscribe((event) => {
      capturedEvents.push(event);
    });

    capturedMessages = [];
    testTransport.messages.subscribe((message) => {
      capturedMessages.push(message);
    });
  });

  test("passes the url to WebSocket", () => {
    const testTransport = new WebSocketTransport("test url");
    testTransport.connect();
    mockWebSocket = MockWebSocketConstructor.mock.results[0]?.value as MockWebSocket;
    expect(mockWebSocket.url).toBe("test url");
  });

  test("connects on open event", async () => {
    const result = testTransport.connect();
    mockWebSocket = MockWebSocketConstructor.mock.results[0]?.value as MockWebSocket;

    expect(capturedEvents).toEqual([{ status: "connecting" }]);

    mockWebSocket.trigger("open");

    expect(capturedEvents).toEqual([{ status: "connecting" }, { status: "connected" }]);

    await expect(result).resolves.toBeUndefined();
  });

  test("propagates messages", () => {
    testTransport.connect();
    mockWebSocket = MockWebSocketConstructor.mock.results[0]?.value as MockWebSocket;

    mockWebSocket.trigger("message", { data: "hello" });

    expect(capturedMessages).toEqual(["hello"]);
  });

  test("can send messages", async () => {
    testTransport.connect();
    mockWebSocket = MockWebSocketConstructor.mock.results[0]?.value as MockWebSocket;

    const sendSpy = vi.spyOn(mockWebSocket, "send");

    mockWebSocket.readyState = 1; // open
    await expect(testTransport.send("hello")).resolves.toBeUndefined();
    expect(sendSpy).toHaveBeenCalledWith("hello");
  });

  test("can't send messages before calling connect", async () => {
    await expect(testTransport.send("hello")).rejects.toThrowError("WebSocket is not ready");
  });

  test("can't send messages if the ready state isn't open", async () => {
    testTransport.connect();
    mockWebSocket = MockWebSocketConstructor.mock.results[0]?.value as MockWebSocket;

    mockWebSocket.readyState = 0; // connecting

    await expect(testTransport.send("hello")).rejects.toThrowError("WebSocket is not ready");
  });

  test("can close transport by client", async () => {
    const result = testTransport.connect();
    mockWebSocket = MockWebSocketConstructor.mock.results[0]?.value as MockWebSocket;
    capturedEvents = [];

    const closeSpy = vi.spyOn(mockWebSocket, "close");

    testTransport.close();
    expect(capturedEvents).toEqual([{ status: "closing" }]);
    expect(closeSpy).toHaveBeenCalledOnce();

    mockWebSocket.trigger("close");
    expect(capturedEvents).toEqual([{ status: "closing" }, { status: "closed" }]);

    await expect(result).rejects.toThrowError("Closed by client");
  });

  test("propagates errors", async () => {
    const result = testTransport.connect();
    mockWebSocket = MockWebSocketConstructor.mock.results[0]?.value as MockWebSocket;
    capturedEvents = [];

    mockWebSocket.trigger("close", { reason: "test error" });

    expect(capturedEvents).toEqual([{ status: "error", errorMessage: "test error" }]);

    await expect(result).rejects.toThrowError("test error");
  });

  test("does not send closing event if the socket is already closing", () => {
    testTransport.connect();
    mockWebSocket = MockWebSocketConstructor.mock.results[0]?.value as MockWebSocket;
    capturedEvents = [];

    mockWebSocket.readyState = 2; // closing

    testTransport.close();
    expect(capturedEvents).toEqual([]);
  });

  test("closes previous websocket instance on connect", async () => {
    testTransport.connect();
    mockWebSocket = MockWebSocketConstructor.mock.results[0]?.value as MockWebSocket;

    const closeSpy = vi.spyOn(mockWebSocket, "close");

    testTransport.connect();
    expect(closeSpy).toHaveBeenCalledOnce();
  });

  test("closes previous websocket instance on reconnect", async () => {
    testTransport.connect();
    mockWebSocket = MockWebSocketConstructor.mock.results[0]?.value as MockWebSocket;

    const closeSpy = vi.spyOn(mockWebSocket, "close");

    testTransport.reconnect();
    expect(closeSpy).toHaveBeenCalledOnce();
  });

  test("does not emit error events on reconnect", async () => {
    testTransport.connect().catch((_) => {});
    mockWebSocket = MockWebSocketConstructor.mock.results[0]?.value as MockWebSocket;

    expect(capturedEvents).toEqual([{ status: "connecting" }]);
    const prevWebSocket = mockWebSocket;

    testTransport.reconnect();
    mockWebSocket = MockWebSocketConstructor.mock.results[1]?.value as MockWebSocket;
    expect(mockWebSocket).not.toBe(prevWebSocket);
    prevWebSocket.trigger("close", {});
    expect(capturedEvents).toEqual([{ status: "connecting" }, { status: "connecting" }]);
  });
});
