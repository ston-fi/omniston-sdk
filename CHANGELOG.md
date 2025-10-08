# Changelog

## 07-10-2025

### @ston-fi/omniston-sdk@0.7.5
### @ston-fi/omniston-sdk-react@0.7.7

- new `flexibleReferrerFee` parameter was added to the `rfq.settlementParams` to control whether the flexible referrer fee can be applied for the quote. This new parameter allows the swap to be performed with a lower referrerFee than specified via `rfq.referrerFeeBps` to provide a better swap rate for the end user

- improved `.d.ts` generation fo fix some missed type declarations

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
| `refundAddress` | `Address` | The address to which funds will be returned in case of an failure |

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

- Fix Omniston call's from queries without observers

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

- `queryClient` prom was removed from the `OmnistonProvider` component. The mismatch between `@tanstack/react-query` package version in `omniston-sdk-react` and consumer's apps lead to the TS error about mismatching `QueryClient` types. In future versions of the `omniston-sdk-react` package, we are targeting to get rid of `@tanstack/react-query` dependency completely.

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
- the return type of Omniston methods was changed from RxJS Observable to narrowed type to provide decuple Omniston SDK from a specific package interface. It is still comparable with the RxJS, so you can easily make an RxJS observable out of an observable returned from the SDK if you need the entire RxJS API. Otherwise, no changes are needed

### @ston-fi/omniston-sdk-react@0.3.0

- the return type of the `useRfq` hook was changed. Now it will be an observable stream of events instead of `Quote | null` as it was before.

### @ston-fi/omniston-example-next-js-app

- [5a90083d](https://github.com/ston-fi/omniston-sdk/commit/5a90083d4acb298386f3b754b21626f3f4bacd14) apply required changes to support `@ston-fi/omniston-sdk-react@0.3.0`
