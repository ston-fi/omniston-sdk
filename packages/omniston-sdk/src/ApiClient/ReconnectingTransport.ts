import { Subject } from "rxjs";

import { Timer } from "../helpers/timer/Timer";
import type { ITimer } from "../helpers/timer/Timer.types";
import type { Transport } from "./Transport";

const DEFAULT_MAX_RETRIES = 10;
const DEFAULT_RECONNECT_DELAY_MS = 1000;

/**
 * Wraps the underlying transport to allow automatic reconnection.
 */
export class ReconnectingTransport implements Transport {
  private readonly factory: () => Transport;
  private readonly timer: ITimer;
  private readonly maxRetries: number;
  private readonly reconnectDelayMs: number;
  private activeTransport: Transport | null = null;
  private failedToReconnect = false;
  private isClosed = false;
  private reconnecting: Promise<void> | null = null;

  public messages = new Subject<string>();

  constructor(options: {
    /**
     * A factory to create a new instance of the underlying transport.
     * @returns new transport in a default state
     */
    factory: () => Transport;
    /**
     * Optional. A custom Timer instance to use for scheduling pauses between connection attempts.
     */
    timer?: ITimer;
    /**
     * Maximum number of reconnection attempts. Equals to {@link DEFAULT_MAX_RETRIES} by default.
     */
    maxRetries?: number;
    /**
     * Duration of a pause between connection attempts in milliseconds. Equals to {@link DEFAULT_RECONNECT_DELAY_MS} by default.
     */
    reconnectDelayMs?: number;
  }) {
    this.factory = options.factory;
    this.timer = options.timer ?? new Timer();
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.reconnectDelayMs =
      options.reconnectDelayMs ?? DEFAULT_RECONNECT_DELAY_MS;
  }

  /**
   * Ensures that the transport is connected. If the connection fails, it tries to reconnect by creating a new transport instance.
   * If it fails to reconnect by exceeding the maximum number of retries in one go, this method will always throw.
   */
  async ensureConnection(): Promise<void> {
    if (this.reconnecting) {
      return this.reconnecting;
    }
    this.reconnecting = this._ensureConnection();
    try {
      await this.reconnecting;
    } finally {
      this.reconnecting = null;
    }
  }

  private async _ensureConnection(): Promise<void> {
    if (this.failedToReconnect) {
      throw new Error("Failed to reconnect");
    }
    if (!this.activeTransport) {
      this.createNewTransport();
    }

    let lastError: unknown;
    for (let attempt = 0; attempt < this.maxRetries + 1; ++attempt) {
      if (attempt > 0) {
        await this.delay();
        this.createNewTransport();
      }
      if (this.activeTransport == null) {
        throw new Error(`Transport factory returned ${this.activeTransport}`);
      }
      try {
        await this.activeTransport.ensureConnection();
        return;
      } catch (err) {
        lastError = err;
        const retriesLeft = this.maxRetries - attempt;
        if (retriesLeft > 0) {
          console.log(
            `Failed to connect. Retries left: ${retriesLeft}, will retry after ${this.reconnectDelayMs} ms...`,
            err,
          );
        }
      }
    }

    this.failedToReconnect = true;
    throw new Error("Failed to reconnect", { cause: lastError });
  }

  private createNewTransport() {
    if (this.isClosed) {
      throw new Error("Connection is closed");
    }
    this.activeTransport = this.factory();
    this.activeTransport.messages.subscribe((message) => {
      this.messages.next(message);
    });
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => {
      this.timer.setTimeout(resolve, this.reconnectDelayMs);
    });
  }

  send(message: string): Promise<void> {
    return (
      this.activeTransport?.send(message) ??
      Promise.reject(
        "Underlying transport is not initialized, did you forget to call ensureConnection()?",
      )
    );
  }

  close() {
    this.activeTransport?.close();
    this.activeTransport = null;
    this.isClosed = true;
  }
}
