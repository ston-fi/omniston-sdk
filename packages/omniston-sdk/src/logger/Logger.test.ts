import { test } from "vitest";

import type { Logger } from "./Logger";

test("console is compatible with Logger", () => {
  console satisfies Logger;
});
