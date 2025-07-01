import { Subject } from "rxjs";

import type { ConnectionStatusEvent } from "./ConnectionStatus";
import type { Transport } from "./Transport";

export class MockTransport implements Transport {
  messages = new Subject<string>();

  connectionStatusEvents = new Subject<ConnectionStatusEvent>();

  async connect(): Promise<void> {}

  async send(_message: string): Promise<void> {}

  close() {}
}
