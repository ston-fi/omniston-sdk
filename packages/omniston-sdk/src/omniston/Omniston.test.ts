import { from, Subject } from "rxjs";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { Quote } from "@/dto/Quote";
import { QuoteRequest } from "@/dto/QuoteRequest";
import { TrackTradeRequest } from "@/dto/TrackTradeRequest";
import { TradeStatus } from "@/dto/TradeStatus";
import { TransactionRequest } from "@/dto/TransactionRequest";
import { TransactionResponse } from "@/dto/TransactionResponse";
import { QuoteEvent } from "@/dto/QuoteEvent";
import { FakeApiClient } from "../ApiClient/FakeApiClient";
import { FakeTimer } from "../helpers/timer/FakeTimer";
import {
  newEscrowQuoteEvent,
  newQuoteEvent,
  noQuoteEvent,
  quoteRequestEscrow,
  quoteRequestSwap,
  testEscrowQuote,
  testAssetListResponse,
  testQuote,
  testTrackTradeRequest,
  testTransactionRequest,
  testTransactionResponse,
  testTransactionResponseBase64,
  tradeStatusAwaitingTransfer,
} from "../testing/testingValues";
import { Omniston } from "./Omniston";
import { AssetsResponse } from "@/dto/Assets";
import {
  METHOD_ASSET_QUERY,
  METHOD_BUILD_TRANSFER,
  METHOD_QUOTE,
  METHOD_QUOTE_EVENT,
  METHOD_QUOTE_UNSUBSCRIBE,
  METHOD_TRACK_TRADE,
  METHOD_TRACK_TRADE_EVENT,
  METHOD_TRACK_TRADE_UNSUBSCRIBE,
} from "@/omniston/rpcConstants";

