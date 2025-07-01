import WebSocket from "isomorphic-ws";
import { Subject } from "rxjs";

import type { ConnectionStatusEvent } from "./ConnectionStatus";
import type { Transport } from "./Transport";

const READY_STATE_CONNECTING = 0;
const READY_STATE_OPEN = 1;

/**
 * WebSocket implementation of {@link Transport}.
 */
export class WebSocketTransport implements Transport {
  private webSocket: WebSocket | undefined;
  private isClosing = false;

  public readonly connectionStatusEvents = new Subject<ConnectionStatusEvent>();
  public readonly messages = new Subject<string>();

  /**
   * @param url WebSocket server URL
   */
  constructor(private readonly url: string | URL) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.webSocket?.close();
      this.isClosing = false;

      const ws = new WebSocket(this.url);
      this.webSocket = ws;

      this.connectionStatusEvents.next({
        status: "connecting",
      });

      ws.addEventListener("open", () => {
        resolve();
        this.connectionStatusEvents.next({
          status: "connected",
        });
      });

      ws.addEventListener("message", (event) => {
        this.messages.next(event.data.toString());
      });

      ws.addEventListener("close", (event) => {
        if (this.isClosing) {
          this.isClosing = false;
          reject(new Error("Closed by client"));
          this.connectionStatusEvents.next({
            status: "closed",
          });
        } else {
          const error = new Error(event.reason);
          reject(error);
          this.connectionStatusEvents.next({
            status: "error",
            errorMessage: error.message,
          });
        }
      });
    });
  }

  send(message: string): Promise<void> {
    if (this.webSocket?.readyState !== READY_STATE_OPEN) {
      return Promise.reject(new Error("WebSocket is not ready"));
    }
    try {
      this.webSocket.send(message);
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }

  close(): void {
    this.isClosing = true;
    const readyState = this.webSocket?.readyState;
    if (
      readyState === READY_STATE_CONNECTING ||
      readyState === READY_STATE_OPEN
    ) {
      this.connectionStatusEvents.next({
        status: "closing",
      });
    }
    this.webSocket?.close();
  }
}
