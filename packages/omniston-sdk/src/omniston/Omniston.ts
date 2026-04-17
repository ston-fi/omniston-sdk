import {
  filter,
  finalize,
  map,
  mergeWith,
  type OperatorFunction,
  type Observable as RxObservable,
} from "rxjs";
import {
  BuildEvmOrderCancellationRequest,
  BuildEvmOrderPayloadRequest,
  EvmOrderCancellationResponse,
  EvmOrderPayloadResponse,
} from "../api/messages/stonfi/omni/v1beta8/trader/chains/evm";
import {
  BuildTonEscrowCancellationRequest,
  BuildTonEscrowTransferRequest,
  BuildTonSwapRequest,
  TonEscrowVaultBalancesRequest,
  TonEscrowVaultBalancesResponse,
} from "../api/messages/stonfi/omni/v1beta8/trader/chains/ton";
import {
  ActiveOrdersRequest,
  ActiveOrdersResponse,
  CancelSignedOrderRequest,
  CancelSignedOrderResponse,
  DiscloseHtlcSecretRequest,
  RegisterSignedOrderRequest,
  TrackOrderRequest,
} from "../api/messages/stonfi/omni/v1beta8/trader/order";
import { QuoteEvent } from "../api/messages/stonfi/omni/v1beta8/trader/quote";
import { TrackSwapRequest } from "../api/messages/stonfi/omni/v1beta8/trader/swap";
import { OrderStatusEvent } from "../api/messages/stonfi/omni/v1beta8/types/order";
import { QuoteRequest } from "../api/messages/stonfi/omni/v1beta8/types/quote";
import { SwapProgressEvent } from "../api/messages/stonfi/omni/v1beta8/types/swap";
import { TonTransaction } from "../api/messages/stonfi/omni/v1beta8/types/ton";
import { ApiClient } from "../api-client/ApiClient";
import type { ApiStreamController } from "../api-client/ApiStreamController";
import { AutoReconnectTransport } from "../api-client/AutoReconnectTransport";
import type { Transport } from "../api-client/Transport";
import { WebSocketTransport } from "../api-client/WebSocketTransport";
import { ErrorCode } from "../constants";
import { Timer } from "../helpers/timer/Timer";
import { toSimpleObservable } from "../helpers/toSimpleObservable";
import { unwrapObservable } from "../helpers/unwrapObservable";
import { wrapErrorsAsync } from "../helpers/wrapError";
import type { Logger } from "../logger/Logger";
import type { Observable } from "../types/observable";
import type { OneOf, OneOfValue } from "../types/oneOf";

import { RPC } from "./constants";
import { OmnistonError } from "./OmnistonError";

export type UnsubscribeEvent = OneOf<"unsubscribed", undefined>;

export type QuoteEventWithRfqId = QuoteEvent["event"] extends infer E
  ? E extends { $case: "ack" }
    ? E
    : E & { rfqId: string }
  : never;

/**
 * Dependencies used to construct an Omniston instance.
 *
 * {@see Omniston}
 */
export interface OmnistonDependencies {
  /**
   * Optional. Provide this if you want to override the default network transport.
   * By default, this will be {@link AutoReconnectTransport} with underlying {@link WebSocketTransport}
   */
  readonly transport?: Transport;
  /**
   * Omniston WebSocket API URL.
   *
   * {@example `wss://omni-ws.ston.fi`}
   */
  readonly apiUrl: URL | string;
  /**
   * An optional {@link Logger} implementation. By default, no logs are produced.
   *
   * You can pass `console` here, it is compatible with Logger interface.
   */
  readonly logger?: Logger;
}

/**
 * The main class for the Omniston Trader SDK.
 *
 * Represents a service to perform Trader operations. Supports RequestForQuote, BuildTransaction, and TrackTrade operations.
 *
 * The class is closeable - use {@link Omniston.close} to close the underlying WebSocket connection.
 */
export class Omniston {
  private readonly _apiClient: ApiClient;
  private readonly _transport: Transport;
  private readonly _logger?: Logger;

  /**
   * Constructor.
   *
   * @param dependencies {@see OmnistonDependencies}
   */
  constructor(dependencies: OmnistonDependencies) {
    this._logger = dependencies.logger;
    this._transport =
      dependencies.transport ??
      new AutoReconnectTransport({
        transport: new WebSocketTransport(dependencies.apiUrl),
        timer: new Timer(),
        logger: this._logger,
      });
    this._apiClient = new ApiClient({
      transport: this._transport,
      logger: this._logger,
    });
  }

  /**
   * Current transport.
   *
   * @see Transport
   */
  public get transport() {
    return this._transport;
  }

  /**
   * Current connection status.
   *
   * @see ConnectionStatus
   */
  public get connectionStatus() {
    return this._apiClient.connectionStatus;
  }

