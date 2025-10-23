import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts"],
  platform: "browser",
  format: ["cjs", "esm"],
  dts: true,
  exports: true,
});
