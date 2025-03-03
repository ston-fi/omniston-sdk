import type { Logger } from "@/omniston";
import { test } from "vitest";

test("console is compatible with Logger", () => {
  console satisfies Logger;
});