  /**
   * A stream of connection status changes. Will always emit current status on new subscriptions.
   *
   * @see ConnectionStatusEvent
   */
  public get connectionStatusEvents() {
    return this._apiClient.connectionStatusEvents;
  }

  /// --- Request for quote ----------------------------------------------------

  /**
   * Request for quote.
   *
   * The server sends the stream of quotes in response, so that each next quote overrides previous one.
   * This may occur either because the newer quote has better terms or because the older has expired.
   *
   * If there are no resolvers providing quotes after an old quote has expired, {@constant null} is sent to the Observable.
   *
   * @param request Request for quote. {@see QuoteRequest}
   * @returns Observable representing the stream of quote updates.
   * The request to the API server is made after subscribing to the Observable.
   * The client is responsible for unsubscribing from the Observable when not interested in further updates
   * (either after starting the trade or when cancelling the request).
   */
  public readonly requestForQuote = this._rxToSimpleObservable(async function (
    this: Omniston,
    request: QuoteRequest,
  ) {
    const quoteStream = this._apiClient.subscribeToStream(
      RPC.QUOTE.QUOTE.SUBSCRIBE,
      RPC.QUOTE.QUOTE.EVENT,
      QuoteRequest.toJSON(request),
    );

    let rfqId: OneOfValue<NonNullable<QuoteEvent["event"]>, "ack">["rfqId"] | undefined;

    const quoteEvents = (await quoteStream.stream).pipe(
      map((e) => QuoteEvent.fromJSON(e).event),
      filter(
        (quoteEvent) =>
          quoteEvent?.$case === "ack" ||
          quoteEvent?.$case === "quoteUpdated" ||
          quoteEvent?.$case === "noQuote",
      ),
      map((quoteEvent) => {
        if (quoteEvent.$case === "ack") {
          rfqId = quoteEvent.value.rfqId;

          return quoteEvent;
        }

        if (!rfqId) {
          throw new OmnistonError(
            ErrorCode.UNKNOWN,
            `Received "${quoteEvent.$case}" before "ack" event`,
          );
        }

        return {
          ...quoteEvent,
          rfqId,
        };
      }),
      this._rxTapUnsubscribeLifecycle(RPC.QUOTE.QUOTE.UNSUBSCRIBE, quoteStream),
    );

    return quoteEvents;
  });

  // --- TON -------------------------------------------------------------------

  public tonGetEscrowVaultBalances = this._rpcMethodFactory({
    method: RPC.TON.GET_ESCROW_VAULT_BALANCES,
    requestSerializer: TonEscrowVaultBalancesRequest.toJSON,
    responseDeserializer: TonEscrowVaultBalancesResponse.fromJSON,
  });

  public tonBuildSwap = this._rpcMethodFactory({
    method: RPC.TON.BUILD_SWAP,
    requestSerializer: BuildTonSwapRequest.toJSON,
    responseDeserializer: TonTransaction.fromJSON,
  });

  public tonBuildEscrowTransfer = this._rpcMethodFactory({
    method: RPC.TON.BUILD_ESCROW_TRANSFER,
    requestSerializer: BuildTonEscrowTransferRequest.toJSON,
    responseDeserializer: TonTransaction.fromJSON,
  });

  public tonBuildEscrowCancellation = this._rpcMethodFactory({
    method: RPC.TON.BUILD_ESCROW_CANCELLATION,
    requestSerializer: BuildTonEscrowCancellationRequest.toJSON,
    responseDeserializer: TonTransaction.fromJSON,
  });

  // --- EVM -------------------------------------------------------------------

  public evmBuildOrderPayload = this._rpcMethodFactory({
    method: RPC.EVM.BUILD_ORDER_PAYLOAD,
    requestSerializer: BuildEvmOrderPayloadRequest.toJSON,
    responseDeserializer: EvmOrderPayloadResponse.fromJSON,
  });

  public evmBuildOrderCancellation = this._rpcMethodFactory({
    method: RPC.EVM.BUILD_ORDER_CANCELLATION,
    requestSerializer: BuildEvmOrderCancellationRequest.toJSON,
    responseDeserializer: EvmOrderCancellationResponse.fromJSON,
  });

  // --- Swap ------------------------------------------------------------------

  public swapTrack = this._rxToSimpleObservable(async function (
    this: Omniston,
    request: TrackSwapRequest,
  ) {
    const swapTrackStream = this._apiClient.subscribeToStream(
      RPC.SWAP.TRACK.SUBSCRIBE,
      RPC.SWAP.TRACK.EVENT,
      TrackSwapRequest.toJSON(request),
    );

    const swapTrackEvents = (await swapTrackStream.stream).pipe(
      map((e) => SwapProgressEvent.fromJSON(e).event),
      filter(
        (swapEvent) => swapEvent?.$case === "awaitingTransfer" || swapEvent?.$case === "progress",
      ),
      this._rxTapUnsubscribeLifecycle(RPC.SWAP.TRACK.UNSUBSCRIBE, swapTrackStream),
    );

    return swapTrackEvents;
  });

