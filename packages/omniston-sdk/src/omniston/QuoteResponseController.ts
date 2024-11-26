import { type Observable, filter, map, tap } from "rxjs";

import type { QuoteEvent } from "../dto/QuoteEvent";
import type { QuoteResponseEvent } from "../dto/QuoteResponseEvent";

export class QuoteResponseController {
  private _isServerUnsubscribed = false;

  public readonly quote: Observable<QuoteResponseEvent>;

  public get isServerUnsubscribed() {
    return this._isServerUnsubscribed;
  }

  constructor(options: { quoteEvents: Observable<QuoteEvent> }) {
    this.quote = options.quoteEvents.pipe(
      filter(
        (event) =>
          !!event.event.quoteUpdated ||
          !!event.event.noQuote ||
          !!event.event.unsubscribed,
      ),
      map(this.processQuoteEvent),
      tap((event) => {
        if (event.type === "unsubscribed") {
          this._isServerUnsubscribed = true;
        }
      }),
    );
  }

  private processQuoteEvent = (event: QuoteEvent): QuoteResponseEvent => {
    if (event.event.quoteUpdated) {
      return {
        type: "quoteUpdated",
        quote: event.event.quoteUpdated,
      };
    }

    if (event.event.noQuote) {
      return { type: "noQuote" };
    }

    if (event.event.unsubscribed) {
      return { type: "unsubscribed" };
    }

    throw new Error(`Unexpected event type: ${JSON.stringify(event)}`);
  };
}
