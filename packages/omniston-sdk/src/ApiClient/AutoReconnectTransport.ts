import type { Observable } from "rxjs";

import { Timer } from "../helpers/timer/Timer";
import type { ITimer } from "../helpers/timer/Timer.types";
import type { Logger } from "../logger/Logger";

import type {
  ConnectionErrorEvent,
  ConnectionStatusEvent,
} from "./ConnectionStatus";
import type { Transport } from "./Transport";

const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_RECONNECT_DELAY_MS = 1000;

export interface AutoReconnectTransportOptions {
  /**
   * Underlying transport to wrap.
   */
  transport: Transport;
  /**
   * Optional. A custom Timer instance to use for scheduling pauses between connection attempts.
   */
  timer?: ITimer;
  /**
   * Maximum number of reconnection attempts. Equals to {@link DEFAULT_MAX_RETRIES} by default.
   */
  maxRetries?: number;
  /**
   * Delay before first reconnection attempt in milliseconds.
   * Equals to {@link DEFAULT_RECONNECT_DELAY_MS} by default.
   * Every other attempt doubles the delay.
   */
  reconnectDelayMs?: number;
  /**
   * Optional {@link Logger} implementation.
   */
  logger?: Logger;
}

/**
 * Wraps the underlying transport to allow automatic reconnection.
 */
export class AutoReconnectTransport implements Transport {
  private readonly options: AutoReconnectTransportOptions;

  private reconnectingProcess: ReconnectingProcess | null = null;

  constructor(options: AutoReconnectTransportOptions) {
    this.options = options;
    this.options.transport.connectionStatusEvents.subscribe((event) =>
      this.handleStatusEvent(event),
    );
  }

  async connect(): Promise<void> {
    this.reconnectingProcess?.abort();
    this.reconnectingProcess = null;
    try {
      return await this.options.transport.connect();
    } catch {
      // Ignore connection errors. This will be handled by reconnection process
    }
  }

  get connectionStatusEvents(): Observable<ConnectionStatusEvent> {
    return this.options.transport.connectionStatusEvents;
  }

  get messages(): Observable<string> {
    return this.options.transport.messages;
  }

  close() {
    this.reconnectingProcess?.abort();
    this.options.transport.close();
  }

  async send(message: string): Promise<void> {
    await this.waitForReconnection();
    return this.options.transport.send(message);
  }

  private async waitForReconnection() {
    if (this.reconnectingProcess) {
      await this.reconnectingProcess.waitForReconnection();
    }
  }

  private handleStatusEvent(event: ConnectionStatusEvent) {
    if (event.status === "error") {
      if (!this.reconnectingProcess) {
        this.reconnectingProcess = new ReconnectingProcess(this.options);
        this.reconnectingProcess.waitForReconnection().then(
          () => {
            this.reconnectingProcess = null;
          },
          (error) => {
            this.options.logger?.error(`${error}`);
          },
        );
      }
      this.reconnectingProcess.signalError(event);
    }
  }
}

class ReconnectingProcess {
  private readonly transport: Transport;
  private readonly timer: ITimer;
  private readonly logger?: Logger;
  private readonly maxRetries: number;
  private readonly reconnectDelayMs: number;

  private readonly result: Promise<void>;
  private resolve?: () => void;
  private reject?: (error: Error) => void;
  private attempt = 0;
  private isWaiting = false;
  private isDone = false;

  constructor(options: AutoReconnectTransportOptions) {
    this.transport = options.transport;
    this.timer = options.timer ?? new Timer();
    this.logger = options.logger;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.reconnectDelayMs =
      options.reconnectDelayMs ?? DEFAULT_RECONNECT_DELAY_MS;

    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.result = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  signalError(errorEvent: ConnectionErrorEvent) {
    const retriesLeft = this.maxRetries - this.attempt;
    const reconnectAfter = this.getReconnectDelayMs(this.attempt + 1);
    const messageParts: string[] = [];
    messageParts.push(`Connection error: ${errorEvent.errorMessage}.`);
    messageParts.push(`Retries left: ${retriesLeft}.`);
    if (retriesLeft > 0) {
      messageParts.push(`Will reconnect after ${reconnectAfter} ms.`);
    }
    this.logger?.warn(messageParts.join(" "));
    this.tryToReconnect(errorEvent.errorMessage);
  }

  waitForReconnection() {
    return this.result;
  }

  abort() {
    this.isDone = true;
    this.reject?.(new Error("Cancelled by client"));
  }

  private async tryToReconnect(lastError: string) {
    if (this.isWaiting || this.isDone) {
      return;
    }
    this.attempt += 1;
    if (this.attempt > this.maxRetries) {
      this.isDone = true;
      this.reject?.(
        new Error(
          `Unable to reconnect after ${this.maxRetries} attempts. Last error: ${lastError}`,
        ),
      );
      return;
    }
    await this.waitBeforeReconnecting();
    // Check to see if the process is aborted
    if (this.isDone) {
      return;
    }
    try {
      await this.transport.connect();
      this.isDone = true;
      this.resolve?.();
    } catch {
      // Ignore connection errors.
    }
  }

  private getReconnectDelayMs(attempt: number) {
    return this.reconnectDelayMs * 2 ** (attempt - 1);
  }

  private async waitBeforeReconnecting() {
    this.isWaiting = true;
    // Exponential retry.
    const delay = this.getReconnectDelayMs(this.attempt);
    await new Promise<void>((resolve) => {
      this.timer.setTimeout(resolve, delay);
    });
    this.isWaiting = false;
  }
}
