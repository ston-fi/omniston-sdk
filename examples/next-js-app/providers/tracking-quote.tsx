import type { Quote } from "@ston-fi/omniston-sdk-react";
import React, { createContext, useContext, useEffect, useState } from "react";

import { useSwapForm } from "./swap-form";

type TrackingQuoteState = {
  quoteId: Quote["quoteId"] | null;
  setQuoteId: React.Dispatch<React.SetStateAction<Quote["quoteId"] | null>>;
};

const TrackingQuoteContext = createContext<TrackingQuoteState>({
  quoteId: null,
  setQuoteId: () => {},
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
  const { askAsset, offerAsset, askAmount, offerAmount } = useSwapForm();
  const [quoteId, setQuoteId] = useState<TrackingQuoteState["quoteId"]>(null);

  useEffect(() => {
    setQuoteId(null);
  }, [
    askAsset?.address.address,
    offerAsset?.address.address,
    askAmount,
    offerAmount,
  ]);

  return (
    <TrackingQuoteContext.Provider value={{ quoteId, setQuoteId }}>
      {children}
    </TrackingQuoteContext.Provider>
  );
};
