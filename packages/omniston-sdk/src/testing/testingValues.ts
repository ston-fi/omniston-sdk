import { GaslessSettlement } from "../api/messages/omni/v1beta7/types/quote";
import { Blockchain, SettlementMethod } from "../constants";
import type { Address } from "../dto/Address";
import type { Quote } from "../dto/Quote";
import type { QuoteEvent } from "../dto/QuoteEvent";
import type { QuoteRequest } from "../dto/QuoteRequest";
import type { TrackTradeRequest } from "../dto/TrackTradeRequest";
import type { TradeStatus } from "../dto/TradeStatus";
import type { TransactionRequest } from "../dto/TransactionRequest";
import type { TransactionResponse } from "../dto/TransactionResponse";

export const assetTon: Address = {
  address: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",
  blockchain: Blockchain.TON,
};

export const assetTestRed: Address = {
  address: "kQDLvsZol3juZyOAVG8tWsJntOxeEZWEaWCbbSjYakQpuYN5",
  blockchain: Blockchain.TON,
};

export const assetTestBlue: Address = {
  address: "kQB_TOJSB7q3-Jm1O8s0jKFtqLElZDPjATs5uJGsujcjznq3",
  blockchain: Blockchain.TON,
};

export const quoteRequestSwap: QuoteRequest = {
  bidAssetAddress: assetTestRed,
  amount: {
    askUnits: "1000",
  },
  askAssetAddress: assetTestBlue,
  referrerAddress: {
    address: "UQAQnxLqlX2B6w4jQzzzPWA8eyWZVZBz6Y0D_8noARLOaEAn",
    blockchain: Blockchain.TON,
  },
  referrerFeeBps: 0,
  settlementMethods: [SettlementMethod.SETTLEMENT_METHOD_SWAP],
  settlementParams: {
    maxPriceSlippageBps: 0,
    gaslessSettlement: GaslessSettlement.GASLESS_SETTLEMENT_POSSIBLE,
  },
};

export const quoteRequestEscrow: QuoteRequest = {
  ...quoteRequestSwap,
  settlementMethods: [SettlementMethod.SETTLEMENT_METHOD_ESCROW],
};

export const testQuote = {
  quoteId: "testQuoteId",
  bidAssetAddress: assetTestRed,
  askAssetAddress: assetTestBlue,
  resolverId: "testResolverId",
  resolverName: "testResolverName",
  bidUnits: "1000",
  askUnits: "1000",
  quoteTimestamp: 0,
  referrerAddress: {
    address: "UQAQnxLqlX2B6w4jQzzzPWA8eyWZVZBz6Y0D_8noARLOaEAn",
    blockchain: Blockchain.TON,
  },
  referrerFeeUnits: "0",
  protocolFeeUnits: "0",
  params: {},
  tradeStartDeadline: 0,
  gasBudget: "1000000000",
  estimatedGasConsumption: "100000000",
  referrerFeeAsset: assetTestBlue,
  protocolFeeAsset: assetTestBlue,
} as const satisfies Quote;

export const testEscrowQuote: Quote = {
  ...testQuote,
  params: {
    escrow: {
      gasless: false,
      contractAddress: {
        address: "testContractAddress",
        blockchain: Blockchain.TON,
      },
      resolverAddress: {
        address: "testResolverAddress",
        blockchain: Blockchain.TON,
      },
      resolveTimeout: 20000,
    },
  },
};

export const ackEvent: QuoteEvent = {
  event: {
    ack: {
      rfqId: "testRfqId",
    },
  },
};

export const newQuoteEvent: QuoteEvent = {
  event: {
    quoteUpdated: {
      ...testQuote,
    },
  },
};

export const newEscrowQuoteEvent: QuoteEvent = {
  event: {
    quoteUpdated: {
      ...testEscrowQuote,
    },
  },
};

export const noQuoteEvent: QuoteEvent = {
  event: {
    noQuote: {},
  },
};

