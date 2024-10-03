import {
  JSONRPCClient,
  JSONRPCServer,
  JSONRPCServerAndClient,
  type JSONRPCParams,
} from "json-rpc-2.0";
import { Observable } from "rxjs";

import type { IApiClient } from "./ApiClient.types";
import type { Transport } from "./Transport";

type StreamConsumer = (err: unknown | undefined, data: unknown) => void;
type StreamConsumerMap = Map<number, StreamConsumer>;

type StreamPayload = { subscription: number } & (
  | { result: unknown }
  | { error: unknown }
);

/**
 * A default implementation for Omniston protocol client.
 * Uses JSON RPC to communicate over the given transport.
 */
export class ApiClient implements IApiClient {
  private readonly serverAndClient: JSONRPCServerAndClient;
  private streamConsumers = new Map<string, StreamConsumerMap>();

  // TODO: use abort controller to cancel requests and pass signal to transport
  private isClosed = false;

  /**
   * @param transport A transport to use.
   */
  constructor(private readonly transport: Transport) {
    this.serverAndClient = new JSONRPCServerAndClient(
      new JSONRPCServer(),
      new JSONRPCClient((request) => transport.send(JSON.stringify(request))),
    );

    transport.messages.subscribe({
      next: (message) => {
        console.debug(`Received: ${message}`);
        this.serverAndClient.receiveAndSend(JSON.parse(message));
      },
      complete: () => {
        this.serverAndClient.rejectAllPendingRequests("Connection is closed");
      },
    });
  }

  /**
   * Ensures that the client is connected to the API server.
   * Rejects if the underlying connection is closed or is in an invalid state.
   */
  ensureConnection(): Promise<void> {
    return this.transport.ensureConnection();
  }

  /**
   * Calls a method on the API, returning the result as JSON.
   * @param method Method name
   * @param payload Method parameters as JSON
   */
  async send(method: string, payload: JSONRPCParams): Promise<unknown> {
    console.debug(
      `Sending: method=${method} payload=${JSON.stringify(payload)}`,
    );
    return this.serverAndClient.request(method, payload);
  }

  /**
   * Returns a stream of notifications from the server.
   * @param method Event name (passed as 'method' in JSON RPC)
   * @param subscriptionId An unique id, assigned by the server
   * @returns JSON-encoded notifications
   */
  readStream(method: string, subscriptionId: number): Observable<unknown> {
    return new Observable((subscriber) => {
      this.getStreamConsumerMap(method).set(subscriptionId, (err, data) => {
        if (err) {
          subscriber.error(err);
          return;
        }
        subscriber.next(data);
      });

      return () => {
        this.streamConsumers.get(method)?.delete(subscriptionId);
      };
    });
  }

  /**
   * Unsubscribes from a stream of notifications, notifying the server that no further updates is needed.
   * @param method Notification method name
   * @param subscriptionId An unique id, assigned by the server
   */
  async unsubscribeFromStream(
    method: string,
    subscriptionId: number,
  ): Promise<unknown> {
    if (this.isClosed) {
      // Do not try to unsubscribe if the connection is already closed, the server should unsubscribe automatically.
      return true;
    }
    await this.ensureConnection();
    return await this.send(method, [subscriptionId]);
  }

  /**
   * Closes the connection and rejects all pending requests. Further requests will throw an error.
   */
  close() {
    this.transport.close();
    this.isClosed = true;
  }

  private getStreamConsumerMap(method: string): StreamConsumerMap {
    let result = this.streamConsumers.get(method);
    if (result) return result;
    result = new Map();
    this.serverAndClient.addMethod(method, (payload: StreamPayload) => {
      const consumer = result.get(payload.subscription);
      if ("error" in payload) {
        consumer?.(
          new Error(`Server error: ${JSON.stringify(payload.error)}`),
          undefined,
        );
      } else {
        consumer?.(undefined, payload.result);
      }
    });
    return result;
  }
}
