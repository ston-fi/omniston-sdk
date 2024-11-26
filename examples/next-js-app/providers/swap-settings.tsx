import { createContext, useContext, useState } from "react";

type SwapSettings = {
  slippageTolerance: number;
  setSlippageTolerance: (value: SwapSettings["slippageTolerance"]) => void;
};

const DEFAULT_SLIPPAGE_TOLERANCE: SwapSettings["slippageTolerance"] = 0.05;

const SwapSettingsContext = createContext<SwapSettings>({} as SwapSettings);

export const SwapSettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [slippageTolerance, setSlippageTolerance] = useState(
    DEFAULT_SLIPPAGE_TOLERANCE,
  );

  return (
    <SwapSettingsContext.Provider
      value={{
        slippageTolerance,
        setSlippageTolerance,
      }}
    >
      {children}
    </SwapSettingsContext.Provider>
  );
};

export const useSwapSettings = () => {
  const context = useContext(SwapSettingsContext);

  if (!context) {
    throw new Error(
      "useSwapSettings must be used within a SwapSettingsProvider",
    );
  }

  return context;
};
