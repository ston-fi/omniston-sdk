import WebSocket from "isomorphic-ws";
import { Subject } from "rxjs";

import type { Transport } from "./Transport";

/**
 * WebSocket implementation of {@link Transport}.
 */
export class WebSocketTransport implements Transport {
  private webSocket: WebSocket | undefined;
  private connection: Promise<void> | undefined;
  private isClosed = false;
  private closeReason: unknown;

  public readonly messages = new Subject<string>();

  /**
   * @param url WebSocket server URL
   */
  constructor(private readonly url: string | URL) {}

  async ensureConnection(): Promise<void> {
    if (this.isClosed) {
      throw new Error("Connection is closed", { cause: this.closeReason });
    }
    this.connection ??= this.connect();
    return this.connection;
  }

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isClosed) {
        reject("Connection is closed");
        return;
      }

      const ws = new WebSocket(this.url);

      this.webSocket = ws;

      ws.addEventListener("open", () => {
        resolve();
      });

      ws.addEventListener("message", (event) => {
        this.messages.next(event.data.toString());
      });

      ws.addEventListener("close", (event) => {
        this.isClosed = true;
        this.closeReason = event.reason;
        reject(this.closeReason);
        this.messages.complete();
      });
    });
  }

  send(message: string): Promise<void> {
    if (!this.webSocket) {
      return Promise.reject(
        "WebSocket is not initialized, did you forget to call ensureConnection()?",
      );
    }
    try {
      this.webSocket.send(message);
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }

  close(): void {
    this.webSocket?.close();
    this.isClosed = true;
  }
}
