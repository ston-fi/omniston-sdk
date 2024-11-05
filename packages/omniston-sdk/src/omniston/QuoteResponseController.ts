import {
  filter,
  finalize,
  map,
  merge,
  type Observable,
  Subject,
  tap,
} from "rxjs";

import type { QuoteEvent } from "@/dto/QuoteEvent";
import { Scheduler } from "../helpers/scheduler/Scheduler";
import type { ITimer } from "../helpers/timer/Timer.types";
import type { Quote } from "@/dto/Quote";

export class QuoteResponseController {
  private readonly expireEvents = new Subject<null>();
  private readonly scheduler;
  private lastQuoteId: Quote["quoteId"] | null = null;

  public readonly quote: Observable<Quote | null>;

  constructor(options: { timer: ITimer; quoteEvents: Observable<QuoteEvent> }) {
    this.scheduler = new Scheduler(options.timer);

    const quotesFromServer = options.quoteEvents.pipe(
      filter((event) => !!event.event.quoteUpdated || !!event.event.noQuote),
      map(this.processQuoteEvent),
      tap((quote) => {
        this.lastQuoteId = quote?.quoteId ?? null;
      }),
    );

    this.quote = merge(quotesFromServer, this.expireEvents).pipe(
      finalize(() => this.scheduler.cancelAllTasks()),
    );
  }

  private processQuoteEvent = (event: QuoteEvent) => {
    if (event.event.quoteUpdated) {
      const quote = { ...event.event.quoteUpdated };

      return quote;
    }

    if (event.event.noQuote) {
      return null;
    }

    throw new Error(`Unexpected event type: ${JSON.stringify(event)}`);
  };

  private expireQuote(quoteId: Quote["quoteId"]) {
    if (this.lastQuoteId === quoteId) {
      this.expireEvents.next(null);
    }
  }
}
