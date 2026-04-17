import { BehaviorSubject, Observable } from "rxjs";

import type { IApiClient } from "./ApiClient.types";
import { ApiStreamController } from "./ApiStreamController";
import type { ConnectionStatusEvent } from "./ConnectionStatus";

export class FakeApiClient implements IApiClient {
  public readonly connectionStatusEvents = new BehaviorSubject<ConnectionStatusEvent>({
    status: "connected",
  });

  public get connectionStatus() {
    return this.connectionStatusEvents.value.status;
  }

  async send(_method: string, _payload: unknown): Promise<unknown> {
    return {};
  }

  readStream(_method: string, _subscriptionId: number): Observable<unknown> {
    return new Observable();
  }

  subscribeToStream(method: string, eventMethod: string, payload: unknown): ApiStreamController {
    return new ApiStreamController({
      apiClient: {
        send: (method, payload) => this.send(method, payload),
        readStream: (method, subscriptionId) => this.readStream(method, subscriptionId),
      },
      connectionStatusEvents: this.connectionStatusEvents,
      method,
      eventMethod,
      payload,
    });
  }
}
