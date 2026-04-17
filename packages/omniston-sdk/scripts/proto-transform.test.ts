import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { buildProtoFileRules, transformGeneratedContent } from "./proto-transform.js";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tempDirs.length = 0;
});

function createProtoFixture() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "proto-transform-"));
  tempDirs.push(tempDir);

  const protoDir = path.join(tempDir, "proto");
  fs.mkdirSync(protoDir, { recursive: true });

  const protoPath = path.join(protoDir, "test.proto");
  fs.writeFileSync(
    protoPath,
    `
syntax = "proto3";
package test.v1;

message Inner {
  string req = 1;
  optional string opt = 2;

  oneof kind {
    string text = 3;
    uint32 code = 4;
  }
}

message Outer {
  Inner child = 1;
  optional Inner maybe_child = 2;

  oneof selection {
    Inner nested = 3;
    string label = 4;
  }
}
`,
    "utf-8",
  );

  return { protoDir, protoPath };
}

describe("proto-transform", () => {
  test("buildProtoFileRules marks only explicit proto3 optional fields as optional", () => {
    const { protoDir, protoPath } = createProtoFixture();

    const rules = buildProtoFileRules({
      protoDir,
      protoFilePath: protoPath,
    });

    expect(rules.get("Inner")?.optionalFields).toEqual(new Set(["opt"]));
    expect(rules.get("Outer")?.optionalFields).toEqual(new Set(["maybeChild"]));
  });

  test("transformGeneratedContent keeps proto3 optional fields and removes undefined from non-optional fields and oneofs", () => {
    const { protoDir, protoPath } = createProtoFixture();
    const rules = buildProtoFileRules({
      protoDir,
      protoFilePath: protoPath,
    });

    const generatedTs = `
export interface Inner {
  req: string | undefined;
  opt?: string | undefined;
  kind?:
    | { $case: "text"; value: string }
    | { $case: "code"; value: number }
    | undefined;
}

export interface Outer {
  child: Inner | undefined;
  maybeChild?: Inner | undefined;
  selection?:
    | { $case: "nested"; value: Inner }
    | { $case: "label"; value: string }
    | undefined;
}
`;

    const transformed = transformGeneratedContent(generatedTs, rules);

    expect(transformed).toContain("req: string;");
    expect(transformed).toContain("opt?: string | undefined;");
    expect(transformed).toMatch(/kind:\s*[\s\S]*\$case:\s*"text"[\s\S]*\$case:\s*"code"/);
    expect(transformed).toMatch(/selection:\s*[\s\S]*\$case:\s*"nested"[\s\S]*\$case:\s*"label"/);
    expect(transformed).toContain("child: Inner;");
    expect(transformed).toContain("maybeChild?: Inner | undefined;");

    expect(transformed).not.toContain("req: string | undefined;");
    expect(transformed).not.toContain("child: Inner | undefined;");
    expect(transformed).not.toContain("kind?:");
    expect(transformed).not.toContain("selection?:");
    expect(transformed).not.toContain("| undefined;\n}");
  });
});
