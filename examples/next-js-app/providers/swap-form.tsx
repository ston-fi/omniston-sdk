"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  useContext,
  useReducer,
} from "react";

type SwapState = {
  bidAddress: string;
  askAddress: string;
  bidAmount: string;
  askAmount: string;
};

const initialState: SwapState = {
  bidAddress: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c", // TON
  askAddress: "EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO", // STON
  bidAmount: "",
  askAmount: "",
};

type IAction =
  | {
      type: "SET_BID_ASSET" | "SET_ASK_ASSET";
      payload: string;
    }
  | {
      type: "SET_BID_AMOUNT" | "SET_ASK_AMOUNT";
      payload: string;
    };

const SwapContext = createContext<SwapState>(initialState);
const SwapContextDispatch = createContext<Dispatch<IAction>>(() => {});

const swapReducer = (state: SwapState, action: IAction): SwapState => {
  if (action.type === "SET_BID_ASSET") {
    const shouldResetAsk = state.askAddress === action.payload;

    return {
      ...state,
      bidAddress: action.payload,
      askAddress: shouldResetAsk ? "" : state.askAddress,
      askAmount: shouldResetAsk ? "" : state.askAmount,
    };
  }

  if (action.type === "SET_ASK_ASSET") {
    return { ...state, askAddress: action.payload };
  }

  if (action.type === "SET_BID_AMOUNT") {
    return { ...state, bidAmount: action.payload, askAmount: "" };
  }

  if (action.type === "SET_ASK_AMOUNT") {
    return { ...state, askAmount: action.payload, bidAmount: "" };
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
