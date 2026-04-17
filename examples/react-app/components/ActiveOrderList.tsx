import { type ActiveOrder, type ChainAddress } from "@ston-fi/omniston-sdk-react";
import { useQueries } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useMemo } from "react";

import { ExplorerAddressPreview } from "@/components/ExplorerAddressPreview";
import { QuoteDataPresenter } from "@/components/QuotePreview";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { bigNumberToFloat, cn } from "@/lib/utils";
import { useOmniston } from "@/hooks/useOmniston";
import { useAssets } from "@/providers/assets";
import { useConnectedWallets } from "@/hooks/useConnectedWallets";
import { truncateAddress } from "@/models/address";

export const ActiveOrderList = ({ className }: { className?: string }) => {
  const omniston = useOmniston();
  const connectedWallets = useConnectedWallets();

  const walletAddresses = useMemo(
    () => Object.values(connectedWallets).filter(Boolean),
    [connectedWallets],
  );

  const activeOrdersQueryResults = useQueries({
    queries: walletAddresses.map((walletAddress) => ({
      queryKey: ["orderGetActive", { traderAddress: walletAddress }],
      queryFn: async () => ({
        traderAddress: walletAddress,
        orders: (await omniston.orderGetActive({ traderAddress: walletAddress })).activeOrders,
      }),
    })),
  });

  const activeOrders = useMemo(
    () =>
      activeOrdersQueryResults.flatMap((queryResult) => {
        if (!queryResult.data) return [];

        return queryResult.data.orders.map((order) => ({
          order,
          traderAddress: queryResult.data.traderAddress,
        }));
      }),
    [activeOrdersQueryResults],
  );

  const isLoading = activeOrdersQueryResults.some((queryResult) => queryResult.isLoading);

  if (!isLoading && activeOrders.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <h2>Your pending orders:</h2>

      <ul className="flex flex-col gap-1">
        {activeOrders.map((activeOrder) => (
          <ActiveOrderListItem
            key={activeOrder.order.quote.quoteId}
            order={activeOrder.order}
            traderAddress={activeOrder.traderAddress}
          />
        ))}
      </ul>
    </div>
  );
};

function ActiveOrderListItem({
  order,
  traderAddress,
}: {
  order: ActiveOrder;
  traderAddress: ChainAddress;
}) {
  const { getAssetById } = useAssets();

  const inputAsset = getAssetById(order.quote.inputAsset);
  const outputAsset = getAssetById(order.quote.outputAsset);

  if (!inputAsset || !outputAsset) {
    return null;
  }

  return (
    <li className="flex flex-col gap-2 rounded-md border p-4">
      <Collapsible className="group">
        <CollapsibleTrigger className="inline-flex w-full items-center gap-1">
          <span className="font-mono">{`${bigNumberToFloat(order.quote.inputUnits, inputAsset.metadata.decimals)} ${inputAsset.metadata.symbol} > ${bigNumberToFloat(order.quote.outputUnits, outputAsset.metadata.decimals)} ${outputAsset.metadata.symbol} from`}</span>
          <ExplorerAddressPreview address={traderAddress}>
            {truncateAddress(traderAddress)}
          </ExplorerAddressPreview>

          <ChevronDown
            size={16}
            className="ml-auto transition-transform group-data-[state=open]:rotate-180"
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
