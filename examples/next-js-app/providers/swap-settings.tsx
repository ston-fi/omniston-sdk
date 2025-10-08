"use client";

import { SettlementMethod as AllSettlementMethods } from "@ston-fi/omniston-sdk-react";
import React, { createContext, useContext, useEffect, useReducer } from "react";
import { z } from "zod";

export const DEFAULT_SLIPPAGE_TOLERANCE = 0.05;
export const DEFAULT_AUTO_SLIPPAGE_TOLERANCE = false;

const SETTINGS_STORAGE_KEY = "swapSettings";

export const SettlementMethod = {
  Swap: AllSettlementMethods.SETTLEMENT_METHOD_SWAP,
  Escrow: AllSettlementMethods.SETTLEMENT_METHOD_ESCROW,
};

export type SettlementMethod =
  (typeof SettlementMethod)[keyof typeof SettlementMethod];

const SwapSettingsSchema = z.object({
  slippageTolerance: z.number().min(0).max(1).catch(DEFAULT_SLIPPAGE_TOLERANCE),
  autoSlippageTolerance: z.boolean().catch(DEFAULT_AUTO_SLIPPAGE_TOLERANCE),
  referrerAddress: z.string().optional().catch(undefined),
  referrerFeeBps: z.number().min(0).max(100).optional().catch(undefined),
  flexibleReferrerFee: z.boolean().default(false).catch(false),
  settlementMethods: z
    .array(z.enum(SettlementMethod))
    .catch([SettlementMethod.Swap]),
});

export type SwapSettingsState = z.infer<typeof SwapSettingsSchema>;

type SwapSettingsAction =
  | { type: "SET_SLIPPAGE_TOLERANCE"; payload: number }
  | { type: "SET_AUTO_SLIPPAGE_TOLERANCE"; payload: boolean }
  | { type: "SET_SETTLEMENT_METHODS"; payload: SettlementMethod[] }
  | { type: "SET_REFERRER_ADDRESS"; payload: string | undefined }
  | { type: "SET_REFERRER_FEE_BPS"; payload: number | undefined }
  | { type: "SET_FLEXIBLE_REFERRER_FEE"; payload: boolean }
  | { type: "INITIALIZE_FROM_STORAGE"; payload: SwapSettingsState };

type SwapSettings = SwapSettingsState & {
  setSlippageTolerance: (slippageTolerance: number) => void;
  setAutoSlippageTolerance: (autoSlippageTolerance: boolean) => void;
  setSettlementMethods: (settlementMethods: SettlementMethod[]) => void;
  setReferrerAddress: (referrerAddress: string | undefined) => void;
  setReferrerFeeBps: (referrerFeeBps: number | undefined) => void;
  setFlexibleReferrerFee: (flexibleReferrerFee: boolean) => void;
};

const swapSettingsReducer = (
  state: SwapSettingsState,
  action: SwapSettingsAction,
): SwapSettingsState => {
  switch (action.type) {
    case "SET_SLIPPAGE_TOLERANCE":
      return { ...state, slippageTolerance: action.payload };
    case "SET_AUTO_SLIPPAGE_TOLERANCE":
      return { ...state, autoSlippageTolerance: action.payload };
    case "SET_SETTLEMENT_METHODS":
      return { ...state, settlementMethods: action.payload };
    case "INITIALIZE_FROM_STORAGE":
      return { ...action.payload };
    case "SET_REFERRER_ADDRESS":
      return { ...state, referrerAddress: action.payload };
    case "SET_REFERRER_FEE_BPS":
      return { ...state, referrerFeeBps: action.payload };
    case "SET_FLEXIBLE_REFERRER_FEE":
      return { ...state, flexibleReferrerFee: action.payload };
    default:
      return state;
  }
};

const SwapSettingsContext = createContext<SwapSettings>({} as SwapSettings);

export const SwapSettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = useReducer(
    swapSettingsReducer,
    SwapSettingsSchema.parse({}),
  );

  const setSlippageTolerance = (slippageTolerance: number) => {
    dispatch({ type: "SET_SLIPPAGE_TOLERANCE", payload: slippageTolerance });
  };

  const setAutoSlippageTolerance = (autoSlippageTolerance: boolean) => {
    dispatch({
      type: "SET_AUTO_SLIPPAGE_TOLERANCE",
      payload: autoSlippageTolerance,
    });
  };

  const setSettlementMethods = (settlementMethods: SettlementMethod[]) => {
    dispatch({ type: "SET_SETTLEMENT_METHODS", payload: settlementMethods });
  };

  const setReferrerAddress = (referrerAddress: string | undefined) => {
    dispatch({ type: "SET_REFERRER_ADDRESS", payload: referrerAddress });
  };

  const setReferrerFeeBps = (referrerFeeBps: number | undefined) => {
    dispatch({ type: "SET_REFERRER_FEE_BPS", payload: referrerFeeBps });
  };

  const setFlexibleReferrerFee = (flexibleReferrerFee: boolean) => {
    dispatch({
      type: "SET_FLEXIBLE_REFERRER_FEE",
      payload: flexibleReferrerFee,
    });
  };

  useEffect(() => {
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!storedSettings) return;

    dispatch({
      type: "INITIALIZE_FROM_STORAGE",
      payload: SwapSettingsSchema.parse(JSON.parse(storedSettings)),
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return (
    <SwapSettingsContext.Provider
      value={{
        ...state,
        setSlippageTolerance,
        setAutoSlippageTolerance,
        setSettlementMethods,
        setReferrerAddress,
        setReferrerFeeBps,
        setFlexibleReferrerFee,
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
