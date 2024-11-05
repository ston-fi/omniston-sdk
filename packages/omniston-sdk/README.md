# Omniston SDK

[![TON](https://img.shields.io/badge/based%20on-TON-blue)](https://ton.org/)
[![License](https://img.shields.io/npm/l/@ston-fi/omniston-sdk)](https://img.shields.io/npm/l/@ston-fi/omniston-sdk)
[![npm version](https://img.shields.io/npm/v/@ston-fi/omniston-sdk/latest.svg)](https://www.npmjs.com/package/@ston-fi/omniston-sdk/v/latest)

This package acts as a typescript wrapper on top of the Ston.fi [Omniston protocol](https://github.com/ston-fi/omniston-api). It uses [RxJs](https://rxjs.dev) to provide observables on top of the WebSocket API connection

You can find all supported methods in our [docs](https://docs.ston.fi/docs/developer-section/omniston) or take a look onto our [demo app](https://github.com/ston-fi/omniston-sdk/tree/main/examples/next-js-app) that use NextJs and `omniston-sdk-react` package

## Installation

> **Warning**
> SDK is still under development and breaking changes might and probably will happen in the future. According to the [semantic versioning convention](https://semver.org/#spec-item-4), while the package's major version is zero, breaking changes might happen even in minor releases. Because of that, **if you are using SDK at this stage in production**, please **make sure that you are using the exact version of the package** in your `package.json` file
> ​

### via NPM

```sh
npm install @ston-fi/omniston-sdk
```

### via YARN

```sh
yarn add @ston-fi/omniston-sdk
```

### via PNPM

```sh
pnpm install @ston-fi/omniston-sdk
```
