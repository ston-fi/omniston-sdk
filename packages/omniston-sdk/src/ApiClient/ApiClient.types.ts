import type { Observable } from "rxjs";

/**
 * A client to communicate with Omniston API.
 */
export interface IApiClient {
  /**
   * Ensures that the client is connected to the API server.
   * Rejects if the underlying connection is closed or is in an invalid state.
   */
  ensureConnection(): Promise<void>;
  /**
   * Calls a method on the API, returning the result as JSON.
   * @param method Method name
   * @param payload Method parameters as JSON
   */
  send(method: string, payload: unknown): Promise<unknown>;
  /**
   * Returns a stream of notifications from the server.
   * @param method Notification method name
   * @param subscriptionId An unique id, assigned by the server
   * @returns JSON-encoded notifications
   */
  readStream(method: string, subscriptionId: number): Observable<unknown>;
  /**
   * Unsubscribes from a stream of notifications, notifying the server that no further updates is needed.
   * @param method Notification method name
   * @param subscriptionId An unique id, assigned by the server
   */
  unsubscribeFromStream(
    method: string,
    subscriptionId: number,
  ): Promise<unknown>;
  /**
   * Closes the connection and rejects all pending requests.
   */
  close(): void;
}
