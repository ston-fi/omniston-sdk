# Changelog

### 26-11-2024

Starting from [this moment](https://github.com/ston-fi/omniston-api/commit/c2892c10a7db36b01b91fa01306c874664f7a1bc) Omniston API can send `Unsubscribed` messages to the client. Receiving such an event in the `QuoteEvent` or `TradeStatus` stream means that no other events will ever be sent in response.

### @ston-fi/omniston-sdk@0.3.0

- the return type of the `requestForQuote` method was changed. Now it will be an observable stream of events instead of `Quote | null` as it was before.
- the return type of Omniston methods was changed from RxJS Observable to narrowed type to provide decuple Omniston SDK from a specific package interface. It is still comparable with the RxJS, so you can easily make an RxJS observable out of an observable returned from the SDK if you need the entire RxJS API. Otherwise, no changes are needed

### @ston-fi/omniston-sdk-react@0.3.0

- the return type of the `useRfq` hook was changed. Now it will be an observable stream of events instead of `Quote | null` as it was before.

### @ston-fi/omniston-example-next-js-app

- [5a90083d](https://github.com/ston-fi/omniston-sdk/commit/5a90083d4acb298386f3b754b21626f3f4bacd14) apply required changes to support `@ston-fi/omniston-sdk-react@0.3.0`
