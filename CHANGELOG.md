# Changelog

## 17-04-2026

**Omniston v1beta8 API release**

> [!WARNING]
> Breaking changes

The `v1beta8` Omniston API release introduces refined terminology and cross-chain exchange capabilities.
This release also includes a fully working example app in this repository that demonstrates the new SDK APIs end to end.
It can serve as a reference implementation when migrating real applications to `v1beta8`.

Here are some useful links for the new API:
- [v1beta8 Glossary](https://github.com/ston-fi/stonfi-proto/blob/main/proto/stonfi/omni/GLOSSARY.md)
- [v1beta8 API proto files](https://github.com/ston-fi/stonfi-proto/tree/main/proto/stonfi/omni)
- [v1beta7 to v1beta8 migration guide](https://github.com/ston-fi/stonfi-proto/blob/main/proto/stonfi/omni/v1beta8/v1beta7-to-v1beta8-migration-guide.md)

The main idea of the `v1beta7` to `v1beta8` migration is:

- move from generic trade-oriented APIs to explicit settlement-specific APIs
- branch on typed oneof fields such as `quote.settlementData`
- treat `Quote` as the main structure that drives building and tracking flows
- use chain-specific builders for TON and EVM where settlement requires different payloads

```diff
- const tx = await omniston.buildTransfer({ quoteId, traderWalletAddress });
- const stream = await omniston.trackTrade({ quoteId, traderWalletAddress, txHash });
+ switch (quote.settlementData?.$case) {
+   case "swap":
+     await omniston.tonBuildSwap({ /** */ });
+     await omniston.swapTrack({ /** */ });
+     break;
+   case "order":
+     await omniston.tonBuildEscrowTransfer({ /** */ });
+     await omniston.orderTrack({ /** */ });
+     break;
+   default:
+     throw new Error("Unsupported settlement method");
+ }
```

v1beta8 relies heavily on oneof-style payloads with `$case` and `value`. This makes the SDK more type-safe, because mutually exclusive variants are modeled explicitly, and more LLM-friendly, because the schema describes each branch in a uniform, self-describing shape. The SDK exports `OneOf`, `OneOfCase`, `OneOfCases`, `OneOfValue`, and `OneOfValues` to help you type these unions and extract case-specific payload types:

```ts
import type {
  Quote,
  OneOf,
  OneOfCase,
  OneOfCases,
  OneOfValue,
  OneOfValues,
} from "@ston-fi/omniston-sdk";
```

```ts
type SettlementData = NonNullable<Quote["settlementData"]>;

type SettlementKind = OneOfCases<SettlementData>;
// "swap" | "order"

type SwapSettlement = OneOfCase<SettlementData, "swap">;
// { $case: "swap"; value: SwapSettlementData }

type SwapPayload = OneOfValue<SettlementData, "swap">;
// SwapSettlementData

type AnySettlementPayload = OneOfValues<SettlementData>;
// SwapSettlementData | OrderSettlementData
```

Since `Quote` is now the main structure that drives RFQ handling, settlement branching, and transaction building, the SDK exports a few helpers to make quote handling less repetitive: `isSwapQuote`, `isOrderQuote`, `isHtlcOrderQuote`, `matchQuoteByType`, and `QuoteOfType`.

```ts
matchQuoteByType(quote, {
  swap: (swapQuote) => {
    // ^ quote type and settlementData are narrowed for a swap quote
  },
  order: (orderQuote) => {
    // ^ quote type and settlementData are narrowed for an order quote
  },
});
```

### @ston-fi/omniston-sdk@0.8.0-rc.0

#### Migration guide

```diff
- import type { QuoteRequest, QuoteResponseEvent, TrackTradeRequest } from "@ston-fi/omniston-sdk";
+ import type { QuoteRequest, TrackSwapRequest, TrackOrderRequest } from "@ston-fi/omniston-sdk";
```

When you receive a quote, branch on `quote.settlementData?.$case` and call the settlement-specific method:

```diff
- const tx = await omniston.buildTransfer({
-   quoteId: quote.quoteId,
-   traderWalletAddress,
- });
+ let tx;
+
+ switch (quote.settlementData?.$case) {
+   case "swap":
+     tx = await omniston.tonBuildSwap({ /** */ });
+     break;
+   case "order":
+     tx = await omniston.tonBuildEscrowTransfer({ /** */ });
+     break;
+   default:
+     throw new Error("Unsupported settlement method");
+ }
```

For EVM order settlement, building the payload is no longer the last step. You must build the order payload, sign it, and then register the signed order:

```diff
- const tx = await omniston.buildTransfer({ quoteId, traderWalletAddress });
+ const payload = await omniston.evmBuildOrderPayload({ /** */ });
+
+ const signedOrder = signPayloadSomehow(payload);
+
+ await omniston.orderRegisterSignedOrder({
+   /** */
+   signedOrder,
+ });
```

Tracking is now split the same way:

```diff
- const stream = await omniston.trackTrade({
-   quoteId,
-   traderWalletAddress,
-   txHash,
- });
+ let stream;
+
+ switch (quote.settlementData?.$case) {
+   case "swap":
+     stream = await omniston.swapTrack({ 
+       /** */
+       outgoingTxQuery // you can pass external message hash/sighed BOC/tx hash here directly
+     });
+     break;
+   case "order":
+     stream = await omniston.orderTrack({ /** */ });
+     break;
+   default:
+     throw new Error("Unsupported settlement method");
+ }
```

Order management also moved to dedicated APIs:

```diff
- const orders = await omniston.escrowList({ traderWalletAddress });
+ const orders = await omniston.orderGetActive({ traderAddress });
```

#### Removed

- Removed deprecated `client` from `Omniston` constructor. Use `transport` instead.

```diff
- new Omniston({ apiUrl, client, logger });
+ new Omniston({ apiUrl, transport, logger });
```

- Removed deprecated `Omniston.close()`. Close the SDK through its transport instead.

```diff
- omniston.close();
+ omniston.transport.close();
```

### @ston-fi/omniston-sdk-react@0.8.0-rc.0

#### Migration guide

Start by replacing removed hooks with settlement-specific hooks:

```diff
- const transfer = useBuildTransfer(request);
- const withdrawal = useBuildWithdrawal(request);
- const trade = useTrackTrade(request);
- const escrows = useEscrowList(request);
+ const tonSwap = useTonBuildSwap(request);
+ const tonEscrowTransfer = useTonBuildEscrowTransfer(request);
+ const tonEscrowCancellation = useTonBuildEscrowCancellation(request);
+ const evmOrderPayload = useEvmBuildOrderPayload(request);
+ const orderTrack = useOrderTrack(request);
+ const swapTrack = useSwapTrack(request);
+ const activeOrders = useActiveOrders(request);
+ const escrowVaultBalances = useTonEscrowVaultBalances(request);
```

`useRfq()` now returns the new SDK event shape, so React code should switch from `type` checks to `$case` checks:

```diff
 const { data: quoteEvent } = useRfq(request);
 
- const quote = quoteEvent?.type === "quoteUpdated" ? quoteEvent.quote : undefined;
+ const quote = quoteEvent?.$case === "quoteUpdated" ? quoteEvent.value : undefined;
```

If you previously tracked all trades through one hook, split by settlement method:

```diff
- const { data: tradeEvent } = useTrackTrade(trackRequest, { enabled });
+ const isSwap = quote?.settlementData?.$case === "swap";
+
+ const { data: swapEvent } = useSwapTrack(swapRequest, { enabled: enabled && isSwap });
+ const { data: orderEvent } = useOrderTrack(orderRequest, { enabled: enabled && !isSwap });
```

For order flows, v1beta8 adds dedicated hooks for the extra lifecycle steps:

```diff
- // no equivalent hooks in v1beta7
+ const registerSignedOrder = useRegisterSignedOrder(request);
+ const cancelSignedOrder = useCancelSignedOrder(request);
+ const discloseHtlcSecret = useDiscloseHtlcSecret(request);
```

#### Added

`OmnistonProvider` can now reuse your application `QueryClient` instead of always creating its own:

```diff
 <QueryClientProvider client={queryClient}>
-  <OmnistonProvider omniston={omniston}>
+  <OmnistonProvider omniston={omniston} queryClient={queryClient}>
     {children}
   </OmnistonProvider>
 </QueryClientProvider>
```

#### Removed

Stream hooks built on `useObservableQuery` no longer expose an imperative `unsubscribe` function. If you need manual control over subscription lifetime, use `enabled`/unmounting or subscribe to the underlying SDK observable directly.

## 02-04-2026

### @ston-fi/omniston-sdk@0.7.9
### @ston-fi/omniston-sdk-react@0.7.12

#### Added

- `OmnistonErrorInfo` type declarations were refined to align with current API error payloads.

## 25-11-2025

### @ston-fi/omniston-sdk-react@0.7.11

#### Fixed
- Fixed the `useObservableQuery` reaction to frequent stream events.

  The `useObservableQuery` is an underlying mechanism for binding Omniston SDK streams to TanStack Query.
  It is used by all query hooks that wrap streams (`useRfq`, `useTrackTrade`).
  Due to [React's batching mechanism](https://react.dev/learn/queueing-a-series-of-state-updates#react-batches-state-updates), when the Omniston stream emits multiple synchronous updates in a short period, React batches these updates and only renders once. This could lead to intermediate events being "swallowed" when only the last event in a batch is processed.

  This bug was specific to `@ston-fi/omniston-sdk-react` and was not present in `@ston-fi/omniston-sdk`.

## 04-11-2025

### @ston-fi/omniston-sdk@0.7.8

#### Added

- new `Omniston.escrowList` method for fetching list of the pending escrow orders
- new `Omniston.buildWithdrawal` method for receiving tx payload to sign for a withdrawal operation (if allowed) to be performed
- new types related to the Escrow orders (`EscrowOrderData`, `EscrowOrderListRequest`, `EscrowOrderListResponse`)

### @ston-fi/omniston-sdk-react@0.7.10

#### Added

- `@ston-fi/omniston-sdk` bumped to v`0.7.8`
- new `useEscrowList` hook that wraps the `Omniston.escrowList` method
- new `useBuildWithdrawal` hook that wraps the `Omniston.buildWithdrawal` method

## 04-11-2025

### @ston-fi/omniston-sdk@0.7.7
### @ston-fi/omniston-sdk-react@0.7.9

#### Fixed

- `ApiClient` now properly reconnects after connection errors by detecting when the connection has failed
- `ApiClient` now automatically closes all pending subscriptions when connections fail, preventing resource leaks
- fixed potential memory leak in ApiClient.readStream()

#### Added

- `AutoReconnectTransport` connection error events are enriched with an `isReconnecting` flag to indicate whether automatic reconnection is in progress. This allows distinguishing between recoverable errors (being retried) and permanent failures

#### Deprecated

- the `TransactionRequest` type was renamed to `BuildTransferRequest`. Left for backward compatibility, but deprecated. It will be removed in the future

## 23-10-2025

### @ston-fi/omniston-sdk@0.7.6
### @ston-fi/omniston-sdk-react@0.7.8

This is a technical release with the following improvements:

- the package manager was changed to pnpm@10, and workspace settings were configured to prevent installation of recently published packages. This change, along with explicitly fixed dependency versions, should minimize the risk of publishing packages that depend on a recently published newer version of a dependency
- dependency package versions used for SDK packages were unified via pnpm workspace
- the build tool was changed from [tsup](https://tsup.egoist.dev/) to [tsdown](https://tsdown.dev/)
- dev scripts now build packages with source maps to simplify debugging during local development
- a root-level `dev` script was added to provide a simpler local development setup. This command uses [Turbo](https://turborepo.com/) to run the chain of `next-js-app > omniston-sdk-react > omniston-sdk` in watch mode, enabling development with UI and HMR for all packages in this monorepo
- improved `.d.ts` generation to fix some missed type declarations

## 08-10-2025

### @ston-fi/omniston-sdk@0.7.5
### @ston-fi/omniston-sdk-react@0.7.7

- new `flexibleReferrerFee` parameter was added to the `rfq.settlementParams` to control whether the flexible referrer fee can be applied for the quote. This new parameter allows the swap to be performed with a lower referrerFee than specified via `rfq.referrerFeeBps` to provide a better swap rate for the end user

## 09-09-2025

### @ston-fi/omniston-sdk@0.7.4
### @ston-fi/omniston-sdk-react@0.7.6

- Empty `TonMessage.jettonWalletStateInit` now will be `undefined` instead of `""`

These changes were due to the fact that in yesterday's release of the [`@tonconnect/*@2.3.0`](https://github.com/ton-connect/sdk/blob/main/packages/sdk/CHANGELOG.md#330) packages, the breaking changes with the strict request validation were introduced. Previously, the optional `jettonWalletStateInit` field from the omniston protocol was parsed as an empty string, and empty strings do not pass the new strict validation.

## 03-09-2025

### @ston-fi/omniston-sdk@0.7.3
### @ston-fi/omniston-sdk-react@0.7.5

- Added new `QuoteRequestAck` quote event with `rfq_id` assignment.

This event will be sent by the Omniston protocol after receiving a quote request. This ID will allow identification of what events took place during the lifetime of this quote request's event stream.

It was implemented as a dedicated event and not as part of a `Quote` event to be able to identify cases when a request was sent and an `rfq_id` was assigned by the protocol, but no `Quote` events were later sent from the protocol to this RFQ stream.

```ts
omniston.requestForQuote(quoteRequest).subscribe({
  next: (quoteResponseEvent) => {
    switch (quoteResponseEvent.type) {
      case 'ack': {
        const { rfqId } = quoteResponseEvent;

        ///
      }
    }
  },
})
```

- For ease of use of the new `QuoteRequestAck` event at the SDK level, each event received after a `QuoteRequestAck` event was extended with the rfqId field.

```ts
omniston.requestForQuote(quoteRequest).subscribe({
  next: (quoteResponseEvent) => {
    switch (quoteResponseEvent.type) {
      case 'quoteUpdated': {
        const { rfqId } = quoteResponseEvent;

        ///
      }
      case 'unsubscribed': {
        const { rfqId } = quoteResponseEvent;

        ///
      }
    }
  },
})
```

## 08-08-2025

### @ston-fi/omniston-sdk@0.7.2
### @ston-fi/omniston-sdk-react@0.7.4

- Added new optional field to `TransactionRequest`.

| Name            | Type      | Description                                                       |
|-----------------|-----------|-------------------------------------------------------------------|
| `refundAddress` | `Address` | The address to which funds will be returned in case of a failure |

## 30-07-2025

### @ston-fi/omniston-sdk@0.7.1
### @ston-fi/omniston-sdk-react@0.7.3

- `OmnistonError` class was extended with the optional `details` field, which contains error-related information. Possible error details data are described with the new `OmnistonErrorDetails` type

## 17-07-2025

### @ston-fi/omniston-sdk-react@0.7.2

> [!WARNING]
> **Breaking Changes**

- `OmnistonProvider` now requires a pre-instantiated `Omniston` instance instead of constructor parameters

**Migration Guide:**

```diff
-- import { OmnistonProvider } from "@ston-fi/omniston-sdk-react";
++ import { Omniston, OmnistonProvider } from "@ston-fi/omniston-sdk-react";

++ const omniston = new Omniston({ apiUrl: "wss://omni-ws.ston.fi" });

-- <OmnistonProvider apiUrl="wss://omni-ws.ston.fi">
++ <OmnistonProvider omniston={omniston}>
```

This also fixes the ability for react-sdk consumers to configure custom Omniston `Transport` for more precise control over the WebSocket API connection

```ts
const omnistonApiUrl = "wss://omni-ws.ston.fi";
const omnistonTransport = new WebSocketTransport(omnistonApiUrl);

const omniston = new Omniston({
  apiUrl: omnistonApiUrl,
  transport: omnistonTransport,
});

// omnistonTransport.close();
// omnistonTransport.connect();
// omnistonTransport.connectionStatusEvents.subscribe(({ status }) => { /* ... */ })
```


## 08-07-2025

### @ston-fi/omniston-sdk-react@0.7.1

- Fix Omniston calls from queries without observers

## 01-07-2025

### @ston-fi/omniston-sdk@0.7.0

- Deprecated passing `client` to Omniston class constructor. For advanced users: you can pass `transport` instead to have fine control over underlying WebSocket connection.
- Added `connectionStatus` getter to Omniston class instance
- Added `connectionStatusEvents` observable stream

### @ston-fi/omniston-sdk-react@0.7.0

- Added `useConnectionStatus` hook

### @ston-fi/omniston-example-next-js-app

- Added a badge to monitor connection status

## 13-06-2025

### @ston-fi/omniston-sdk@0.6.0
### @ston-fi/omniston-sdk-react@0.6.0

Support for [`v1beta7` API](https://github.com/ston-fi/omniston-api)

## 05-06-2025

### @ston-fi/omniston-sdk-react@0.5.1

`useRfq` and `useTrackTrade` hook results were extended with the explicit `unsubscribe` function

## 07-05-2025

Based on our integrators' feedback, the `v1beta6` was extended with more fields. The updated API is fully backward compatible.

### @ston-fi/omniston-sdk@0.5.0
### @ston-fi/omniston-sdk-react@0.5.0

- `buildTransfer` method extended with the `gasExcessAddress` field to configure the address that will receive the gas not spent by the trade.
- `Quote` object extended with the `estimatedGasConsumption` field that represents the estimated amount of gas units that will be spent to perform the trade
- `Quote` object extended with the `referrerFeeAsset` field that specifies the asset of the fees that the referrer will get
- `Quote` object extended with the `protocolFeeAsset` field that specifies the asset of the fees charged by the protocol
- `TradeStatus` object extended with the `transferTimestamp` field with the Timestamp of when the outgoing transfer has been detected.
- `TradeStatus` object extended with the `estimatedFinishTimestamp` field, with the Timestamp of completion of the trade.

## 21-04-2025

### @ston-fi/omniston-sdk-react@0.4.2

- `queryClient` prop was removed from the `OmnistonProvider` component. The mismatch between `@tanstack/react-query` package version in `omniston-sdk-react` and consumer apps led to the TS error about mismatching `QueryClient` types. In future versions of the `omniston-sdk-react` package, we are targeting to get rid of the `@tanstack/react-query` dependency completely.

  ```diff
      <OmnistonProvider
  --    queryClient={queryClient}
        apiUrl="wss://omni-ws.ston.fi"
      >
  ```

## 03-03-2025

To prevent the logging of the Omniston protocol messages in production but still allow access to them, a new optional `logger` parameter was added to the `Omniston` constructor. By default, the logger will be a `VoidLogger` (no logging at all). You can pass any logger that is compatible with the console interface.

### @ston-fi/omniston-sdk@0.4.1

- A new `logger` field was added to the `Omniston` constructor parameters

### @ston-fi/omniston-sdk-react@0.4.1

- A new `logger` field was added to the `OmnistonProvider` component props

## 12-02-2025

> [!IMPORTANT]
> API breaking changes.
> The Omniston SDK 0.4 packages work with the `v1beta6` API.
> The `v1beta5` to `v1beta6` API changes are not backward compatible. The API changes overview can be found in the [announcement post](https://t.me/stonfidevs/17). The updated proto files are also available in the [Omniston API repo](https://github.com/ston-fi/omniston-api).

### @ston-fi/omniston-sdk@0.4.0

- support for `v1beta6` Omniston API. See examples of the updated SDK usage in our [docs](https://docs.ston.fi/docs/developer-section/omniston/omniston-nodejs)

### @ston-fi/omniston-sdk-react@0.4.0

- support for `v1beta6` Omniston API. See examples of the updated SDK usage in our [docs](https://docs.ston.fi/docs/developer-section/omniston/omniston-react)

## 16-12-2024

### @ston-fi/omniston-sdk-react@0.3.2

- allow React 19 as peer dependency
- correct type declaration for `useAssetList` hook

## 04-12-2024

### @ston-fi/omniston-sdk-react@0.3.1

- passing `disable` parameter to the `ObservableQuery` will cause the ws unsubscribe event

### @ston-fi/omniston-example-next-js-app

- the `QuotePreview` component was extended with the quote resolver information
- [b2ffcab5](https://github.com/ston-fi/omniston-sdk/commit/b2ffcab58f8bd9382e10068a96bb906e21288566) improve demo app by calling the quote track API only after accepting the quote
- [25e7ebce](https://github.com/ston-fi/omniston-sdk/commit/25e7ebce09e5b28fbbbdc98f481c6bd28ef8444f) improve demo app by disabling the RFQ query when any quote tracking is in process

## 26-11-2024

Starting from [this moment](https://github.com/ston-fi/omniston-api/commit/c2892c10a7db36b01b91fa01306c874664f7a1bc) Omniston API can send `Unsubscribed` messages to the client. Receiving such an event in the `QuoteEvent` or `TradeStatus` stream means that no other events will ever be sent in response.

### @ston-fi/omniston-sdk@0.3.0

- the return type of the `requestForQuote` method was changed. Now it will be an observable stream of events instead of `Quote | null` as it was before.
- the return type of Omniston methods was changed from RxJS Observable to narrowed type to provide decoupling of Omniston SDK from a specific package interface. It is still comparable with RxJS, so you can easily make an RxJS observable out of an observable returned from the SDK if you need the entire RxJS API. Otherwise, no changes are needed

### @ston-fi/omniston-sdk-react@0.3.0

- the return type of the `useRfq` hook was changed. Now it will be an observable stream of events instead of `Quote | null` as it was before.

### @ston-fi/omniston-example-next-js-app

- [5a90083d](https://github.com/ston-fi/omniston-sdk/commit/5a90083d4acb298386f3b754b21626f3f4bacd14) apply required changes to support `@ston-fi/omniston-sdk-react@0.3.0`
