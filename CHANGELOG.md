# Changelog

### 16-12-2024

### @ston-fi/omniston-sdk-react@0.3.2

- allow React 19 as peer dependency
- correct type declaration for `useAssetList` hook

### 04-12-2024

### @ston-fi/omniston-sdk-react@0.3.1

- passing `disable` parameter to the `ObservableQuery` will cause the ws unsubscribe event

### @ston-fi/omniston-example-next-js-app

- the `QuotePreview` component was extended with the quote resolver information
- [b2ffcab5](https://github.com/ston-fi/omniston-sdk/commit/b2ffcab58f8bd9382e10068a96bb906e21288566) improve demo app by calling the quote track API only after accepting the quote
- [25e7ebce](https://github.com/ston-fi/omniston-sdk/commit/25e7ebce09e5b28fbbbdc98f481c6bd28ef8444f) improve demo app by disabling the RFQ query when any quote tracking is in process

### 26-11-2024

Starting from [this moment](https://github.com/ston-fi/omniston-api/commit/c2892c10a7db36b01b91fa01306c874664f7a1bc) Omniston API can send `Unsubscribed` messages to the client. Receiving such an event in the `QuoteEvent` or `TradeStatus` stream means that no other events will ever be sent in response.

### @ston-fi/omniston-sdk@0.3.0

- the return type of the `requestForQuote` method was changed. Now it will be an observable stream of events instead of `Quote | null` as it was before.
- the return type of Omniston methods was changed from RxJS Observable to narrowed type to provide decuple Omniston SDK from a specific package interface. It is still comparable with the RxJS, so you can easily make an RxJS observable out of an observable returned from the SDK if you need the entire RxJS API. Otherwise, no changes are needed

### @ston-fi/omniston-sdk-react@0.3.0

- the return type of the `useRfq` hook was changed. Now it will be an observable stream of events instead of `Quote | null` as it was before.

### @ston-fi/omniston-example-next-js-app

- [5a90083d](https://github.com/ston-fi/omniston-sdk/commit/5a90083d4acb298386f3b754b21626f3f4bacd14) apply required changes to support `@ston-fi/omniston-sdk-react@0.3.0`
