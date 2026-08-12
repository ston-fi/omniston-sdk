import WebSocket from "isomorphic-ws";
import { Subject } from "rxjs";

import type { Observable } from "../types/observable";
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

  private readonly connectionStatusEventsSubject = new Subject<ConnectionStatusEvent>();
  private readonly messagesSubject = new Subject<string>();

  public readonly connectionStatusEvents: Observable<ConnectionStatusEvent> =
    this.connectionStatusEventsSubject;
  public readonly messages: Observable<string> = this.messagesSubject;

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

      this.connectionStatusEventsSubject.next({
        status: "connecting",
      });

      ws.addEventListener("open", () => {
        resolve();
        this.connectionStatusEventsSubject.next({
          status: "connected",
        });
      });

      ws.addEventListener("message", (event: WebSocket.MessageEvent) => {
        this.messagesSubject.next(event.data.toString());
      });

      ws.addEventListener("close", (event: WebSocket.CloseEvent) => {
        if (this.isClosing) {
          this.isClosing = false;
          reject(new Error("Closed by client"));
          if (this.webSocket === ws) {
            this.connectionStatusEventsSubject.next({
              status: "closed",
            });
          }
        } else {
          const error = new Error(event.reason);
          reject(error);
          if (this.webSocket === ws) {
            this.connectionStatusEventsSubject.next({
              status: "error",
              errorMessage: error.message,
            });
          }
        }
      });
    });
  }

  reconnect(): Promise<void> {
    return this.connect();
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
    if (readyState === READY_STATE_CONNECTING || readyState === READY_STATE_OPEN) {
      this.connectionStatusEventsSubject.next({
        status: "closing",
      });
    }
    this.webSocket?.close();
  }
}
