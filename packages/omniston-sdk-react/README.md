# Omniston SDK React

[![TON](https://img.shields.io/badge/based%20on-TON-blue)](https://ton.org/)
[![License](https://img.shields.io/npm/l/@ston-fi/omniston-sdk)](https://img.shields.io/npm/l/@ston-fi/omniston-sdk)
[![npm version](https://img.shields.io/npm/v/@ston-fi/omniston-sdk-react/latest.svg)](https://www.npmjs.com/package/@ston-fi/omniston-sdk-react/v/latest)

This package provides binding for [omniston-sdk](https://github.com/ston-fi/omniston-sdk/tree/main/packages/omniston-sdk) to the React ecosystem. Using this package, you can access all Omniston methods as hooks powered by [TanStack react query](https://tanstack.com/query/latest) (out-of-box loading states, retries, error handling, and match more)

You can find all supported methods in our [docs](https://docs.ston.fi/docs/developer-section/omniston) or take a look onto our [demo app](https://github.com/ston-fi/omniston-sdk/tree/main/examples/next-js-app) that use NextJs and `omniston-sdk-react` package

## Installation

> **Warning**
> SDK is still under development and breaking changes might and probably will happen in the future. According to the [semantic versioning convention](https://semver.org/#spec-item-4), while the package's major version is zero, breaking changes might happen even in minor releases. Because of that, **if you are using SDK at this stage in production**, please **make sure that you are using the exact version of the package** in your `package.json` file
> ​

### via NPM
```sh
npm install @ston-fi/omniston-sdk-react
```

### via YARN
```sh
yarn add @ston-fi/omniston-sdk-react
```

### via PNPM
```sh
pnpm install @ston-fi/omniston-sdk-react
```
