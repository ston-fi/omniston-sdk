import {
  JSONRPCClient,
  JSONRPCErrorException,
  type JSONRPCParams,
  JSONRPCServer,
  JSONRPCServerAndClient,
} from "json-rpc-2.0";
import { BehaviorSubject, Observable } from "rxjs";
import { isJSONRPCError } from "../helpers/isJSONRPCError";
import type { Logger } from "../logger/Logger";
import type { IApiClient } from "./ApiClient.types";
import { ApiStreamController } from "./ApiStreamController";
import type { ConnectionStatus, ConnectionStatusEvent } from "./ConnectionStatus";
import type { Transport } from "./Transport";

type StreamConsumer = (err: unknown | undefined, data: unknown) => void;
type StreamConsumerMap = Map<number, StreamConsumer>;

type StreamPayload =
  | { subscription: number; result: unknown }
  | { subscription: number; error: unknown }
  | { subscription: number };

export interface ApiClientOptions {
  /**
   * A transport to use.
   */
  transport: Transport;
  /**
   * Optional {@link Logger} implementation.
   */
  logger?: Logger;
}

/**
 * A default implementation for Omniston protocol client.
 * Uses JSON RPC to communicate over the given transport.
 */
export class ApiClient implements IApiClient {
  private readonly serverAndClient: JSONRPCServerAndClient;
  private readonly transport: Transport;
  private readonly logger?: Logger;
  private connection: Promise<void> | undefined;

  private streamConsumers = new Map<string, StreamConsumerMap>();

  public readonly connectionStatusEvents = new BehaviorSubject<ConnectionStatusEvent>({
    status: "ready",
  });

  constructor(options: ApiClientOptions) {
    this.transport = options.transport;
    this.logger = options.logger;

    this.serverAndClient = new JSONRPCServerAndClient(
      new JSONRPCServer(),
      new JSONRPCClient((request) => this.transport.send(JSON.stringify(request))),
    );

    this.transport.messages.subscribe((message) => {
      this.logger?.debug(`Received: ${message}`);
      this.serverAndClient.receiveAndSend(JSON.parse(message));
    });

    this.transport.connectionStatusEvents.subscribe(this.connectionStatusEvents);
  }

  public get connectionStatus(): ConnectionStatus {
    return this.connectionStatusEvents.value.status;
  }

  /**
   * Ensures that the client is connected to the API server.
   * Rejects if the underlying connection is closed or is in an invalid state.
   * Rejects if close() method was called.
   */
  private ensureConnection(): Promise<void> {
    const lastConnectionEvent = this.connectionStatusEvents.value;
    if (
      !this.connection ||
      (lastConnectionEvent.status === "error" && !lastConnectionEvent.isReconnecting)
    ) {
      this.connection = this.transport.connect();
    }
    return this.connection;
  }

  /**
   * Calls a method on the API, returning the result as JSON.
   * @param method Method name
   * @param payload Method parameters as JSON
   */
  async send(method: string, payload: JSONRPCParams): Promise<unknown> {
    await this.ensureConnection();
    this.logger?.debug(`Sending: method=${method} payload=${JSON.stringify(payload)}`);
    return this.serverAndClient.request(method, payload);
  }

  subscribeToStream(
    method: string,
    eventMethod: string,
    payload: JSONRPCParams,
  ): ApiStreamController {
    return new ApiStreamController({
      apiClient: {
        send: (method, payload) => this.send(method, payload),
        readStream: (method, subscriptionId) => this.readStream(method, subscriptionId),
      },
      connectionStatusEvents: this.connectionStatusEvents,
      method,
      eventMethod,
      payload,
    });
  }

  /**
   * Returns a stream of notifications from the server.
   * @param method Event name (passed as 'method' in JSON RPC)
   * @param subscriptionId An unique id, assigned by the server
   * @returns JSON-encoded notifications
   */
  private readStream(method: string, subscriptionId: number): Observable<unknown> {
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

  private getStreamConsumerMap(method: string): StreamConsumerMap {
    let result = this.streamConsumers.get(method);
    if (result) return result;
    result = new Map();
    this.streamConsumers.set(method, result);
    this.serverAndClient.addMethod(method, (payload: StreamPayload) => {
      const consumer = result.get(payload.subscription);
      if ("error" in payload) {
        const payloadError = payload.error;

        const serverError = isJSONRPCError(payloadError)
          ? new JSONRPCErrorException(payloadError.message, payloadError.code, payloadError.data)
          : new Error(`Server error: ${JSON.stringify(payloadError)}`);

        consumer?.(serverError, undefined);
      } else if ("result" in payload) {
        consumer?.(undefined, payload.result);
      } else {
        consumer?.(undefined, undefined);
      }
    });
    return result;
  }
}
