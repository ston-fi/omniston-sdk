import type { Observable } from "rxjs";

/**
 * Transport to handle sending and receiving messages which can be serialized and deserialized as strings.
 */
export interface Transport {
  /**
   * Ensures that the transport is connected and functioning.
   * Rejects if the underlying connection is closed or is in an invalid state.
   */
  ensureConnection(): Promise<void>;
  /**
   * A stream of server-sent messages.
   */
  messages: Observable<string>;
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
