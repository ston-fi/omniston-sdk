"use client";

import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SwapSettings } from "@/components/SwapSettings";
import { SwapForm } from "@/components/SwapForm";
import { QuoteAction } from "@/components/QuoteAction";
import { QuotePreview } from "@/components/QuotePreview";
import { QuoteTrack } from "@/components/QuoteTrack";

export default function Home() {
  return (
    <section className="mx-auto w-full max-w-[500px] pt-4 md:pt-12 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h3 className="text-xl font-medium mr-auto">Swap</h3>

        <SwapSettings
          trigger={
            <Button variant="outline" className="p-2">
              <Settings size={24} />
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
