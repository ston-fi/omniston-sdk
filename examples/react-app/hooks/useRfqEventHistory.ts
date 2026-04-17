"use client";

import { useEffect, useRef, useState } from "react";

import { useRfq } from "@/hooks/useRfq";

type RfqEvent = NonNullable<ReturnType<typeof useRfq>["data"]>;

function getRfqId(event: RfqEvent | null | undefined): string | undefined {
  if (event?.$case === "quoteUpdated") {
    return event.value.rfqId;
  }
  return undefined;
}

export function useRfqEventHistory(): RfqEvent[] {
  const { data: quoteEvent } = useRfq();
  const [events, setEvents] = useState<RfqEvent[]>([]);
  const currentRfqIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!quoteEvent) {
      setEvents([]);
      currentRfqIdRef.current = undefined;
      return;
    }

    const eventRfqId = getRfqId(quoteEvent);
    const prevRfqId = currentRfqIdRef.current;

    if (eventRfqId) {
      currentRfqIdRef.current = eventRfqId;
    }

    setEvents((prev) => {
      const last = prev[prev.length - 1];

      if (last && JSON.stringify(last) === JSON.stringify(quoteEvent)) {
        return prev;
      }

      if (eventRfqId && prevRfqId && eventRfqId !== prevRfqId) {
        return [quoteEvent];
      }

      return [...prev, quoteEvent];
    });
  }, [quoteEvent]);

  return events;
}
