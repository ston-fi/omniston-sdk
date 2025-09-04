import { filter, map, type Observable, tap } from "rxjs";
import { ErrorCode } from "../constants";
import type { QuoteEvent } from "../dto/QuoteEvent";
import type { QuoteResponseEvent } from "../dto/QuoteResponseEvent";
import { OmnistonError } from "./OmnistonError";

export class QuoteResponseController {
  private _isServerUnsubscribed = false;
  private rfqId: string | null = null;

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
          !!event.event.unsubscribed ||
          !!event.event.ack,
      ),
      map(this.processQuoteEvent),
      tap((event) => {
        if (event.type === "unsubscribed") {
          this._isServerUnsubscribed = true;
        }
      }),
    );
  }

  private getRfqIdOrThrow(eventType: string) {
    if (!this.rfqId) {
      throw new OmnistonError(
        ErrorCode.UNKNOWN,
        `Received "${eventType}" event without ack event`,
      );
    }
    return this.rfqId;
  }

  private processQuoteEvent = (event: QuoteEvent): QuoteResponseEvent => {
    if (event.event.quoteUpdated) {
      return {
        type: "quoteUpdated",
        quote: event.event.quoteUpdated,
        rfqId: this.getRfqIdOrThrow("quoteUpdated"),
      };
    }

    if (event.event.noQuote) {
      return { type: "noQuote", rfqId: this.getRfqIdOrThrow("noQuote") };
    }

    if (event.event.unsubscribed) {
      return {
        type: "unsubscribed",
        rfqId: this.getRfqIdOrThrow("unsubscribed"),
      };
    }

    if (event.event.ack) {
      this.rfqId = event.event.ack.rfqId;
      return { type: "ack", rfqId: event.event.ack.rfqId };
    }

    throw new Error(`Unexpected event type: ${JSON.stringify(event)}`);
  };
}
