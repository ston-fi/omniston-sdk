import type { Observable } from "rxjs";
import type {
  ConnectionStatus,
  ConnectionStatusEvent,
} from "./ConnectionStatus";

/**
 * A client to communicate with Omniston API.
 */
export interface IApiClient {
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
  /**
   * A stream of connection status changes.
   *
   * @see ConnectionStatusEvent
   */
  get connectionStatusEvents(): Observable<ConnectionStatusEvent>;
  /**
   * Current connection status.
   *
   * @see ConnectionStatus
   */
  get connectionStatus(): ConnectionStatus;
}
