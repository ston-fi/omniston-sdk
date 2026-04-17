import type { JSONRPCParams } from "json-rpc-2.0";
import { Observable, Subject, Subscription } from "rxjs";

import type { ConnectionStatusEvent } from "./ConnectionStatus";

export interface ApiClientWrapper {
  send(method: string, payload: JSONRPCParams): Promise<unknown>;
  readStream(method: string, subscriptionId: number): Observable<unknown>;
}

export interface ApiStreamControllerOptions {
  apiClient: ApiClientWrapper;
  connectionStatusEvents: Observable<ConnectionStatusEvent>;
  method: string;
  eventMethod: string;
  payload: JSONRPCParams;
}

/**
 * Wraps a server-push JSON-RPC subscription and exposes it as a stable RxJS Observable.
 *
 * On first access to `.stream`, calls `send(method, payload)` to open the subscription
 * and receives a `subscriptionId` from the server. Events arrive via `readStream(eventMethod, id)`
 * and are forwarded to all subscribers of `.stream`.
 *
 * When the transport drops and reconnects, the controller transparently re-opens the subscription
 * (new `send` call, new `subscriptionId`) without interrupting the consumer's Observable chain.
 *
 * When the server sends `eventMethod.closed`, `.stream` completes and `.streamClosedByServer`
 * emits — no further reconnect attempts are made.
 *
 * ```
 *        Server                 ApiStreamController              Consumer
 *          │                           │                            │
 *          │                           │◄── subscribe .stream ──────│
 *          │◄── send(method) ──────────│                            │
 *          │─── subscriptionId ───────►│                            │
 *          │                           │                            │
 *          │── event (eventMethod) ───►│─── .stream event ─────────►│
 *          │── event (eventMethod) ───►│─── .stream event ─────────►│
 *          │                           │                            │
 *          │  [transport drop]         │                            │
 *          │      ·  ·  ·              │  (stream stays open)       │
 *          │  [reconnected]            │                            │
 *          │◄── send(method) ──────────│  (re-subscribes)           │
 *          │─── new subscriptionId ───►│                            │
 *          │── event (eventMethod) ───►│─── .stream event ─────────►│
 *          │                           │                            │
 *          │── eventMethod.closed ────►│─── .streamClosedByServer ─►│
 *          │                           │─── .stream complete ──────►│
 * ```
 */
export class ApiStreamController {
  private readonly options: ApiStreamControllerOptions;

  private isInStreamClosedByServer = false;
  private inStreamLastConnectionStatusEvent: ConnectionStatusEvent | undefined;
  private inStreamSubscriptions = new Subscription();
  private inStreamSubscriptionId: number | undefined;

  private outStreamSubject = new Subject<unknown>();
  private outStreamClosedByServerSubject = new Subject<void>();
  private outStream = this.createOutStream();
  private outStreamInitializationPromise: Promise<void> | undefined;

  constructor(options: ApiStreamControllerOptions) {
    this.options = options;
  }

  private get apiClient() {
    return this.options.apiClient;
  }

  public get subscriptionId() {
    return this.inStreamSubscriptionId;
  }

  get stream(): Promise<Observable<unknown>> {
    if (!this.outStreamInitializationPromise) {
      this.outStreamInitializationPromise = this.subscribeToInStream();
    }

    return this.outStreamInitializationPromise.then(() => this.outStream);
  }

  public get streamClosedByServer(): Observable<void> {
    return this.outStreamClosedByServerSubject;
  }

  public async unsubscribeFromStream(method: string): Promise<unknown> {
    if (
      this.inStreamLastConnectionStatusEvent?.status !== "connected" ||
      this.subscriptionId === undefined
    ) {
      // Do not try to unsubscribe if not already connected.
      return true;
    }

    return await this.apiClient.send(method, [this.subscriptionId]);
  }

  private createOutStream() {
    return new Observable((subscriber) => {
      const connectionEventSubscription = this.options.connectionStatusEvents.subscribe((event) =>
        this.handleConnectionEvent(event),
      );
      const subscription = this.outStreamSubject.subscribe(subscriber);

      return () => {
        subscription.unsubscribe();
        connectionEventSubscription.unsubscribe();
        this.resetInStreamSubscriptions();
        this.inStreamSubscriptionId = undefined;
      };
    });
  }

  private async subscribeToInStream() {
    this.resetInStreamSubscriptions();

    const result = await this.apiClient.send(this.options.method, this.options.payload);

    if (typeof result !== "number") {
      throw new Error(`Expected subscription id, but got "${result}"`);
    }

    const subscriptionId = result;
    const inStream = this.apiClient.readStream(this.options.eventMethod, subscriptionId);
    const inStreamClosedByServer = this.apiClient.readStream(
      `${this.options.eventMethod}.closed`,
      subscriptionId,
    );
    this.inStreamSubscriptionId = subscriptionId;
    // Pipe all updates from the inner stream to the outer stream.
    this.inStreamSubscriptions.add(inStream.subscribe(this.outStreamSubject));
    this.inStreamSubscriptions.add(
      inStreamClosedByServer.subscribe(() => this.handleInStreamClosedByServer()),
    );
  }

  private handleConnectionEvent(event: ConnectionStatusEvent) {
    const isFirstEvent = this.inStreamLastConnectionStatusEvent === undefined;
    this.inStreamLastConnectionStatusEvent = event;

    if (event.status === "connected" && !isFirstEvent && !this.isInStreamClosedByServer) {
      this.subscribeToInStream();
    }
  }

  private handleInStreamClosedByServer() {
    if (this.isInStreamClosedByServer) {
      return;
    }

    this.isInStreamClosedByServer = true;
    this.resetInStreamSubscriptions();
    this.outStreamClosedByServerSubject.next();
    this.outStreamClosedByServerSubject.complete();
    this.outStreamSubject.complete();
  }

  private resetInStreamSubscriptions() {
    this.inStreamSubscriptions.unsubscribe();
    this.inStreamSubscriptions = new Subscription();
  }
}
