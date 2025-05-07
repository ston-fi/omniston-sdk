import { test } from "vitest";

import type { Logger } from "../omniston";

test("console is compatible with Logger", () => {
  console satisfies Logger;
});