  // --- Order ------------------------------------------------------------------

  /**
   * Request to list active orders for the given trader wallet address.
   *
   * @param request {@see ActiveOrdersRequest}
   * @returns {@see ActiveOrdersResponse}
   */
  public orderGetActive = this._rpcMethodFactory({
    method: RPC.ORDER.GET_ACTIVE,
    requestSerializer: ActiveOrdersRequest.toJSON,
    responseDeserializer: ActiveOrdersResponse.fromJSON,
  });

  public orderTrack = this._rxToSimpleObservable(async function (
    this: Omniston,
    request: TrackOrderRequest,
  ) {
    const orderTrackStream = this._apiClient.subscribeToStream(
      RPC.ORDER.TRACK.SUBSCRIBE,
      RPC.ORDER.TRACK.EVENT,
      TrackOrderRequest.toJSON(request),
    );

    const orderTrackEvents = (await orderTrackStream.stream).pipe(
      map((e) => OrderStatusEvent.fromJSON(e).event),
      filter((orderEvent) => orderEvent?.$case === "order"),
      this._rxTapUnsubscribeLifecycle(RPC.ORDER.TRACK.UNSUBSCRIBE, orderTrackStream),
    );

    return orderTrackEvents;
  });

  public orderRegisterSignedOrder = this._rpcMethodFactory({
    method: RPC.ORDER.REGISTER_SIGNED_ORDER,
    requestSerializer: RegisterSignedOrderRequest.toJSON,
    responseDeserializer: () => {},
  });

  public orderCancelSignedOrder = this._rpcMethodFactory({
    method: RPC.ORDER.CANCEL_SIGNED_ORDER,
    requestSerializer: CancelSignedOrderRequest.toJSON,
    responseDeserializer: CancelSignedOrderResponse.fromJSON,
  });

  public orderDiscloseHtlcSecret = this._rpcMethodFactory({
    method: RPC.ORDER.DISCLOSE_HTLC_SECRET,
    requestSerializer: DiscloseHtlcSecretRequest.toJSON,
    responseDeserializer: () => {},
  });

  // --- Helpers ---------------------------------------------------------------

  private _rpcMethodFactory<TRequest, TResponse>({
    method,
    requestSerializer,
    responseDeserializer,
  }: {
    method: string;
    requestSerializer: (request: TRequest) => unknown;
    responseDeserializer: (response: unknown) => TResponse;
  }): (request: TRequest) => Promise<TResponse> {
    return (request: TRequest) =>
      wrapErrorsAsync(async () => {
        const response = await this._apiClient.send(method, requestSerializer(request));

        return responseDeserializer(response);
      });
  }

  /**
   * Helper to convert Promise<RxObservable<T>> method return type to Observable<T>
   */
  private _rxToSimpleObservable<TArgs extends Array<unknown>, TReturn>(
    originalMethod: (this: Omniston, ...args: TArgs) => Promise<RxObservable<TReturn>>,
  ): (this: Omniston, ...args: TArgs) => Observable<TReturn> {
    return toSimpleObservable(unwrapObservable(originalMethod));
  }

  /**
   * Helper to unsubscribe once stream finalizes.
   * On server-closed notifications, emits synthetic `unsubscribed` event and marks lifecycle as already unsubscribed.
   */
  private _rxTapUnsubscribeLifecycle<TEvent>(
    method: string,
    streamController: ApiStreamController,
  ): OperatorFunction<TEvent, TEvent | UnsubscribeEvent> {
    let isUnsubscribed = false;

    const unsubscribe = () => {
      if (isUnsubscribed) {
        return;
      }

      isUnsubscribed = true;

      void streamController
        .unsubscribeFromStream(method)
        .then((result) => {
          if (result !== true) {
            this._logger?.warn(
              `Failed to unsubscribe with method ${method} and subscription ID ${streamController.subscriptionId}. Server returned ${result}`,
            );
          }
        })
        .catch((error: unknown) => {
          this._logger?.warn(
            `Failed to unsubscribe with method ${method} and subscription ID ${streamController.subscriptionId}. Error: ${String(error)}`,
          );
        });
    };

    return (source) =>
      source.pipe(
        mergeWith(
          streamController.streamClosedByServer.pipe(
            map((): UnsubscribeEvent => {
              // no need to call `unsubscribe` function here,
              // because ApiStreamController already closed the stream on server notification
              // and we just need to mark lifecycle as unsubscribed to prevent double-unsubscribe in `finalize`
              isUnsubscribed = true;

              return {
                $case: "unsubscribed",
                value: undefined,
              };
            }),
          ),
        ),
        finalize(unsubscribe),
      );
  }
}
