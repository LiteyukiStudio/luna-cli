import { describe, expect, it } from "vitest";
import {
  redactSensitiveText,
  redactValue,
  sanitizeTerminalText,
} from "../../src/errors/index.js";
import { stringifyJson } from "../../src/output/index.js";

describe("output safety", () => {
  it("removes terminal control sequences and bidi controls", () => {
    const hostile = "\u001B]8;;https://evil.example\u0007click\u001B]8;;\u0007\u202Etxt";
    expect(sanitizeTerminalText(hostile)).toBe("clicktxt");
  });

  it("redacts credentials in objects and diagnostic text", () => {
    expect(redactValue({
      authorization: "Bearer secret",
      nested: { password: "secret" },
    })).toEqual({
      authorization: "[REDACTED]",
      nested: { password: "[REDACTED]" },
    });
    expect(redactSensitiveText("Authorization: Bearer abc.def")).not.toContain("abc.def");
  });

  it("removes raw trace payloads and captured GenAI content", () => {
    const safe = redactValue({
      raw: { attributes: [{ key: "gen_ai.system_instructions", value: "system secret" }] },
      attributes: {
        "gen_ai.system_instructions": "system secret",
        "gen_ai.tool.call.arguments": "sensitive arguments",
        "luna.turn.id": "turn_1",
      },
      arguments: { projectId: "prj_1" },
      result: { status: "succeeded" },
    })
    expect(safe).toEqual({
      raw: "[REDACTED]",
      attributes: {
        "gen_ai.system_instructions": "[REDACTED]",
        "gen_ai.tool.call.arguments": "[REDACTED]",
        "luna.turn.id": "turn_1",
      },
      arguments: { projectId: "prj_1" },
      result: { status: "succeeded" },
    })
  });

  it("preserves capability flags and scope names while redacting token values", () => {
    expect(redactValue({
      features: {
        accessToken: true,
        oauthAuthorization: true,
      },
      scopes: ["access_token:read", "token:read"],
      accessToken: "secret",
    })).toEqual({
      features: {
        accessToken: true,
        oauthAuthorization: true,
      },
      scopes: ["access_token:read", "token:read"],
      accessToken: "[REDACTED]",
    });
  });

  it("only treats objects on the current recursion path as circular", () => {
    const shared = { enabled: true };
    expect(redactValue({ first: shared, second: shared })).toEqual({
      first: { enabled: true },
      second: { enabled: true },
    });
    const circular: { self?: unknown } = {};
    circular.self = circular;
    expect(redactValue(circular)).toEqual({ self: "[CIRCULAR]" });
  });

  it("keeps JSON parseable while escaping unsafe terminal characters", () => {
    const output = stringifyJson({ message: "safe\u202Etext", token: "secret" });
    expect(output).toContain("\\u202e");
    expect(JSON.parse(output)).toEqual({
      message: "safe\u202Etext",
      token: "[REDACTED]",
    });
  });
});
