import type { RequestSettlementParams as ApiRequestSettlementParams } from "../api/messages/omni/v1beta7/types/quote";
import type { SetOptional } from "../types";

export type RequestSettlementParams = SetOptional<
  ApiRequestSettlementParams,
  "maxOutgoingMessages" | "maxPriceSlippageBps"
>;
