import type { IApiClient } from "../ApiClient/ApiClient.types";
import type { Logger } from "../logger/Logger";

/**
 * Dependencies used to construct an Omniston instance.
 *
 * {@see Omniston}
 */
export interface IOmnistonDependencies {
  /**
   * Optional. Provide this if you want to override the default API client.
   * By default, this will be an {@link ApiClient} using {@link ReconnectingTransport}
   */
  readonly client?: IApiClient;
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
