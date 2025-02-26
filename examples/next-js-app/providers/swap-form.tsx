"use client";

import type { AssetInfo } from "@/constants/assets";
import {
  type Dispatch,
  type ReactNode,
  createContext,
  useContext,
  useReducer,
} from "react";

type SwapState = {
  offerAsset: AssetInfo | null;
  askAsset: AssetInfo | null;
  offerAmount: string;
  askAmount: string;
};

const initialState: SwapState = {
  offerAsset: null,
  askAsset: null,
  offerAmount: "",
  askAmount: "",
};

type IAction =
  | {
      type: "SET_OFFER_ASSET" | "SET_ASK_ASSET";
      payload: AssetInfo | null;
    }
  | {
      type: "SET_OFFER_AMOUNT" | "SET_ASK_AMOUNT";
      payload: string;
    };

const SwapContext = createContext<SwapState>(initialState);
const SwapContextDispatch = createContext<Dispatch<IAction>>(() => {});

const swapReducer = (state: SwapState, action: IAction): SwapState => {
  if (action.type === "SET_OFFER_ASSET") {
    const shouldResetAsk = state.askAsset?.address === action.payload?.address;

    return {
      ...state,
      offerAsset: action.payload,
      askAsset: shouldResetAsk ? null : state.askAsset,
      askAmount: shouldResetAsk ? "" : state.askAmount,
    };
  }

  if (action.type === "SET_ASK_ASSET") {
    return { ...state, askAsset: action.payload };
  }

  if (action.type === "SET_OFFER_AMOUNT") {
    return { ...state, offerAmount: action.payload, askAmount: "" };
  }

  if (action.type === "SET_ASK_AMOUNT") {
    return { ...state, askAmount: action.payload, offerAmount: "" };
  }

  return state;
};

export const SwapFormProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(swapReducer, initialState);

  return (
    <SwapContext.Provider value={state}>
      <SwapContextDispatch.Provider value={dispatch}>
        {children}
      </SwapContextDispatch.Provider>
    </SwapContext.Provider>
  );
};

export const useSwapForm = () => useContext(SwapContext);
export const useSwapFormDispatch = () => useContext(SwapContextDispatch);
