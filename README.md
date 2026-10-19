<div align="center" style="margin-bottom: 20px">
  <img
    alt="Omniston logo"
    height="100px"
    style="max-width: 100%; height: 100px;"
    src="https://static.ston.fi/branbook/omniston/logo/black.png"
  />
</div>

This monorepo contains the TypeScript SDKs for STON.fi Omniston and a React example app showing how to integrate them.

## Documentation

Read the [Omniston documentation](https://docs.ston.fi/docs/developer-section/omniston) to understand how the protocol works.

## Example app

We maintain a [React example app](https://omniston.ston.fi) illustrating how to use the SDK, with [source code](https://github.com/ston-fi/omniston-sdk/tree/main/examples/react-app) available.

## SDKs

All SDKs can be found in the [`packages/`](https://github.com/ston-fi/omniston-sdk/tree/main/packages) directory.

### [@ston-fi/omniston-sdk](https://github.com/ston-fi/omniston-sdk/tree/main/packages/omniston-sdk)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@ston-fi/omniston-sdk/latest.svg)](https://www.npmjs.com/package/@ston-fi/omniston-sdk/v/latest)

The core TypeScript SDK provides typed access to the Omniston API using types generated from STON.fi's [proto files](https://github.com/ston-fi/stonfi-proto), with WebSocket transport, automatic reconnection, and RxJS-style subscriptions for streaming API methods. Use it directly in any JavaScript or TypeScript application when you want to manage the integration yourself.

```ts
import { Omniston } from "@ston-fi/omniston-sdk";

const omniston = new Omniston({
  apiUrl: "wss://omni-ws.ston.fi",
});

const connectionSubscription = omniston.connectionStatusEvents.subscribe(
  (connectionStatusEvent) => console.log(connectionStatusEvent),
);

const rfqSubscription = omniston.requestForQuote({/** */}).subscribe({
  next: (rfqEvent) => console.log(rfqEvent),
  error: (error) => console.error(error),
});

// When you no longer need updates:

// rfqSubscription.unsubscribe();
// connectionSubscription.unsubscribe();
```

By default, `Omniston` uses a WebSocket transport with automatic reconnection; the SDK keeps local stream subscriptions alive and reopens their server subscriptions after reconnecting. You can replace the default transport by passing a custom `transport` to the constructor.

### [@ston-fi/omniston-sdk-react](https://github.com/ston-fi/omniston-sdk/tree/main/packages/omniston-sdk-react)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@ston-fi/omniston-sdk-react/latest.svg)](https://www.npmjs.com/package/@ston-fi/omniston-sdk-react/v/latest)

React bindings built on top of `@ston-fi/omniston-sdk`, providing a context provider and TanStack Query hooks for SDK requests and subscriptions. Use this package in React applications to access the core SDK through hooks with query caching, loading states, and error handling.

```tsx
import {
  Omniston,
  OmnistonProvider,
  useConnectionStatus,
  useRfq,
} from "@ston-fi/omniston-sdk-react";

const omniston = new Omniston({
  apiUrl: "wss://omni-ws.ston.fi",
});

function ConnectionStatus() {
  const connectionStatus = useConnectionStatus();

  return <pre>{connectionStatus}</pre>;
}

function Quote() {
  const { data } = useRfq({/** */});

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

export function App() {
  return (
    <OmnistonProvider omniston={omniston}>
      <ConnectionStatus />
      <Quote />
    </OmnistonProvider>
  );
}
```

By default, `OmnistonProvider` creates its own TanStack Query client. If your app already has a `QueryClientProvider`, get its client with `useQueryClient()` and pass it as `<OmnistonProvider omniston={omniston} queryClient={queryClient}>` inside that provider. This reuses your app's client without creating another one.

Hooks for streaming SDK methods manage their subscriptions through TanStack Query: executing the query opens a subscription, and removing its last observer automatically unsubscribes from the stream.
