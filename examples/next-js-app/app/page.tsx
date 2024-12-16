"use client";

import { Settings } from "lucide-react";

import { QuoteAction } from "@/components/QuoteAction";
import { QuotePreview } from "@/components/QuotePreview";
import { QuoteTrack } from "@/components/QuoteTrack";
import { SwapForm } from "@/components/SwapForm";
import { SwapSettings } from "@/components/SwapSettings";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <section className="mx-auto w-full max-w-[500px] pt-4 md:pt-12 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl leading-8 font-medium mr-auto">Swap</h1>

        <SwapSettings
          trigger={
            <Button variant="outline" className="size-8 p-0">
              <Settings size={16} />
            </Button>
          }
        />
      </div>

      <SwapForm />
      <QuotePreview />
      <QuoteAction className="w-full" />
      <QuoteTrack />
    </section>
  );
}
