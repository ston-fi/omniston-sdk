"use client";

import { UnplugIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QuoteActionTon } from "@/components/QuoteActionTon";
import { QuoteActionEvm } from "./QuoteActionEvm";
import { Spinner } from "@/components/ui/spinner";
import { useRfq } from "@/hooks/useRfq";
import { useTradeTrackState } from "@/providers/trade-track";
import { useSwapForm } from "@/providers/swap-form";
import { Chain, isEvmChain } from "@/models/chain";
import { useQuoteWallets } from "@/hooks/useTraderQuoteWallets";

export const QuoteAction = (props: { className?: string }) => {
  const swapForm = useSwapForm();

  const { data: quoteEvent } = useRfq();
  const quote = quoteEvent?.$case === "quoteUpdated" ? quoteEvent.value : undefined;

  const { quote: trackingQuote } = useTradeTrackState();

  const { inputWalletAddress, outputWalletAddress } = useQuoteWallets(quote);

  if (trackingQuote) return null;

  // swap form validations
  if (!swapForm.inputAssetId) {
    return <QuoteActionButton disabled>Select send asset</QuoteActionButton>;
  } else if (!swapForm.outputAssetId) {
    return <QuoteActionButton disabled>Select receive asset</QuoteActionButton>;
  } else if (!swapForm.inputUnits && !swapForm.outputUnits) {
    return <QuoteActionButton disabled>Enter an amount</QuoteActionButton>;
  } else if (swapForm.inputUnits === "0" || swapForm.outputUnits === "0") {
    return <QuoteActionButton disabled>Amount must be greater than 0</QuoteActionButton>;
  }
  // different quote events statuses
  else if (quoteEvent?.$case === "unsubscribed") {
    return (
      <QuoteActionButton disabled>
        <UnplugIcon size={16} className="mr-2" />
        <span>Unsubscribed.</span>
      </QuoteActionButton>
    );
  } else if (quoteEvent?.$case === "noQuote") {
    return (
      <QuoteActionButton disabled>
        <Spinner className="mr-2" />
        <span>No quote found yet…</span>
      </QuoteActionButton>
    );
  } else if (!quote) {
    return (
      <QuoteActionButton disabled>
        <Spinner className="mr-2" />
        <span>Waiting for a quote…</span>
      </QuoteActionButton>
    );
  }
  // wallets for known quote validations
  else if (!inputWalletAddress) {
    return <QuoteActionButton disabled>Connect input wallet.</QuoteActionButton>;
  } else if (!outputWalletAddress) {
    return <QuoteActionButton disabled>Connect output wallet.</QuoteActionButton>;
  }
  // action buttons for known quote
  else if (quote.inputAsset.chain.$case === Chain.TON) {
    return <QuoteActionTon {...props} />;
  } else if (isEvmChain(quote.inputAsset.chain.$case)) {
    return <QuoteActionEvm {...props} />;
  }
};

function QuoteActionButton(props: React.ComponentProps<typeof Button>) {
  return (
    <Button {...props} variant="secondary">
      {props.children}
    </Button>
  );
}
