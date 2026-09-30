"use client";

import { createContext, type Dispatch, useContext, useReducer } from "react";
import { z } from "zod";
import type { AssetId } from "@ston-fi/omniston-sdk-react";

import { Chain } from "~/models/chain";
import { assetIdSchema, isAssetIdEqual } from "~/models/asset-id";
import { useLocalStoragePersistence } from "~/hooks/useLocalStoragePersistence";

const SWAP_FORM_STORAGE_KEY = "@ston-fi/swap-form-state";

const swapFormSchema = z.object({
  inputAssetId: assetIdSchema.nullable().catch({
    chain: {
      $case: Chain.TON,
      value: {
        kind: { $case: "native", value: {} },
      },
    },
  }),
  inputUnits: z.string().catch(""),

  outputAssetId: assetIdSchema.nullable().catch({
    chain: {
      $case: Chain.TON,
      value: {
        kind: {
          $case: "jetton",
          value: "EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO",
        },
      },
    },
  }),
  outputUnits: z.string().catch(""),
});

type SwapState = z.infer<typeof swapFormSchema>;

const initialState: SwapState = swapFormSchema.parse({});

type IAction =
  | {
      type: "SET_INPUT_ASSET_ID" | "SET_OUTPUT_ASSET_ID";
      payload: AssetId | null;
    }
  | {
      type: "SET_INPUT_UNITS" | "SET_OUTPUT_UNITS";
      payload: SwapState["inputUnits"] | SwapState["outputUnits"];
    }
  | {
      type: "INITIALIZE_FROM_STORAGE";
      payload: SwapState;
    };

const SwapContext = createContext<SwapState>(initialState);
const SwapContextDispatch = createContext<Dispatch<IAction>>(() => {});

const swapReducer = (state: SwapState, action: IAction): SwapState => {
  if (action.type === "SET_INPUT_ASSET_ID") {
    const inputAssetId = assetIdSchema.safeParse(action.payload);

    if (!inputAssetId.success) {
      return state;
    }

    const shouldResetOutput = isAssetIdEqual(state.outputAssetId, action.payload);

    return {
      ...state,
      inputAssetId: inputAssetId.data,
      outputAssetId: shouldResetOutput ? null : state.outputAssetId,
      outputUnits: shouldResetOutput ? "" : state.outputUnits,
    };
  }

  if (action.type === "SET_OUTPUT_ASSET_ID") {
    const outputAssetId = assetIdSchema.safeParse(action.payload);

    if (!outputAssetId.success) {
      return state;
    }

    return { ...state, outputAssetId: outputAssetId.data };
  }

  if (action.type === "SET_INPUT_UNITS") {
    return { ...state, inputUnits: action.payload, outputUnits: "" };
  }

  if (action.type === "SET_OUTPUT_UNITS") {
    return { ...state, outputUnits: action.payload, inputUnits: "" };
  }

  if (action.type === "INITIALIZE_FROM_STORAGE") {
    return { ...action.payload };
  }

  return state;
};

export const SwapFormProvider = ({ children }: React.PropsWithChildren) => {
  const [state, dispatch] = useReducer(swapReducer, initialState);

  useLocalStoragePersistence({
    key: SWAP_FORM_STORAGE_KEY,
    schema: swapFormSchema,
    value: state,
    onRestore: (payload) => dispatch({ type: "INITIALIZE_FROM_STORAGE", payload }),
  });

  return (
    <SwapContext.Provider value={state}>
      <SwapContextDispatch.Provider value={dispatch}>{children}</SwapContextDispatch.Provider>
    </SwapContext.Provider>
  );
};

export const useSwapForm = () => useContext(SwapContext);
export const useSwapFormDispatch = () => useContext(SwapContextDispatch);
