export const RPC = {
  QUOTE: {
    QUOTE: {
      EVENT: "stonfi.omni.v1beta8.QuoteRpc.Quote",
      SUBSCRIBE: "stonfi.omni.v1beta8.QuoteRpc.Quote",
      UNSUBSCRIBE: "stonfi.omni.v1beta8.QuoteRpc.Quote.unsubscribe",
    },
  },
  TON: {
    GET_ESCROW_VAULT_BALANCES: "stonfi.omni.v1beta8.TonRpc.GetEscrowVaultBalances",
    BUILD_SWAP: "stonfi.omni.v1beta8.TonRpc.BuildSwap",
    BUILD_ESCROW_TRANSFER: "stonfi.omni.v1beta8.TonRpc.BuildEscrowTransfer",
    BUILD_ESCROW_CANCELLATION: "stonfi.omni.v1beta8.TonRpc.BuildEscrowCancellation",
  },
  EVM: {
    BUILD_ORDER_PAYLOAD: "stonfi.omni.v1beta8.EvmRpc.BuildOrderPayload",
    BUILD_ORDER_CANCELLATION: "stonfi.omni.v1beta8.EvmRpc.BuildOrderCancellation",
  },
  SWAP: {
    TRACK: {
      EVENT: "stonfi.omni.v1beta8.SwapRpc.Track",
      SUBSCRIBE: "stonfi.omni.v1beta8.SwapRpc.Track",
      UNSUBSCRIBE: "stonfi.omni.v1beta8.SwapRpc.Track.unsubscribe",
    },
  },
  ORDER: {
    GET_ACTIVE: "stonfi.omni.v1beta8.OrderRpc.GetActive",
    TRACK: {
      EVENT: "stonfi.omni.v1beta8.OrderRpc.Track",
      SUBSCRIBE: "stonfi.omni.v1beta8.OrderRpc.Track",
      UNSUBSCRIBE: "stonfi.omni.v1beta8.OrderRpc.Track.unsubscribe",
    },
    REGISTER_SIGNED_ORDER: "stonfi.omni.v1beta8.OrderRpc.RegisterSignedOrder",
    CANCEL_SIGNED_ORDER: "stonfi.omni.v1beta8.OrderRpc.CancelSignedOrder",
    DISCLOSE_HTLC_SECRET: "stonfi.omni.v1beta8.OrderRpc.DiscloseHtlcSecret",
  },
} as const;
