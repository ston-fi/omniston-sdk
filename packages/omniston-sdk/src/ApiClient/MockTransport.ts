import { Subject } from "rxjs";
import type { Transport } from "./Transport";

export class MockTransport implements Transport {
  async ensureConnection(): Promise<void> {}

  messages = new Subject<string>();

  async send(message: string): Promise<void> {}

  close() {}
}
