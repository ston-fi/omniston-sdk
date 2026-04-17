import { expectTypeOf, test } from "vitest";
import type { Logger } from "./Logger";

test("console is compatible with Logger", () => {
  expectTypeOf(console).toExtend<Logger>();
});
