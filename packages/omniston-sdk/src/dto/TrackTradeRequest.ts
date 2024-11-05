import { TrackTradeRequest as ApiTrackTradeRequest } from "@/api/messages/omni/v1beta5/trader/trade";
import type { SetNonNullable } from "@/types";

export type TrackTradeRequest = SetNonNullable<
  ApiTrackTradeRequest,
  "traderWalletAddress"
>;

export const TrackTradeRequest = ApiTrackTradeRequest;
