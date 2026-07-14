"use client";

import {
  useAppKit,
  useAppKitAccount,
  useDisconnect as useAppKitDisconnect,
  useWalletInfo,
} from "@reown/appkit/react";
import {
  useTonAddress,
  useTonConnectModal,
  useTonConnectUI,
  useTonWallet,
} from "@tonconnect/ui-react";
import { LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { cn, trimStringWithEllipsis } from "~/lib/utils";
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

const SUPPORTED_WALLET_FAMILIES = [ChainFamily.TON, ChainFamily.EVM] as const;

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
