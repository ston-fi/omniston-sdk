import type { IApiClient } from "../ApiClient/ApiClient.types";
import type { Transport } from "../ApiClient/Transport";
import type { Logger } from "../logger/Logger";

/**
 * Dependencies used to construct an Omniston instance.
 *
 * {@see Omniston}
 */
export interface IOmnistonDependencies {
  /**
   * @deprecated DEPRECATED: use `transport` instead.
   *
   * Optional. Provide this if you want to override the default API client.
   * By default, this will be an {@link ApiClient} using {@link AutoReconnectTransport}
   */
  readonly client?: IApiClient;
  /**
   * Optional. Provide this if you want to override the default network transport.
   * By default, this will be {@link AutoReconnectTransport} with underlying {@link WebSocketTransport}
   */
  readonly transport?: Transport;
  /**
   * Omniston WebSocket API URL.
   *
   * {@example `wss://omni-ws.ston.fi`}
   */
  readonly apiUrl: URL | string;
  /**
   * An optional {@link Logger} implementation. By default, no logs are produced.
   *
   * You can pass `console` here, it is compatible with Logger interface.
   */
  readonly logger?: Logger;
}
