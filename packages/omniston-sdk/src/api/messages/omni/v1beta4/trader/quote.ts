// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v1.181.0
//   protoc               v5.27.3
// source: omni/v1beta4/trader/quote.proto

/* eslint-disable */
import { KeepAlive } from "../types/common";
import { Quote } from "../types/quote";

export const protobufPackage = "omni.v1beta4";

/** Indicates that the's no valid quote corresponding to RFQ. */
export interface NoQuoteEvent {}

export interface QuoteEvent {
  event: QuoteEvent_EventOneOf | undefined;
}

export interface QuoteEvent_EventOneOf {
  quoteUpdated?: Quote | undefined;
  noQuote?: NoQuoteEvent | undefined;
  keepAlive?: KeepAlive | undefined;
}

function createBaseNoQuoteEvent(): NoQuoteEvent {
  return {};
}

export const NoQuoteEvent = {
  fromJSON(_: any): NoQuoteEvent {
    return {};
  },

  toJSON(_: NoQuoteEvent): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<NoQuoteEvent>, I>>(
    base?: I,
  ): NoQuoteEvent {
    return NoQuoteEvent.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<NoQuoteEvent>, I>>(
    _: I,
  ): NoQuoteEvent {
    const message = createBaseNoQuoteEvent();
    return message;
  },
};

function createBaseQuoteEvent(): QuoteEvent {
  return { event: undefined };
}

export const QuoteEvent = {
  fromJSON(object: any): QuoteEvent {
    return {
      event: isSet(object.event)
        ? QuoteEvent_EventOneOf.fromJSON(object.event)
        : undefined,
    };
  },

  toJSON(message: QuoteEvent): unknown {
    const obj: any = {};
    if (message.event !== undefined) {
      obj.event = QuoteEvent_EventOneOf.toJSON(message.event);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<QuoteEvent>, I>>(base?: I): QuoteEvent {
    return QuoteEvent.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<QuoteEvent>, I>>(
    object: I,
  ): QuoteEvent {
    const message = createBaseQuoteEvent();
    message.event =
      object.event !== undefined && object.event !== null
        ? QuoteEvent_EventOneOf.fromPartial(object.event)
        : undefined;
    return message;
  },
};

function createBaseQuoteEvent_EventOneOf(): QuoteEvent_EventOneOf {
  return { quoteUpdated: undefined, noQuote: undefined, keepAlive: undefined };
}

export const QuoteEvent_EventOneOf = {
  fromJSON(object: any): QuoteEvent_EventOneOf {
    return {
      quoteUpdated: isSet(object.quote_updated)
        ? Quote.fromJSON(object.quote_updated)
        : undefined,
      noQuote: isSet(object.no_quote)
        ? NoQuoteEvent.fromJSON(object.no_quote)
        : undefined,
      keepAlive: isSet(object.keep_alive)
        ? KeepAlive.fromJSON(object.keep_alive)
        : undefined,
    };
  },

  toJSON(message: QuoteEvent_EventOneOf): unknown {
    const obj: any = {};
    if (message.quoteUpdated !== undefined) {
      obj.quote_updated = Quote.toJSON(message.quoteUpdated);
    }
    if (message.noQuote !== undefined) {
      obj.no_quote = NoQuoteEvent.toJSON(message.noQuote);
    }
    if (message.keepAlive !== undefined) {
      obj.keep_alive = KeepAlive.toJSON(message.keepAlive);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<QuoteEvent_EventOneOf>, I>>(
    base?: I,
  ): QuoteEvent_EventOneOf {
    return QuoteEvent_EventOneOf.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<QuoteEvent_EventOneOf>, I>>(
    object: I,
  ): QuoteEvent_EventOneOf {
    const message = createBaseQuoteEvent_EventOneOf();
    message.quoteUpdated =
      object.quoteUpdated !== undefined && object.quoteUpdated !== null
        ? Quote.fromPartial(object.quoteUpdated)
        : undefined;
    message.noQuote =
      object.noQuote !== undefined && object.noQuote !== null
        ? NoQuoteEvent.fromPartial(object.noQuote)
        : undefined;
    message.keepAlive =
      object.keepAlive !== undefined && object.keepAlive !== null
        ? KeepAlive.fromPartial(object.keepAlive)
        : undefined;
    return message;
  },
};

type Builtin =
  | Date
  | Function
  | Uint8Array
  | string
  | number
  | boolean
  | undefined;

export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends globalThis.Array<infer U>
    ? globalThis.Array<DeepPartial<U>>
    : T extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepPartial<U>>
      : T extends {}
        ? { [K in keyof T]?: DeepPartial<T[K]> }
        : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin
  ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & {
      [K in Exclude<keyof I, KeysOfUnion<P>>]: never;
    };

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
