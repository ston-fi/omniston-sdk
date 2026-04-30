"use client";

import { SettlementMethod } from "@ston-fi/omniston-sdk-react";
import { createContext, useContext, useEffect, useReducer, useRef } from "react";
import { z } from "zod";

export const DEFAULT_SLIPPAGE_TOLERANCE_PERCENT = 5;
export const MAX_SLIPPAGE_TOLERANCE_PERCENT = 100;
export const DEFAULT_AUTO_SLIPPAGE_TOLERANCE = false;
export const MAX_INTEGRATOR_FEE_PIPS = 10000;

const SETTINGS_STORAGE_KEY = "@ston-fi/swap-settings-state";

const SwapSettingsSchema = z.object({
  slippageTolerancePercent: z
    .number()
    .min(0)
    .max(MAX_SLIPPAGE_TOLERANCE_PERCENT)
    .catch(DEFAULT_SLIPPAGE_TOLERANCE_PERCENT),
  autoSlippageTolerance: z.boolean().catch(DEFAULT_AUTO_SLIPPAGE_TOLERANCE),
  integratorAddress: z.string().optional().catch(undefined),
  integratorFeePips: z.number().min(0).max(MAX_INTEGRATOR_FEE_PIPS).optional().catch(undefined),
  flexibleIntegratorFee: z.boolean().default(false).catch(false),
  htlcMaxExecutions: z.number().int().positive().catch(1),
  settlementMethods: z
    .array(z.enum(SettlementMethod))
    .catch([SettlementMethod.SWAP, SettlementMethod.ORDER]),
});

export type SwapSettingsState = z.infer<typeof SwapSettingsSchema>;

type SwapSettingsAction =
  | { type: "SET_SLIPPAGE_TOLERANCE_PERCENT"; payload: number }
  | { type: "SET_AUTO_SLIPPAGE_TOLERANCE"; payload: boolean }
  | { type: "SET_SETTLEMENT_METHODS"; payload: SettlementMethod[] }
  | { type: "SET_INTEGRATOR_ADDRESS"; payload: string | undefined }
  | { type: "SET_INTEGRATOR_FEE_PIPS"; payload: number | undefined }
  | { type: "SET_FLEXIBLE_INTEGRATOR_FEE"; payload: boolean }
  | { type: "SET_HTLC_MAX_EXECUTIONS"; payload: number }
  | { type: "INITIALIZE_FROM_STORAGE"; payload: SwapSettingsState };

type SwapSettings = SwapSettingsState & {
  setSlippageTolerancePercent: (slippageTolerancePercent: number) => void;
  setAutoSlippageTolerance: (autoSlippageTolerance: boolean) => void;
  setSettlementMethods: (settlementMethods: SettlementMethod[]) => void;
  setIntegratorAddress: (integratorAddress: string | undefined) => void;
  setIntegratorFeePips: (integratorFeePips: number | undefined) => void;
  setHtlcMaxExecutions: (htlcMaxExecutions: number) => void;
  setFlexibleIntegratorFee: (flexibleIntegratorFee: boolean) => void;
};

const swapSettingsReducer = (
  state: SwapSettingsState,
  action: SwapSettingsAction,
): SwapSettingsState => {
  switch (action.type) {
    case "SET_SLIPPAGE_TOLERANCE_PERCENT":
      return { ...state, slippageTolerancePercent: action.payload };
    case "SET_AUTO_SLIPPAGE_TOLERANCE":
      return { ...state, autoSlippageTolerance: action.payload };
    case "SET_SETTLEMENT_METHODS":
      return { ...state, settlementMethods: action.payload };
    case "INITIALIZE_FROM_STORAGE":
      return { ...action.payload };
    case "SET_INTEGRATOR_ADDRESS":
      return { ...state, integratorAddress: action.payload };
    case "SET_INTEGRATOR_FEE_PIPS":
      return { ...state, integratorFeePips: action.payload };
    case "SET_FLEXIBLE_INTEGRATOR_FEE":
      return { ...state, flexibleIntegratorFee: action.payload };
    case "SET_HTLC_MAX_EXECUTIONS":
      return { ...state, htlcMaxExecutions: action.payload };
    default:
      return state;
  }
};

const SwapSettingsContext = createContext<SwapSettings>({} as SwapSettings);

export const SwapSettingsProvider = ({ children }: React.PropsWithChildren) => {
  const isHydratedRef = useRef(false);

  const [state, dispatch] = useReducer(swapSettingsReducer, SwapSettingsSchema.parse({}));

  const setSlippageTolerancePercent = (slippageTolerancePercent: number) => {
    dispatch({
      type: "SET_SLIPPAGE_TOLERANCE_PERCENT",
      payload: slippageTolerancePercent,
    });
  };

  const setAutoSlippageTolerance = (autoSlippageTolerance: boolean) => {
    dispatch({
      type: "SET_AUTO_SLIPPAGE_TOLERANCE",
      payload: autoSlippageTolerance,
    });
  };

  const setSettlementMethods = (settlementMethods: SwapSettingsState["settlementMethods"]) => {
    dispatch({ type: "SET_SETTLEMENT_METHODS", payload: settlementMethods });
  };

  const setIntegratorAddress = (integratorAddress: SwapSettingsState["integratorAddress"]) => {
    dispatch({ type: "SET_INTEGRATOR_ADDRESS", payload: integratorAddress });
  };

  const setIntegratorFeePips = (integratorFeePercent: SwapSettingsState["integratorFeePips"]) => {
    dispatch({
      type: "SET_INTEGRATOR_FEE_PIPS",
      payload: integratorFeePercent,
    });
  };

  const setFlexibleIntegratorFee = (
    flexibleIntegratorFee: SwapSettingsState["flexibleIntegratorFee"],
  ) => {
    dispatch({
      type: "SET_FLEXIBLE_INTEGRATOR_FEE",
      payload: flexibleIntegratorFee,
    });
  };

  const setHtlcMaxExecutions = (htlcMaxExecutions: SwapSettingsState["htlcMaxExecutions"]) => {
    dispatch({
      type: "SET_HTLC_MAX_EXECUTIONS",
      payload: htlcMaxExecutions,
    });
  };

  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (stored) {
      try {
        dispatch({
          type: "INITIALIZE_FROM_STORAGE",
          payload: SwapSettingsSchema.parse(JSON.parse(stored)),
        });
      } catch {
        // ignore corrupt storage
      }
    }

    isHydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!isHydratedRef.current) return;

    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return (
    <SwapSettingsContext.Provider
      value={{
        ...state,
        setSlippageTolerancePercent,
        setAutoSlippageTolerance,
        setSettlementMethods,
        setIntegratorAddress,
        setIntegratorFeePips,
        setFlexibleIntegratorFee,
        setHtlcMaxExecutions,
      }}
    >
      {children}
    </SwapSettingsContext.Provider>
  );
};

export const useSwapSettings = () => {
  const context = useContext(SwapSettingsContext);

  if (!context) {
    throw new Error("useSwapSettings must be used within a SwapSettingsProvider");
  }

  return context;
};
