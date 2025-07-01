import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
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

  beforeAll(() => {
    MockWebSocketConstructor.mockImplementation((url: string) => {
      mockWebSocket = new MockWebSocket(url);
      return mockWebSocket;
    });
  });

  beforeEach(() => {
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
    expect(mockWebSocket.url, "test url");
  });

  test("connects on open event", async () => {
    const result = testTransport.connect();

    expect(capturedEvents).toEqual([{ status: "connecting" }]);

    mockWebSocket.trigger("open");

    expect(capturedEvents).toEqual([
      { status: "connecting" },
      { status: "connected" },
    ]);

    await expect(result).resolves.toBeUndefined();
  });

  test("propagates messages", () => {
    testTransport.connect();

    mockWebSocket.trigger("message", { data: "hello" });

    expect(capturedMessages).toEqual(["hello"]);
  });

  test("can send messages", async () => {
    testTransport.connect();

    const sendSpy = vi.spyOn(mockWebSocket, "send");

    mockWebSocket.readyState = 1; // open
    await expect(testTransport.send("hello")).resolves.toBeUndefined();
    expect(sendSpy).toHaveBeenCalledWith("hello");
  });

  test("can't send messages before calling connect", async () => {
    await expect(testTransport.send("hello")).rejects.toThrowError(
      "WebSocket is not ready",
    );
  });

  test("can't send messages if the ready state isn't open", async () => {
    testTransport.connect();

    mockWebSocket.readyState = 0; // connecting

    await expect(testTransport.send("hello")).rejects.toThrowError(
      "WebSocket is not ready",
    );
  });

  test("can close transport by client", async () => {
    const result = testTransport.connect();
    capturedEvents = [];

    const closeSpy = vi.spyOn(mockWebSocket, "close");

    testTransport.close();
    expect(capturedEvents).toEqual([{ status: "closing" }]);
    expect(closeSpy).toHaveBeenCalledOnce();

    mockWebSocket.trigger("close");
    expect(capturedEvents).toEqual([
      { status: "closing" },
      { status: "closed" },
    ]);

    await expect(result).rejects.toThrowError("Closed by client");
  });

  test("propagates errors", async () => {
    const result = testTransport.connect();
    capturedEvents = [];

    mockWebSocket.trigger("close", { reason: "test error" });

    expect(capturedEvents).toEqual([
      { status: "error", errorMessage: "test error" },
    ]);

    await expect(result).rejects.toThrowError("test error");
  });

  test("does not send closing event if the socket is already closing", () => {
    testTransport.connect();
    capturedEvents = [];

    mockWebSocket.readyState = 2; // closing

    testTransport.close();
    expect(capturedEvents).toEqual([]);
  });

  test("closes previous websocket instance on connect", async () => {
    testTransport.connect();

    const closeSpy = vi.spyOn(mockWebSocket, "close");

    testTransport.connect();
    expect(closeSpy).toHaveBeenCalledOnce();
  });
});
