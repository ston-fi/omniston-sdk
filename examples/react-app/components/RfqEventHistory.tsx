"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { useRfqEventHistory } from "@/hooks/useRfqEventHistory";
import { cn } from "@/lib/utils";
import { CopyJsonCard } from "./ui/copy-json-card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function RfqEventHistory({ className, ...props }: { className?: string }) {
  const events = useRfqEventHistory();
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (events.length === 0) return;

    setIsPulsing(true);

    const timeout = setTimeout(() => setIsPulsing(false), 500);

    return () => clearTimeout(timeout);
  }, [events.length]);

  if (events.length === 0) {
    return null;
  }

  return (
    <Collapsible {...props} className={cn("group", className)}>
      <CollapsibleTrigger className="inline-flex w-full items-center justify-between gap-1">
        <span className="inline-flex items-center gap-1">
          <span>RFQ event history</span>
          <pre
            className={cn(isPulsing ? "animate-pulse" : "")}
            style={{
              transform: isPulsing ? "scale(1.1)" : "scale(1)",
              transition: "transform 120ms ease-out",
            }}
          >
            ({events.length})
          </pre>
        </span>
        <ChevronDown
          size={16}
          className="transition-transform group-data-[state=open]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="mt-2 space-y-3">
          {events.map((event, index) => (
            <li key={index}>
              <CopyJsonCard title={`Event #${index + 1}`} value={event}>
                <pre className="overflow-auto text-xs">{JSON.stringify(event)}</pre>
              </CopyJsonCard>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
