import { Observable } from "rxjs";

import type { IApiClient } from "./ApiClient.types";

export class FakeApiClient implements IApiClient {
  async ensureConnection(): Promise<void> {}

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
