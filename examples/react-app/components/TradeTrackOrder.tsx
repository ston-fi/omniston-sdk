"use client";

import {
  type Quote,
  type Execution,
  ExecutionPhase,
  type ExecutionPhaseTimestamps,
  type Order,
  type QuoteOfType,
  isOrderQuote,
} from "@ston-fi/omniston-sdk-react";

import { bigNumberToFloat, cn, trimStringWithEllipsis } from "@/lib/utils";
import { useAssets } from "@/providers/assets";
import { Copy } from "@/components/ui/copy";
import { ExplorerAddressPreview } from "@/components/ExplorerAddressPreview";
import { TradeTrackStatusPresenter } from "@/components/TradeTrackStatusPresenter";
import { DescriptionList } from "@/components/ui/description-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Chain } from "@/models/chain";
import { CopyJsonCard } from "@/components/ui/copy-json-card";
import { useTradeTrackState } from "@/providers/trade-track";

export function TradeTrackOrder(props: { className?: string }) {
  const { quote: trackingQuote, tradeEvent: tradeTrackProgress } = useTradeTrackState();

  if (!trackingQuote || !isOrderQuote(trackingQuote)) return null;

  const orderTrackEvent =
    tradeTrackProgress?.$case === "order" ? tradeTrackProgress.value : undefined;

  switch (orderTrackEvent?.$case) {
    case "order": {
      return <OrderEventView {...props} quote={trackingQuote} order={orderTrackEvent.value} />;
    }
    case "unsubscribed": {
      return (
        <TradeTrackOrderCard {...props}>
          <DescriptionList>
            <li>
              <span>Status:</span>
              <span className="text-red-500">Unsubscribed</span>
            </li>
          </DescriptionList>
        </TradeTrackOrderCard>
      );
    }
    default: {
      return (
        <TradeTrackOrderCard className={props.className}>
          <DescriptionList>
            <li>
              <span>Awaiting order status information...</span>
            </li>
          </DescriptionList>
          <hr />
          <Skeleton className="h-[88px] w-full" />
        </TradeTrackOrderCard>
      );
    }
  }
}

function TradeTrackOrderCard({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div {...props} className={cn("flex flex-col gap-2 p-4 border rounded-md", className)}>
      {children}
    </div>
  );
}

function OrderEventView({
  quote,
  order,
  ...props
}: {
  quote: QuoteOfType<"order">;
  order: Order;
  className?: string;
}) {
  const { getAssetById } = useAssets();

  const inputAsset = getAssetById(quote.inputAsset);

  if (!inputAsset) return null;

  const {
    status,
    estimatedFinishTimestamp,
    executions,
    protocolContractAddress,
    remainingInputUnits,
  } = order;

  return (
    <div className={cn("flex flex-col gap-2 p-4 border rounded-md", props.className)}>
      <DescriptionList>
        <li>
          <span>Status:</span>
          <TradeTrackStatusPresenter status={status} />
        </li>

        <hr />

        {estimatedFinishTimestamp ? (
          <li>
            <span>Estimated finish timestamp:</span>
            <span>{new Date(estimatedFinishTimestamp * 1000).toLocaleString()}</span>
          </li>
        ) : null}
        <li>
          <span>Protocol contract address:</span>
          <ExplorerAddressPreview address={protocolContractAddress}>
            {trimStringWithEllipsis(protocolContractAddress.chain.value, 6)}
          </ExplorerAddressPreview>
        </li>
        <li>
          <span>Remaining input units:</span>
          <p>{`${bigNumberToFloat(remainingInputUnits, inputAsset.metadata.decimals)} ${inputAsset.metadata.symbol}`}</p>
        </li>
      </DescriptionList>

      {executions.length > 0 ? (
        <CopyJsonCard title="" value={executions}>
          {executions.map((execution) => (
            <EscrowExecution
              key={execution.index}
              quote={quote}
              executions={executions}
              execution={execution}
            />
          ))}
        </CopyJsonCard>
      ) : null}
    </div>
  );
}

