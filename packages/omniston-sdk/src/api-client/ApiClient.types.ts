import type { Observable } from "rxjs";
import type { ApiStreamController } from "./ApiStreamController";
import type { ConnectionStatus, ConnectionStatusEvent } from "./ConnectionStatus";

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
   * Subscribes to a stream of notifications from the server.
   * @param method Method name
   * @param eventMethod Notification method name
   * @param payload Method parameters as JSON
   */
  subscribeToStream(method: string, eventMethod: string, payload: unknown): ApiStreamController;

  get connectionStatus(): ConnectionStatus;
  get connectionStatusEvents(): Observable<ConnectionStatusEvent>;
}
