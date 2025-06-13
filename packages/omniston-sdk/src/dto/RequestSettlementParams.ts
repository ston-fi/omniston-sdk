import type { SetOptional } from "type-fest";
import type { RequestSettlementParams as ApiRequestSettlementParams } from "../api/messages/omni/v1beta7/types/quote";

export type RequestSettlementParams = SetOptional<
  ApiRequestSettlementParams,
  "maxOutgoingMessages" | "maxPriceSlippageBps"
>;
