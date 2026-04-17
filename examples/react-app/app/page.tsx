"use client";

import { Settings } from "lucide-react";

import { ActiveOrderList } from "@/components/ActiveOrderList";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { QuoteAction } from "@/components/QuoteAction";
import { QuotePreview } from "@/components/QuotePreview";
import { QuoteTrackTrade } from "@/components/QuoteTrackTrade";
import { SwapForm } from "@/components/SwapForm";
import { SwapSettings } from "@/components/SwapSettings";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-[500px] flex-col gap-4 pt-4 md:pt-12">
      <div className="flex items-center gap-2">
        <h1 className="mr-auto text-xl leading-8 font-medium">Swap</h1>

        <ConnectionStatus />

        <SwapSettings
          trigger={
            <Button variant="outline" className="data-[state=open]:border-foreground/50 size-8 p-0">
              <Settings size={16} />
            </Button>
          }
        />
      </div>

      <SwapForm />
      <QuotePreview className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200" />
      <QuoteAction className="w-full" />
      <QuoteTrackTrade className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200" />
      <ActiveOrderList className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200" />
    </section>
  );
}
