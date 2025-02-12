import type { SetOptional } from "type-fest";
import type { RequestSettlementParams as ApiRequestSettlementParams } from "../api/messages/omni/v1beta6/types/quote";

export type RequestSettlementParams = SetOptional<
  ApiRequestSettlementParams,
  "maxOutgoingMessages" | "maxPriceSlippageBps"
>;
