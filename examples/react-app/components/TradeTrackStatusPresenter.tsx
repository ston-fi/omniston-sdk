import type { TradeStatus } from "@ston-fi/omniston-sdk-react";

import { Spinner } from "./ui/spinner";

export function TradeTrackStatusPresenter({ status }: { status: TradeStatus }) {
  if (status === "TRADE_STATUS_IN_PROGRESS") {
    return (
      <span className="inline-flex items-center gap-2">
        <Spinner />
        <span>In progress...</span>
      </span>
    );
  } else if (status === "TRADE_STATUS_FULLY_FILLED") {
    return <span className="text-green-500">Fully filled</span>;
  } else if (status === "TRADE_STATUS_PARTIALLY_FILLED") {
    return <span className="text-red-500">Partially filled</span>;
  } else if (status === "TRADE_STATUS_FAILED") {
    return <span className="text-red-500">Failed</span>;
  } else if (status === "TRADE_STATUS_CANCELLED") {
    return <span className="text-red-500">Cancelled</span>;
  } else if (status === "UNRECOGNIZED") {
    return <span className="text-red-500">Unrecognized</span>;
  }

  return null;
}
