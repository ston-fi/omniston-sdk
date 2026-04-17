"use client";

import {
  type Quote,
  type OneOf,
  type QuoteOfType,
  type SettlementMethod,
  type UnsubscribeEvent,
  type TradeStatus,
  type InferObservableData,
  type Omniston,
  type TrackOrderRequest,
  type TrackSwapRequest,
  matchQuoteByType,
  useOmniston,
} from "@ston-fi/omniston-sdk-react";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type TradeTrackEvent =
  | OneOf<
      "swap",
      InferObservableData<ReturnType<InstanceType<typeof Omniston>["swapTrack"]>> | UnsubscribeEvent
    >
  | OneOf<
      "order",
      | InferObservableData<ReturnType<InstanceType<typeof Omniston>["orderTrack"]>>
      | UnsubscribeEvent
    >;

type TradeTrackState = {
  quote: Quote | null;
  tradeEvent: TradeTrackEvent | null;
  startTradeTrack: <T extends SettlementMethod>(
    data: T extends "swap"
      ? {
          quote: QuoteOfType<"swap">;
          trackTradeData: TrackSwapRequest;
        }
      : {
          quote: QuoteOfType<"order">;
          trackTradeData: TrackOrderRequest;
          htlcSecrets: Uint8Array<ArrayBufferLike>[] | undefined;
        },
  ) => Promise<void>;
  stopTradeTrack: (quoteId: Quote["quoteId"]) => void;
};

const TradeTrackContext = createContext<TradeTrackState>({
  quote: null,
  tradeEvent: null,
  startTradeTrack: async () => {},
  stopTradeTrack: () => {},
});

export const TradeTrackProvider = ({ children }: React.PropsWithChildren) => {
  const omniston = useOmniston();
  const queryClient = useQueryClient();

  const tradeSubscriptionsMapRef = useRef<Record<Quote["quoteId"], VoidFunction>>({});

  const [quote, setQuote] = useState<TradeTrackState["quote"]>(null);
  const [tradeEvent, setTradeEvent] = useState<TradeTrackState["tradeEvent"]>(null);

  const startTradeTrack = useCallback<TradeTrackState["startTradeTrack"]>(
    async (data) => {
      const quoteId = data.trackTradeData.quoteId;

      if (tradeSubscriptionsMapRef.current[quoteId]) return;

      setQuote(data.quote);
      setTradeEvent(null);

      const invalidateAssets = () => queryClient.invalidateQueries({ queryKey: ["assets"] });

      const isTradeStatusFinal = (tradeStatus: TradeStatus) =>
        tradeStatus === "TRADE_STATUS_PARTIALLY_FILLED" ||
        tradeStatus === "TRADE_STATUS_FULLY_FILLED" ||
        tradeStatus === "TRADE_STATUS_CANCELLED" ||
        tradeStatus === "TRADE_STATUS_FAILED";

      matchQuoteByType(data.quote, {
        swap: async () => {
          const stream = await omniston.swapTrack(data.trackTradeData as TrackSwapRequest);
          const subscription = stream.subscribe({
            next: (event) => {
              switch (event?.$case) {
                case "awaitingTransfer": {
                  setTradeEvent({ $case: "swap", value: event });

                  break;
                }
                case "progress": {
                  setTradeEvent({ $case: "swap", value: event });

                  if (isTradeStatusFinal(event.value.status)) {
                    invalidateAssets();
                    subscription.unsubscribe();
                    delete tradeSubscriptionsMapRef.current[quoteId];
                  }

                  break;
                }
              }
            },
          });

          tradeSubscriptionsMapRef.current[quoteId] = subscription.unsubscribe;
        },
        order: async () => {
          const htlcSecrets = "htlcSecrets" in data ? data.htlcSecrets : undefined;
          const chunksSecretsDisclosed = Array.from(
            { length: htlcSecrets?.length ?? 0 },
            () => false,
          );

          const stream = await omniston.orderTrack(data.trackTradeData);
          const subscription = stream.subscribe({
            next: (event) => {
              switch (event?.$case) {
                case "order": {
                  setTradeEvent({ $case: "order", value: event });

                  if (htlcSecrets) {
                    event.value.executions.forEach((execution, executionIndex) => {
                      const secret = htlcSecrets[executionIndex];
                      const secretWasDisclosed = chunksSecretsDisclosed[executionIndex];

                      if (
                        secret &&
                        !secretWasDisclosed &&
                        !!execution.outputPositionPhase &&
                        execution.outputPositionPhase !== "UNRECOGNIZED"
                      ) {
                        omniston.orderDiscloseHtlcSecret({
                          quoteId,
                          executionIndex,
                          secret,
                        });

                        chunksSecretsDisclosed[executionIndex] = true;
                      }
                    });
                  }

                  if (isTradeStatusFinal(event.value.status)) {
                    invalidateAssets();
                    subscription.unsubscribe();
                    delete tradeSubscriptionsMapRef.current[quoteId];
                  }

                  break;
                }
              }
            },
          });

          tradeSubscriptionsMapRef.current[quoteId] = subscription.unsubscribe;
        },
      });
    },
    [omniston, queryClient],
  );

  const stopTradeTrack = useCallback<TradeTrackState["stopTradeTrack"]>((quoteId) => {
    tradeSubscriptionsMapRef.current[quoteId]?.();
    delete tradeSubscriptionsMapRef.current[quoteId];
  }, []);

  useEffect(
    () => () => {
      Object.values(tradeSubscriptionsMapRef.current).forEach((unsubscribe) => unsubscribe());
    },
    [],
  );

  return (
    <TradeTrackContext.Provider value={{ quote, tradeEvent, startTradeTrack, stopTradeTrack }}>
      {children}
    </TradeTrackContext.Provider>
  );
};

export const useTradeTrackState = () => {
  const context = useContext(TradeTrackContext);

  if (!context) {
    throw new Error("useTradeTrackState must be used within a TradeTrackProvider");
  }

  return context;
};
