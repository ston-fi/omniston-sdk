import { useCallback, useMemo } from "react";
import {
  useAppKitAccount,
  useAppKitProvider,
  useDisconnect as useAppKitDisconnect,
  useWalletInfo,
  type WalletConnectConnector,
} from "@reown/appkit/react";
import type { TronConnector } from "@reown/appkit-adapter-tron";
import { tronNileTestnet } from "@reown/appkit/networks";
import { useWallet as useTronWallet } from "@tronweb3/tronwallet-adapter-react-hooks";
import type { Trx } from "tronweb";

/**
 * Returns the effective TRON wallet connection across both TRON connection paths.
 *
 * This app intentionally exposes two ways to connect a TRON wallet:
 * - AppKit's `tron` namespace, used for TRON WalletConnect connections.
 * - `@tronweb3/tronwallet-adapter-react-hooks`, used for direct TronLink connections.
 *
 * Even though both providers reuse the same `TronLinkAdapter` instance, their React
 * state is not a single source of truth: `useAppKitAccount({ namespace: "tron" })`
 * only reliably describes AppKit/WalletConnect state, while direct TronLink state
 * lives in `useTronWallet()`.
 *
 * Signing is split too. TronLink exposes `signTransaction`/`signMessage` through
 * the tronwallet adapter, but AppKit's TRON connector does not expose a public
 * method for signing a prebuilt TRON transaction. For AppKit connections we route
 * signing through the underlying connector/provider RPC methods here, next to the
 * wallet-source selection logic, so consumers use one TRON wallet abstraction for
 * addresses, metadata, disconnect, and signing.
 *
 * TronLink wins when connected because it represents the explicit direct wallet
 * selected in our wallet manager; otherwise we fall back to AppKit/WalletConnect.
 */
type TronTransaction = Exclude<Parameters<Trx["signTransaction"]>[0], string>;

export function useTronWalletConnection() {
  const { address: appKitAddress, isConnected: isAppKitConnected } = useAppKitAccount({
    namespace: "tron",
  });
  const { walletInfo: appKitWalletInfo } = useWalletInfo("tron");
  const { walletProvider } = useAppKitProvider<TronConnector>("tron");
  const { disconnect: disconnectAppKit } = useAppKitDisconnect();
  const tronLinkWallet = useTronWallet();

  const isTronLinkConnected = tronLinkWallet.connected;

  const address = isTronLinkConnected
    ? tronLinkWallet.address || undefined
    : isAppKitConnected && appKitAddress
      ? appKitAddress
      : undefined;

  const wallet = useMemo(
    () =>
      isTronLinkConnected
        ? {
            name: String(tronLinkWallet.wallet?.adapter.name || "TronLink"),
            iconUrl: tronLinkWallet.wallet?.adapter.icon,
          }
        : {
            name: appKitWalletInfo?.name,
            iconUrl: appKitWalletInfo?.icon,
          },
    [
      appKitWalletInfo?.icon,
      appKitWalletInfo?.name,
      isTronLinkConnected,
      tronLinkWallet.wallet?.adapter.icon,
      tronLinkWallet.wallet?.adapter.name,
    ],
  );

  const signTransaction = useCallback(
    async ({
      ownerAddress,
      transaction,
    }: {
      ownerAddress: string;
      transaction: TronTransaction;
    }) => {
      if (isTronLinkConnected) {
        return tronLinkWallet.signTransaction(transaction as any);
      }

      return appKitSignTransaction({
        walletProvider,
        ownerAddress,
        caipNetworkId: tronNileTestnet.caipNetworkId,
        transaction,
      });
    },
    [isTronLinkConnected, tronLinkWallet, walletProvider],
  );

  const signMessage = useCallback(
    async ({ message, from }: { message: string; from: string }) => {
      if (isTronLinkConnected) {
        return tronLinkWallet.signMessage(message);
      }

      return walletProvider.signMessage({ message, from });
    },
    [isTronLinkConnected, tronLinkWallet, walletProvider],
  );

  const disconnect = useCallback(async () => {
    await Promise.allSettled([
      isAppKitConnected ? disconnectAppKit({ namespace: "tron" }) : undefined,
      tronLinkWallet.wallet ? tronLinkWallet.disconnect() : undefined,
    ]);
  }, [disconnectAppKit, isAppKitConnected, tronLinkWallet]);

  return {
    address,
    wallet,
    isConnected: Boolean(address),
    isAppKitConnected,
    isTronLinkConnected,
    tronLinkWallet,
    signTransaction,
    signMessage,
    disconnect,
  };
}

async function appKitSignTransaction({
  walletProvider,
  ownerAddress,
  caipNetworkId,
  transaction,
}: {
  walletProvider: TronConnector;
  ownerAddress: string;
  caipNetworkId: string;
  transaction: TronTransaction;
}): Promise<{ signature: string[] }> {
  if (walletProvider.type === "INJECTED") {
    return walletProvider.request({
      // For injected TRON wallets this RPC signs the transaction; broadcasting is done separately.
      method: "tron_sendTransaction",
      params: { transaction },
    });
  }

  if (walletProvider.type === "WALLET_CONNECT") {
    const provider = walletProvider.provider as WalletConnectConnector["provider"];
    const usesV1Format = provider.session?.sessionProperties?.["tron_method_version"] === "v1";
    const signedTransaction:
      | {
          signature: string[];
        }
      | undefined = await provider.request(
      {
        method: "tron_signTransaction",
        params: {
          address: ownerAddress,
          transaction: usesV1Format ? transaction : { transaction },
        },
      },
      caipNetworkId,
    );

    if (!signedTransaction?.signature?.length) {
      throw new Error("Transaction signing failed");
    }

    return signedTransaction;
  }

  throw new Error(`Unsupported connector type ${walletProvider.type}`);
}
