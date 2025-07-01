import { Observable, Subject } from "rxjs";

import type { IApiClient } from "./ApiClient.types";
import type {
  ConnectionStatus,
  ConnectionStatusEvent,
} from "./ConnectionStatus";

export class FakeApiClient implements IApiClient {
  public connectionStatus: ConnectionStatus = "ready";
  public readonly connectionStatusEvents = new Subject<ConnectionStatusEvent>();

  async send(method: string, payload: unknown): Promise<unknown> {
    return {};
  }

  readStream(method: string, subscriptionId: number): Observable<unknown> {
    return new Observable();
  }

  async unsubscribeFromStream(
    method: string,
    subscriptionId: number,
  ): Promise<unknown> {
    return await this.send(method, [subscriptionId]);
  }

  close() {}
}