function EscrowExecution({
  quote,
  executions,
  execution,
}: {
  quote: Pick<Quote, "inputAsset" | "outputAsset">;
  executions: Execution[];
  execution: Execution;
}) {
  const { getAssetById } = useAssets();

  const inputAsset = getAssetById(quote.inputAsset);
  const outputAsset = getAssetById(quote.outputAsset);

  if (!inputAsset || !outputAsset) return null;

  const {
    index,
    inputUnits,
    outputUnits,
    resolverSendsUnits,
    secretHash,
    resolverId,
    resolverName,
    inputPositionAddress,
    inputPositionPhase,
    inputPositionPhaseTimestamps,
    srcResolverAddress,
    outputPositionAddress,
    outputPositionPhase,
    outputPositionPhaseTimestamps,
  } = execution;

  const secretHashStr = secretHash?.toString();

  return (
    <div className="flex flex-col gap-2">
      <span>{`↳ chunk ${index + 1}/${executions.length}`}</span>
      <DescriptionList className="ml-5">
        <li>
          <span>Resolved by:</span>
          <ExplorerAddressPreview
            address={{
              chain: {
                $case: Chain.TON,
                value: resolverId,
              },
            }}
          >
            {resolverName}
          </ExplorerAddressPreview>
        </li>
        {secretHashStr ? (
          <li>
            <span>secretHash</span>
            <Copy value={secretHashStr}>{trimStringWithEllipsis(secretHashStr, 6)}</Copy>
          </li>
        ) : null}
        <hr />
        <li>
          <span>inputUnits:</span>
          <p>{`${bigNumberToFloat(inputUnits, inputAsset.metadata.decimals)} ${inputAsset.metadata.symbol}`}</p>
        </li>
        {
          <li>
            <span>srcResolverAddress</span>
            <ExplorerAddressPreview address={srcResolverAddress}>
              {trimStringWithEllipsis(srcResolverAddress.chain.value, 6)}
            </ExplorerAddressPreview>
          </li>
        }
        <li>
          <span>inputPositionAddress</span>
          <ExplorerAddressPreview address={inputPositionAddress}>
            {trimStringWithEllipsis(inputPositionAddress.chain.value, 6)}
          </ExplorerAddressPreview>
        </li>
        <li>
          <span>inputPositionPhase</span>
          <ExecutionPhasePresenter phase={inputPositionPhase} />
        </li>
        <ExecutionPhaseTimestampsPresenter timestamps={inputPositionPhaseTimestamps} />
        <hr />
        <li>
          <span>outputUnits</span>
          <p>{`${bigNumberToFloat(outputUnits, outputAsset.metadata.decimals)} ${outputAsset.metadata.symbol}`}</p>
        </li>
        <li>
          <span>resolverSendsUnits</span>
          <p>{`${bigNumberToFloat(resolverSendsUnits, outputAsset.metadata.decimals)} ${outputAsset.metadata.symbol}`}</p>
        </li>
        {outputPositionAddress ? (
          <li>
            <span>outputPositionAddress</span>
            <ExplorerAddressPreview address={outputPositionAddress}>
              {trimStringWithEllipsis(outputPositionAddress.chain.value, 6)}
            </ExplorerAddressPreview>
          </li>
        ) : null}
        {outputPositionPhase ? (
          <li>
            <span>outputPositionPhase</span>
            <ExecutionPhasePresenter phase={outputPositionPhase} />
          </li>
        ) : null}
        {outputPositionPhaseTimestamps ? (
          <ExecutionPhaseTimestampsPresenter timestamps={outputPositionPhaseTimestamps} />
        ) : null}
      </DescriptionList>
    </div>
  );
}

function ExecutionPhasePresenter({ phase }: { phase: ExecutionPhase }) {
  if (phase === "EXECUTION_PHASE_CREATED") {
    return <span>Created</span>;
  } else if (phase === "EXECUTION_PHASE_READY_FOR_PRIVATE_COMPLETION") {
    return <p className="text-yellow-500">Ready for private completion</p>;
  } else if (phase === "EXECUTION_PHASE_READY_FOR_PUBLIC_COMPLETION") {
    return <p className="text-yellow-500">Ready for public completion</p>;
  } else if (phase === "EXECUTION_PHASE_READY_FOR_PRIVATE_ROLLBACK") {
    return <p className="text-yellow-500">Ready for private rollback</p>;
  } else if (phase === "EXECUTION_PHASE_READY_FOR_PUBLIC_ROLLBACK") {
    return <p className="text-yellow-500">Ready for public rollback</p>;
  } else if (phase === "EXECUTION_PHASE_COMPLETED") {
    return <p className="text-green-500">Completed</p>;
  } else if (phase === "EXECUTION_PHASE_ROLLED_BACK") {
    return <p className="text-red-500">Rolled back</p>;
  } else if (phase === "UNRECOGNIZED") {
    return <p className="text-red-500">Unrecognized</p>;
  }

  return null;
}

function ExecutionPhaseTimestampsPresenter({
  timestamps,
}: {
  timestamps: ExecutionPhaseTimestamps;
}) {
  const {
    privateCompletionAvailableTimestamp,
    publicCompletionAvailableTimestamp,
    privateRollbackAvailableTimestamp,
    publicRollbackAvailableTimestamp,
  } = timestamps;

  return (
    <>
      {privateCompletionAvailableTimestamp ? (
        <li>
          <span>privateCompletionAvailableTimestamp:</span>
          <pre>{new Date(privateCompletionAvailableTimestamp * 1000).toLocaleString()}</pre>
        </li>
      ) : null}
      {publicCompletionAvailableTimestamp ? (
        <li>
          <span>publicCompletionAvailableTimestamp:</span>
          <pre>{new Date(publicCompletionAvailableTimestamp * 1000).toLocaleString()}</pre>
        </li>
      ) : null}
      <li>
        <span>privateRollbackAvailableTimestamp:</span>
        <pre>{new Date(privateRollbackAvailableTimestamp * 1000).toLocaleString()}</pre>
      </li>
      {publicRollbackAvailableTimestamp ? (
        <li>
          <span>publicRollbackAvailableTimestamp:</span>
          <pre>{new Date(publicRollbackAvailableTimestamp * 1000).toLocaleString()}</pre>
        </li>
      ) : null}
    </>
  );
}
