import type { Observable } from "rxjs";
import type { ConnectionStatusEvent } from "./ConnectionStatus";

/**
 * Transport to handle sending and receiving messages which can be serialized and deserialized as strings.
 */
export interface Transport {
  /**
   * A stream of server-sent messages.
   */
  get messages(): Observable<string>;
  /**
   * A stream of connection status events.
   */
  get connectionStatusEvents(): Observable<ConnectionStatusEvent>;
  /**
   * Makes a new connection to the server. Rejects on connection errors.
   */
  connect(): Promise<void>;
  /**
   * Sends a message to the server.
   * @param message A message to send.
   */
  send(message: string): Promise<void>;
  /**
   * Closes the underlying connection.
   */
  close(): void;
}
