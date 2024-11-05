import type { QuoteEvent } from "@/dto/QuoteEvent";
import type { Quote } from "@/dto/Quote";
import type { QuoteRequest } from "@/dto/QuoteRequest";
import type { TrackTradeRequest } from "@/dto/TrackTradeRequest";
import type { TradeStatus } from "@/dto/TradeStatus";
import type { TransactionRequest } from "@/dto/TransactionRequest";
import type { TransactionResponse } from "@/dto/TransactionResponse";
import { Blockchain, SettlementMethod } from "..";
import type { AssetsResponse } from "@/dto/Assets";
import type { Address } from "@/dto/Address";

export const assetTestRed: Address = {
  address: "kQDLvsZol3juZyOAVG8tWsJntOxeEZWEaWCbbSjYakQpuYN5",
  blockchain: Blockchain.TON,
};
export const assetTestBlue: Address = {
  address: "kQB_TOJSB7q3-Jm1O8s0jKFtqLElZDPjATs5uJGsujcjznq3",
  blockchain: Blockchain.TON,
};
// export const assetTestGreen = "kQCMGEfYTE-PkbmyVidhnc5rb2XSxUDevi8b2GBw3-Ke7w_p";

export const quoteRequestSwap: QuoteRequest = {
  offerAssetAddress: assetTestRed,
  amount: {
    askUnits: "1000",
  },
  askAssetAddress: assetTestBlue,
  referrerAddress: {
    address: "EQCXSs2xZ2dhk9TAxzGzXra2EbG_S2SqyN8Tfi6fJ82EYiVj",
    blockchain: Blockchain.TON,
  },
  referrerFeeBps: 0,
  settlementMethods: [SettlementMethod.SETTLEMENT_METHOD_SWAP],
};

export const quoteRequestEscrow: QuoteRequest = {
  ...quoteRequestSwap,
  settlementMethods: [SettlementMethod.SETTLEMENT_METHOD_ESCROW],
};

export const testQuote = {
  quoteId: "testQuoteId",
  offerAssetAddress: assetTestRed,
  askAssetAddress: assetTestBlue,
  resolverId: "testResolverId",
  resolverName: "testResolverName",
  offerUnits: "1000",
  askUnits: "1000",
  quoteTimestamp: 0,
  referrerAddress: {
    address: "EQCXSs2xZ2dhk9TAxzGzXra2EbG_S2SqyN8Tfi6fJ82EYiVj",
    blockchain: Blockchain.TON,
  },
  referrerFeeUnits: "0",
  protocolFeeUnits: "0",
  params: {},
  tradeStartDeadline: 0,
} as const satisfies Quote;

export const testEscrowQuote: Quote = {
  ...testQuote,
  params: {
    escrow: {
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

export const testTransactionResponse: TransactionResponse = {
  transaction: {
    ton: {
      messages: [
        {
          targetAddress: "kQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33a1n",
          sendAmount: "1000",
          payload:
            "b5ee9c724101030100dc00016862002912ef5fde78329e98cfdd0b4e8263be0ea2477b1588c107ac5bd0ffefe7869ca08f0d1800000000000000000000000000010101690f8a7ea5a6ec99de1dfd6e06203e8800d8363e815801a95a2203bf0b7d0430581400a50defa95f04df2ddf6850ce6fba103b9aca030200d5259385618019124b1a9f74da00e0dbf7b583974446cbd0664dd73b3ea4c85a5bcacf57ca7cc403e90025d2b36c59d9d864f53031cc6cd7adad846c6fd2d92ab237c4df8ba7c9f36118b0025d2b36c59d9d864f53031cc6cd7adad846c6fd2d92ab237c4df8ba7c9f36118a283958b4",
        },
      ],
    },
  },
};

export const testTransactionResponseBase64: TransactionResponse = {
  transaction: {
    ton: {
      messages: [
        {
          targetAddress: "kQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33a1n",
          sendAmount: "1000",
          payload:
            "te6cckEBAwEA3AABaGIAKRLvX954Mp6Yz90LToJjvg6iR3sViMEHrFvQ/+/nhpygjw0YAAAAAAAAAAAAAAAAAAEBAWkPin6lpuyZ3h39bgYgPogA2DY+gVgBqVoiA78LfQQwWBQApQ3vqV8E3y3faFDOb7oQO5rKAwIA1SWThWGAGRJLGp902gDg2/e1g5dERsvQZk3XOz6kyFpbys9XynzEA+kAJdKzbFnZ2GT1MDHMbNetrYRsb9LZKrI3xN+Lp8nzYRiwAl0rNsWdnYZPUwMcxs162thGxv0tkqsjfE34unyfNhGKKDlYtA==",
        },
      ],
    },
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
  maxSlippageBps: 0,
  quote: testQuote,
};

const testWalletAddress: Address = {
  address: "UQCIkuK3Nt84YLY-u_CbpU7Pam1IlGQ2ui4chkLnGoi2AAd3",
  blockchain: Blockchain.TON,
};

export const testTrackTradeRequest: TrackTradeRequest = {
  quoteId: testQuote.quoteId,
  traderWalletAddress: testWalletAddress,
};

export const tradeStatusAwaitingTransfer: TradeStatus = {
  status: {
    awaitingTransfer: {},
  },
};

export const testAssetListResponse: AssetsResponse = {
  assets: [
    {
      address: {
        address: "EQAc6JFTD80zLgRvXieRuZDrWylrT-Lhbwz-0IaZQdrCHZQ7",
        blockchain: Blockchain.TON,
      },
      symbol: "AGP",
      decimals: 9,
      tags: [],
      name: "Arena Games Platform",
      imageUrl: "",
      metadata: {},
    },
    {
      address: {
        address: "EQD5eDfkbX2YWLME0ZG5e41xCkESh1ddtV2cyIb-s6Q232Ji",
        blockchain: Blockchain.TON,
      },
      symbol: "URB",
      name: "UrbanCoin",
      imageUrl:
        "https://asset.ston.fi/img/EQD5eDfkbX2YWLME0ZG5e41xCkESh1ddtV2cyIb-s6Q232Ji/23660511495478a1b44d31c0d5a9423e36c6a23308705b0e8f088fc9947791aa",
      decimals: 9,
      tags: [],
      metadata: {},
    },
    {
      address: {
        address: "EQAQ2wC8FATbUxFNlQPz-tYiNb9rokzrTg73WX7pjo_2J0fR",
        blockchain: Blockchain.TON,
      },
      symbol: "HUK",
      name: "HUYAK",
      imageUrl:
        "https://asset.ston.fi/img/EQAQ2wC8FATbUxFNlQPz-tYiNb9rokzrTg73WX7pjo_2J0fR/6d7bec9ad52fe71b5a062a582e513341db351d5d43549d90ade1f2f08e9eefe8",
      decimals: 9,
      tags: [],
      metadata: {},
    },
  ],
};
