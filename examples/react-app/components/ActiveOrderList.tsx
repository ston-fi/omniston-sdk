import type { ActiveOrder } from "@ston-fi/omniston-sdk-react";
import { useQueries } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useMemo } from "react";

import { QuoteDataPresenter } from "~/components/QuotePreview";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { useConnectedWallets } from "~/hooks/useConnectedWallets";
import { useEnsureQuoteAssets } from "~/hooks/useEnsureQuoteAssets";
import { useOmniston } from "~/hooks/useOmniston";
import { useQuoteAssets } from "~/hooks/useQuoteAssets";
import { bigNumberToFloat, cn } from "~/lib/utils";

export const ActiveOrderList = ({ className }: { className?: string }) => {
  const omniston = useOmniston();
  const { walletAddressByChain: connectedWalletAddressByChain } = useConnectedWallets();

  const connectedWalletAddresses = useMemo(
    () => Object.values(connectedWalletAddressByChain).filter(Boolean),
    [connectedWalletAddressByChain],
  );

  const activeOrdersQuery = useQueries({
    queries: connectedWalletAddresses.map((connectedWalletAddress) => ({
      queryKey: ["orderGetActive", { traderAddress: connectedWalletAddress }],
      queryFn: async () => ({
        traderAddress: connectedWalletAddress,
        orders: (await omniston.orderGetActive({ traderAddress: connectedWalletAddress }))
          .activeOrders,
      }),
    })),
  });

  const activeOrders = useMemo(
    () =>
      activeOrdersQuery.flatMap((queryResult) => {
        if (!queryResult.data) return [];

        return queryResult.data.orders;
      }),
    [activeOrdersQuery],
  );

  const isActiveOrdersQueryLoading = activeOrdersQuery.some((queryResult) => queryResult.isLoading);
  const activeOrderQuotes = useMemo(
    () => activeOrders.map((activeOrder) => activeOrder.quote),
    [activeOrders],
  );
  const activeOrderAssets = useEnsureQuoteAssets(activeOrderQuotes);

  if (isActiveOrdersQueryLoading) return null;
  if (activeOrders.length === 0) return null;
  if (activeOrderAssets.error) throw activeOrderAssets.error;
  if (!activeOrderAssets.isReady) return null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <h2>Your pending orders:</h2>

      <ul className="flex flex-col gap-1">
        {activeOrders.map((activeOrder) => (
          <ActiveOrderListItem key={activeOrder.quote.quoteId} order={activeOrder} />
        ))}
      </ul>
    </div>
  );
};

function ActiveOrderListItem({ order }: { order: ActiveOrder }) {
  const { inputAsset, inputNativeAsset, outputAsset, outputNativeAsset } = useQuoteAssets(
    order.quote,
  );

  return (
    <li className="flex flex-col gap-2 rounded-md border p-4">
      <Collapsible className="group">
        <CollapsibleTrigger className="flex w-full flex-row items-center gap-1">
          <p className="flex flex-wrap items-baseline gap-x-1 font-mono">
            <span className="whitespace-nowrap">{`${bigNumberToFloat(order.quote.inputUnits, inputAsset.metadata.decimals)} ${inputAsset.metadata.symbol} (${inputAsset.id.chain.$case.toLocaleUpperCase()})`}</span>
            <span className="text-muted-foreground">→</span>
            <span className="whitespace-nowrap">{`${bigNumberToFloat(order.quote.outputUnits, outputAsset.metadata.decimals)} ${outputAsset.metadata.symbol} (${outputAsset.id.chain.$case.toLocaleUpperCase()})`}</span>
          </p>

          <ChevronDown
            size={16}
            className="ml-auto shrink-0 transition-transform group-data-[state=open]:rotate-180"
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="bg-secondary/50 mt-2 rounded-md p-2">
            <QuoteDataPresenter quote={order.quote} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}
