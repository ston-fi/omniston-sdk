"use client";

import {
  useAppKit,
  useAppKitAccount,
  useDisconnect as useAppKitDisconnect,
  useWalletInfo,
} from "@reown/appkit/react";
import { TronLinkAdapterName } from "@tronweb3/tronwallet-adapter-tronlink";
import {
  useTonAddress,
  useTonConnectModal,
  useTonConnectUI,
  useTonWallet,
} from "@tonconnect/ui-react";
import { LogOut } from "lucide-react";
import { useEffect, useRef } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { cn, trimStringWithEllipsis } from "~/lib/utils";
import { useTronWalletConnection } from "~/hooks/useTronWalletConnection";
import { CHAIN_FAMILY_METADATA, ChainFamily } from "~/models/chain-family";

type ConnectOption = {
  id: string;
  imageUrl: string;
  label: string;
  connect: () => void;
};

type WalletFamily = {
  family: ChainFamily;
  address?: string;
  wallet?: {
    name?: string;
    iconUrl?: string;
  };
  connectOptions: ConnectOption[];
  disconnect: () => void | Promise<void>;
};

const SUPPORTED_WALLET_FAMILIES = [ChainFamily.TON, ChainFamily.EVM, ChainFamily.TRON] as const;

export function WalletManager() {
  const walletFamiliesById = useWalletFamilies();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 pr-2 pl-3">
          <span>Wallets</span>
          <ChainFamilyAvatarStack>
            {SUPPORTED_WALLET_FAMILIES.map((family) => (
              <ChainFamilyAvatar
                key={family}
                family={family}
                isConnected={Boolean(walletFamiliesById[family].address)}
              />
            ))}
          </ChainFamilyAvatarStack>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-2">
        <div className="flex flex-col gap-2">
          {SUPPORTED_WALLET_FAMILIES.map((family) => (
            <WalletFamilyCard key={family} walletFamily={walletFamiliesById[family]} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function useWalletFamilies(): Record<ChainFamily, WalletFamily> {
  const tonConnectModal = useTonConnectModal();
  const [tonConnectUI] = useTonConnectUI();
  const tonWallet = useTonWallet();
  const tonAddress = useTonAddress();

  const { open: openAppKit } = useAppKit();
  const { disconnect: disconnectAppKit } = useAppKitDisconnect();
  const { address: evmAddress, isConnected: isEvmConnected } = useAppKitAccount({
    namespace: "eip155",
  });
  const { walletInfo: evmWalletInfo } = useWalletInfo("eip155");
  const tronWalletConnection = useTronWalletConnection();
  const { tronLinkWallet } = tronWalletConnection;
  const shouldConnectTronLink = useRef(false);

  useEffect(() => {
    if (!shouldConnectTronLink.current) return;
    if (tronLinkWallet.wallet?.adapter.name !== TronLinkAdapterName) return;

    shouldConnectTronLink.current = false;
    void tronLinkWallet.connect();
  }, [tronLinkWallet]);

  function connectTronLink() {
    if (tronLinkWallet.wallet?.adapter.name === TronLinkAdapterName) {
      void tronLinkWallet.connect();
      return;
    }

    shouldConnectTronLink.current = true;
    tronLinkWallet.select(TronLinkAdapterName);
  }

  return {
    [ChainFamily.TON]: {
      family: ChainFamily.TON,
      address: tonAddress || undefined,
      wallet: {
        name: tonWallet && "name" in tonWallet ? tonWallet.name : undefined,
        iconUrl: tonWallet && "imageUrl" in tonWallet ? tonWallet.imageUrl : undefined,
      },
      connectOptions: [
        {
          id: "ton-connect",
          label: "TON Connect",
          imageUrl:
            "data:image/png;base64,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",
          connect: () => tonConnectModal.open(),
        },
      ],
      disconnect: () => tonConnectUI.disconnect(),
    },
    [ChainFamily.EVM]: {
      family: ChainFamily.EVM,
      address: isEvmConnected ? evmAddress : undefined,
      wallet: {
        name: evmWalletInfo?.name,
        iconUrl: evmWalletInfo?.icon,
      },
      connectOptions: [
        {
          id: "wallet-connect",
          label: "WalletConnect",
          imageUrl:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAADj0lEQVR4nO2aIWxUQRCGB0MNh6ppURgOhaBXAyRAFSQ0KATgEIenRfeqKUgS6gGBIjQBRRGgoAgwLQZFa1AUA6bMn+Mll/b6bnf/nb1rM1/y7vadmNx8nd3ZfdcjU493dsRJxgWSuEASF0jiAklcIIkLJHGBJC6QxAWSuEASF0jiAklcIIkLJHGBJC6QxAWSuEASF0jiAklcIIkLJBk5gVOT+qJMNEQm9QKb2yJbeoG1TX0ZIYYusDkucnZC5NJJlXdCPwhg7YfIu+8in7dENn7qB0NkaAIh7N45rbLjekOw+UtkcVWlDqkyiwucmhRpt/Q9sNpCQVUuf9L3wiKLCWwc1Yo7LzJ7Wm8MebUu8uiDyPZfvSlAEYFoBg+udNe7EmBdvP9Gp/f/xmOJuUBM2SWV1xjTm4Js/xGZV4nWU9pU4GxTZGFGBwH81oSRLLorKuebVlE1DTH9T2n1opLRfC7qFQokIqYVpgJX72jyYzqoAeKw+D/7ojcRtFsit86IHBsQH3+Uuy91YISpwDltGjc1yf1Y/ijyXMVVlRYLKhPx29N6sw+Lb7WxbOjACFOBoDMjcq2pgx5QdZ3VfFML07pzeW81WssD5gJBbyVibcPGF50yJ83xbrPCERCUkAeKCASzza5ErEepU3YQmNJLV0VW1svIA1kEYqsCsGDn5CDEpQWisqqtSs5pc1DiUgLbLb12dcAcX6o3yYpRjZsscEG73n7nWuZL9Uuywiouzs9obCkkCWyOizy9oYMaUpKtS7LCKu7tF2k7gySB6HZPrnePV3XEJFtX0bvBBhynlxBC5GFrlbo7SBIIckqMkVcRMu2s5YFkgSBU4sP3emT7qoM+pMirqJPYbuk1rYMaWHmAEghCJfZLlpFXkRo3hzxACwQpEkOTBBZxc8gDWQSCGIlgUJI4Jcy/1oGSM25OeSCbQBAqcRAr2nQ62nwqEHfuwt6nOrHklgeyCgRIlpG4W14v/R6NhWIhD2QXCCARycY8egd18ioQN1Yi4mInkFseMBFYEZMskhwkr8IqbgqmAkFIsilJWsWNxVwgqEuWSdIqbgxFBIJ+yeZI0ipuKMUEgt5kcyZpFTeEogIBfsvFfw0MesAQCx4cNMbif19mKS7wsOECSVwgiQskcYEkLpDEBZK4QBIXSOICSVwgiQskcYEkLpDEBZK4QBIXSOICSVwgiQskcYEkLpDEBZK4QJJ/WtYin5cbQOEAAAAASUVORK5CYII=",
          connect: () => openAppKit({ view: "Connect", namespace: "eip155" }),
        },
      ],
      disconnect: () => disconnectAppKit({ namespace: "eip155" }),
    },
    [ChainFamily.TRON]: {
      family: ChainFamily.TRON,
      address: tronWalletConnection.address,
      wallet: tronWalletConnection.wallet,
      connectOptions: [
        {
          id: "tron-wallet-connect",
          label: "WalletConnect",
          imageUrl:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAADj0lEQVR4nO2aIWxUQRCGB0MNh6ppURgOhaBXAyRAFSQ0KATgEIenRfeqKUgS6gGBIjQBRRGgoAgwLQZFa1AUA6bMn+Mll/b6bnf/nb1rM1/y7vadmNx8nd3ZfdcjU493dsRJxgWSuEASF0jiAklcIIkLJHGBJC6QxAWSuEASF0jiAklcIIkLJHGBJC6QxAWSuEASF0jiAklcIIkLJBk5gVOT+qJMNEQm9QKb2yJbeoG1TX0ZIYYusDkucnZC5NJJlXdCPwhg7YfIu+8in7dENn7qB0NkaAIh7N45rbLjekOw+UtkcVWlDqkyiwucmhRpt/Q9sNpCQVUuf9L3wiKLCWwc1Yo7LzJ7Wm8MebUu8uiDyPZfvSlAEYFoBg+udNe7EmBdvP9Gp/f/xmOJuUBM2SWV1xjTm4Js/xGZV4nWU9pU4GxTZGFGBwH81oSRLLorKuebVlE1DTH9T2n1opLRfC7qFQokIqYVpgJX72jyYzqoAeKw+D/7ojcRtFsit86IHBsQH3+Uuy91YISpwDltGjc1yf1Y/ijyXMVVlRYLKhPx29N6sw+Lb7WxbOjACFOBoDMjcq2pgx5QdZ3VfFML07pzeW81WssD5gJBbyVibcPGF50yJ83xbrPCERCUkAeKCASzza5ErEepU3YQmNJLV0VW1svIA1kEYqsCsGDn5CDEpQWisqqtSs5pc1DiUgLbLb12dcAcX6o3yYpRjZsscEG73n7nWuZL9Uuywiouzs9obCkkCWyOizy9oYMaUpKtS7LCKu7tF2k7gySB6HZPrnePV3XEJFtX0bvBBhynlxBC5GFrlbo7SBIIckqMkVcRMu2s5YFkgSBU4sP3emT7qoM+pMirqJPYbuk1rYMaWHmAEghCJfZLlpFXkRo3hzxACwQpEkOTBBZxc8gDWQSCGIlgUJI4Jcy/1oGSM25OeSCbQBAqcRAr2nQ62nwqEHfuwt6nOrHklgeyCgRIlpG4W14v/R6NhWIhD2QXCCARycY8egd18ioQN1Yi4mInkFseMBFYEZMskhwkr8IqbgqmAkFIsilJWsWNxVwgqEuWSdIqbgxFBIJ+yeZI0ipuKMUEgt5kcyZpFTeEogIBfsvFfw0MesAQCx4cNMbif19mKS7wsOECSVwgiQskcYEkLpDEBZK4QBIXSOICSVwgiQskcYEkLpDEBZK4QBIXSOICSVwgiQskcYEkLpDEBZK4QJJ/WtYin5cbQOEAAAAASUVORK5CYII=",
          connect: () => openAppKit({ view: "Connect", namespace: "tron" }),
        },
        {
          id: "tron-link",
          label: "TronLink",
          imageUrl:
            "data:image/png;base64,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",
          connect: connectTronLink,
        },
      ],
      disconnect: tronWalletConnection.disconnect,
    },
  };
}

function WalletFamilyCard({ walletFamily }: { walletFamily: WalletFamily }) {
  return (
    <section className="rounded-lg border p-3">
      <WalletFamilyCardHeader walletFamily={walletFamily} />

      {walletFamily.address ? (
        <ConnectedWalletDetails walletFamily={walletFamily} />
      ) : (
        <ConnectOptionList options={walletFamily.connectOptions} />
      )}
    </section>
  );
}

function WalletFamilyCardHeader({ walletFamily }: { walletFamily: WalletFamily }) {
  const metadata = CHAIN_FAMILY_METADATA[walletFamily.family];

  // const isConnected = Boolean(walletFamily.address);

  return (
    <div>
      <span className="text-sm font-medium">{metadata.label}</span>
    </div>
  );
}

function ConnectedWalletDetails({ walletFamily }: { walletFamily: WalletFamily }) {
  const metadata = CHAIN_FAMILY_METADATA[walletFamily.family];
  const address = walletFamily.address;

  if (!address) return null;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-9">
        <AvatarImage src={walletFamily.wallet?.iconUrl || metadata.imageUrl} alt={metadata.label} />
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {walletFamily.wallet?.name || metadata.label}
        </div>
        <div className="text-muted-foreground truncate font-mono text-xs">
          {trimStringWithEllipsis(address, 6, 4)}
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        onClick={() => void walletFamily.disconnect()}
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}

function ConnectOptionList({ options }: { options: ConnectOption[] }) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => (
        <Button
          type="button"
          variant="ghost"
          key={option.id}
          className="h-9 w-full justify-start p-1"
          onClick={option.connect}
        >
          <img src={option.imageUrl} alt={option.label} className="mr-4 size-7 rounded-md" />

          <span className="text-muted-foreground text-sm font-medium">{option.label}</span>
        </Button>
      ))}
    </div>
  );
}

function ChainFamilyAvatarStack({ children }: { children: React.ReactNode }) {
  return <div className="flex -space-x-2">{children}</div>;
}

function ChainFamilyAvatar({ isConnected, family }: { isConnected: boolean; family: ChainFamily }) {
  const metadata = CHAIN_FAMILY_METADATA[family];

  return (
    <Avatar className="bg-background h-6 w-6 border">
      <AvatarImage
        src={metadata.imageUrl}
        alt={metadata.label}
        className={cn(!isConnected && "grayscale opacity-20")}
      />
      <AvatarFallback className="text-[10px]">{metadata.label.slice(0, 1)}</AvatarFallback>
    </Avatar>
  );
}
