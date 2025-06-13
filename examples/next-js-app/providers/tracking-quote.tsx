import type { Quote } from "@ston-fi/omniston-sdk-react";
import React, { createContext, useContext, useEffect, useState } from "react";

import { useSwapForm } from "./swap-form";

type TrackingQuoteState = {
  quoteId: Quote["quoteId"] | null;
  setQuoteId: React.Dispatch<React.SetStateAction<Quote["quoteId"] | null>>;
  externalTxHash: string | null;
  setExternalTxHash: React.Dispatch<React.SetStateAction<string | null>>;
};

const TrackingQuoteContext = createContext<TrackingQuoteState>({
  quoteId: null,
  setQuoteId: () => {},
  externalTxHash: null,
  setExternalTxHash: () => {},
});

export const useTrackingQuoteState = () => {
  const context = useContext(TrackingQuoteContext);

  if (!context) {
    throw new Error(
      "useTrackingQuoteState must be used within a TrackingQuoteProvider",
    );
  }

  return context;
};

export const TrackingQuoteProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { askAsset, bidAsset, askAmount, bidAmount } = useSwapForm();
  const [quoteId, setQuoteId] = useState<TrackingQuoteState["quoteId"]>(null);
  const [externalTxHash, setExternalTxHash] =
    useState<TrackingQuoteState["externalTxHash"]>(null);

  useEffect(() => {
    setQuoteId(null);
  }, [askAsset?.address, bidAsset?.address, askAmount, bidAmount]);

  return (
    <TrackingQuoteContext.Provider
      value={{ quoteId, setQuoteId, externalTxHash, setExternalTxHash }}
    >
      {children}
    </TrackingQuoteContext.Provider>
  );
};