export const unsubscribedEvent: QuoteEvent = {
  event: {
    unsubscribed: {},
  },
};

export const testTransactionResponse: TransactionResponse = {
  ton: {
    messages: [
      {
        targetAddress: "kQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33a1n",
        sendAmount: "1000",
        jettonWalletStateInit: "",
        payload:
          "b5ee9c724101030100dc00016862002912ef5fde78329e98cfdd0b4e8263be0ea2477b1588c107ac5bd0ffefe7869ca08f0d1800000000000000000000000000010101690f8a7ea5a6ec99de1dfd6e06203e8800d8363e815801a95a2203bf0b7d0430581400a50defa95f04df2ddf6850ce6fba103b9aca030200d5259385618019124b1a9f74da00e0dbf7b583974446cbd0664dd73b3ea4c85a5bcacf57ca7cc403e90025d2b36c59d9d864f53031cc6cd7adad846c6fd2d92ab237c4df8ba7c9f36118b0025d2b36c59d9d864f53031cc6cd7adad846c6fd2d92ab237c4df8ba7c9f36118a283958b4",
      },
    ],
  },
};

export const testTransactionResponseBase64: TransactionResponse = {
  ton: {
    messages: [
      {
        targetAddress: "kQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33a1n",
        sendAmount: "1000",
        jettonWalletStateInit: "",
        payload:
          "te6cckEBAwEA3AABaGIAKRLvX954Mp6Yz90LToJjvg6iR3sViMEHrFvQ/+/nhpygjw0YAAAAAAAAAAAAAAAAAAEBAWkPin6lpuyZ3h39bgYgPogA2DY+gVgBqVoiA78LfQQwWBQApQ3vqV8E3y3faFDOb7oQO5rKAwIA1SWThWGAGRJLGp902gDg2/e1g5dERsvQZk3XOz6kyFpbys9XynzEA+kAJdKzbFnZ2GT1MDHMbNetrYRsb9LZKrI3xN+Lp8nzYRiwAl0rNsWdnYZPUwMcxs162thGxv0tkqsjfE34unyfNhGKKDlYtA==",
      },
    ],
  },
};

export const testTransactionRequest: TransactionRequest = {
  sourceAddress: {
    address: "0QCXSs2xZ2dhk9TAxzGzXra2EbG_S2SqyN8Tfi6fJ82EYsMs",
    blockchain: Blockchain.TON,
  },
  destinationAddress: {
    address: "0QCXSs2xZ2dhk9TAxzGzXra2EbG_S2SqyN8Tfi6fJ82EYsMs",
    blockchain: Blockchain.TON,
  },
  quote: testQuote,
  gasExcessAddress: {
    address: "0QCXSs2xZ2dhk9TAxzGzXra2EbG_S2SqyN8Tfi6fJ82EYsMs",
    blockchain: Blockchain.TON,
  },
  refundAddress: {
    address: "0QCXSs2xZ2dhk9TAxzGzXra2EbG_S2SqyN8Tfi6fJ82EYsMs",
    blockchain: Blockchain.TON,
  },
  useRecommendedSlippage: false,
};

const testWalletAddress: Address = {
  address: "UQCIkuK3Nt84YLY-u_CbpU7Pam1IlGQ2ui4chkLnGoi2AAd3",
  blockchain: Blockchain.TON,
};

const testTransactionId =
  "32e8d745c63cadb20bf171d2f21f17053d618ecf3efeed92dc8127c9a95f57b1";

export const testTrackTradeRequest: TrackTradeRequest = {
  quoteId: testQuote.quoteId,
  traderWalletAddress: testWalletAddress,
  outgoingTxHash: testTransactionId,
};

export const tradeStatusAwaitingTransfer: TradeStatus = {
  status: {
    awaitingTransfer: {},
  },
  transferTimestamp: 0,
  estimatedFinishTimestamp: 0,
};