describe("Omniston tests", () => {
  const testSubscriptionId = 1;

  let omniston: Omniston;
  let fakeApiClient: FakeApiClient;
  let fakeTimer: FakeTimer;

  beforeEach(() => {
    fakeApiClient = new FakeApiClient();
    fakeTimer = new FakeTimer();
    omniston = new Omniston({
      apiUrl: "wss://example.com",
      client: fakeApiClient,
    });
    // @ts-expect-error: override private field with test value
    omniston.timer = fakeTimer;
  });

  function flushEventLoop() {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  describe("quote request", () => {
    test("can get a quote", async () => {
      // Setting up mocks.
      const quoteEventSubject = new Subject<unknown>();
      const sendSpy = vi
        .spyOn(fakeApiClient, "send")
        .mockResolvedValue(testSubscriptionId);
      const readStreamSpy = vi
        .spyOn(fakeApiClient, "readStream")
        .mockReturnValue(quoteEventSubject.asObservable());

      // Sending a quote request.
      let lastQuote: Quote | null = null;
      omniston.requestForQuote(quoteRequestSwap).subscribe((quote) => {
        lastQuote = quote;
      });
      await flushEventLoop();
      expect(sendSpy).lastCalledWith(
        METHOD_QUOTE,
        QuoteRequest.toJSON(quoteRequestSwap),
      );
      expect(readStreamSpy).lastCalledWith(
        METHOD_QUOTE_EVENT,
        testSubscriptionId,
      );
      expect(lastQuote).toBeNull();

      // Receiving a quote.
      quoteEventSubject.next(QuoteEvent.toJSON(newQuoteEvent));
      expect(lastQuote).toEqual(testQuote);
    });

    test("clears a quote when server sends NoQuote", async () => {
      // Setting up mocks.
      const quoteEventSubject = new Subject<unknown>();
      vi.spyOn(fakeApiClient, "send").mockResolvedValue(testSubscriptionId);
      vi.spyOn(fakeApiClient, "readStream").mockReturnValue(
        quoteEventSubject.asObservable(),
      );

      // Receiving a quote.
      let lastQuote: Quote | null = null;
      omniston.requestForQuote(quoteRequestSwap).subscribe((quote) => {
        lastQuote = quote;
      });
      await flushEventLoop();
      quoteEventSubject.next(QuoteEvent.toJSON(newQuoteEvent));
      expect(lastQuote).toEqual(testQuote);

      // Sending a "no quote" event.
      quoteEventSubject.next(QuoteEvent.toJSON(noQuoteEvent));
      expect(lastQuote).toBeNull();
    });

    test("unsubscribe_quote is sent when user unsubscribes from the observable", async () => {
      // Setting up mocks.
      const sendSpy = vi
        .spyOn(fakeApiClient, "send")
        .mockResolvedValue(testSubscriptionId);

      // Sending a request for quotes.
      const quoteSubscription = omniston
        .requestForQuote(quoteRequestSwap)
        .subscribe();
      await flushEventLoop();

      // Unsubscribe from the observable.
      sendSpy.mockResolvedValue(true);
      quoteSubscription.unsubscribe();
      await flushEventLoop();
      expect(sendSpy).lastCalledWith(METHOD_QUOTE_UNSUBSCRIBE, [
        testSubscriptionId,
      ]);
    });

    test("unsubscribe_quote is sent when user unsubscribes before the request completes", async () => {
      let resolve: (x: number) => void = () => {};
      const sendResult = new Promise((_resolve) => {
        resolve = _resolve;
      });
      const sendSpy = vi
        .spyOn(fakeApiClient, "send")
        .mockReturnValue(sendResult);
      const quoteSubscription = omniston
        .requestForQuote(quoteRequestSwap)
        .subscribe();
      await flushEventLoop();
      sendSpy.mockResolvedValue(true);
      quoteSubscription.unsubscribe();
      await flushEventLoop();
      expect(sendSpy).lastCalledWith(METHOD_QUOTE, expect.anything());
      resolve(testSubscriptionId);
      await flushEventLoop();
      expect(sendSpy).lastCalledWith(METHOD_QUOTE_UNSUBSCRIBE, [
        testSubscriptionId,
      ]);
    });
  });

  test("can build a transaction", async () => {
    const sendSpy = vi
      .spyOn(fakeApiClient, "send")
      .mockResolvedValue(TransactionResponse.toJSON(testTransactionResponse));
    const result = await omniston.buildTransfer(testTransactionRequest);
    expect(sendSpy).lastCalledWith(
      METHOD_BUILD_TRANSFER,
      TransactionRequest.toJSON(testTransactionRequest),
    );
    // Omniston translates payload from hex-encoded to base64-encoded.
    expect(result).toEqual(testTransactionResponseBase64);
  });

  describe("track trade", () => {
    test("can get a TradeStatus", async () => {
      // Setting up mocks.
      const tradeStatusSubject = new Subject<unknown>();
      const sendSpy = vi
        .spyOn(fakeApiClient, "send")
        .mockResolvedValue(testSubscriptionId);
      const readStreamSpy = vi
        .spyOn(fakeApiClient, "readStream")
        .mockReturnValue(tradeStatusSubject.asObservable());

      // Sending a track trade request.
      let tradeStatus: TradeStatus | null = null;
      omniston.trackTrade(testTrackTradeRequest).subscribe((_tradeStatus) => {
        tradeStatus = _tradeStatus;
      });
      await flushEventLoop();
      expect(sendSpy).lastCalledWith(
        METHOD_TRACK_TRADE,
        TrackTradeRequest.toJSON(testTrackTradeRequest),
      );
      expect(readStreamSpy).lastCalledWith(
        METHOD_TRACK_TRADE_EVENT,
        testSubscriptionId,
      );
      expect(tradeStatus).toBeNull();

      // Receiving an update.
      tradeStatusSubject.next(TradeStatus.toJSON(tradeStatusAwaitingTransfer));
      expect(tradeStatus).toEqual(tradeStatusAwaitingTransfer);
    });

    test("unsubscribe_track_trade is sent when user unsubscribes from the observable", async () => {
      // Setting up mocks.
      const sendSpy = vi
        .spyOn(fakeApiClient, "send")
        .mockResolvedValue(testSubscriptionId);

      // Send the request and subscribe.
      const statusSubscription = omniston
        .trackTrade(testTrackTradeRequest)
        .subscribe();
      await flushEventLoop();

      // Unsubscribe from the observable.
      sendSpy.mockResolvedValue(true);
      statusSubscription.unsubscribe();
      await flushEventLoop();
      expect(sendSpy).lastCalledWith(METHOD_TRACK_TRADE_UNSUBSCRIBE, [
        testSubscriptionId,
      ]);
    });
  });

  test("closes the ApiClient", () => {
    const closeSpy = vi.spyOn(fakeApiClient, "close");

    omniston.close();

    expect(closeSpy).toHaveBeenCalledOnce();
  });

  test("gets a list of assets", async () => {
    const sendSpy = vi
      .spyOn(fakeApiClient, "send")
      .mockResolvedValue(AssetsResponse.toJSON(testAssetListResponse));

    const result = await omniston.assetList();

    expect(sendSpy).lastCalledWith(METHOD_ASSET_QUERY, {});
    expect(result).toEqual(testAssetListResponse);
  });
});
