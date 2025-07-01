import { vi } from "vitest";

type EventHandler = (event: never) => void;

export class MockWebSocket {
  private readonly eventMap = new Map<string, EventHandler>();

  constructor(public readonly url: string) {}

  public readyState = 0;

  addEventListener(event: string, handler: EventHandler) {
    this.eventMap.set(event, handler);
  }

  trigger(event: string, data?: unknown) {
    const handler = this.eventMap.get(event);
    if (!handler) {
      throw new Error("Handler is not present");
    }
    handler(data as never);
  }

  send(_message: string) {}

  close() {}
}

export const MockWebSocketConstructor = vi.fn();
