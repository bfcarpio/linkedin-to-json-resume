import { describe, expect, it } from "bun:test";
import { highlightJson } from "../src/json-highlight";

describe("highlightJson", () => {
  it("should highlight a simple JSON object", () => {
    const input = '{"name": "John", "age": 30}';
    const result = highlightJson(input);
    expect(result).toContain('class="token-key"');
    expect(result).toContain('class="token-string"');
    expect(result).toContain('class="token-number"');
  });

  it("should highlight boolean values", () => {
    const input = '{"active": true, "deleted": false}';
    const result = highlightJson(input);
    expect(result).toContain('class="token-boolean"');
  });

  it("should highlight null values", () => {
    const input = '{"value": null}';
    const result = highlightJson(input);
    expect(result).toContain('class="token-null"');
  });

  it("should highlight punctuation", () => {
    const input = '{"a": 1}';
    const result = highlightJson(input);
    expect(result).toContain('class="token-punctuation"');
  });

  it("should escape HTML entities", () => {
    const input = '{"html": "<div>"}';
    const result = highlightJson(input);
    expect(result).toContain("&lt;");
    expect(result).toContain("&gt;");
  });

  it("should produce multiple distinct token types", () => {
    const input = JSON.stringify({
      name: "John",
      age: 30,
      active: true,
      notes: null,
    });
    const result = highlightJson(input);
    const tokenTypes = new Set<string>();
    const matches = result.matchAll(/class="token-(\w+)"/g);
    for (const m of matches) {
      tokenTypes.add(m[1]);
    }
    expect(tokenTypes.size).toBeGreaterThanOrEqual(4);
    expect(tokenTypes).toContain("key");
    expect(tokenTypes).toContain("string");
    expect(tokenTypes).toContain("number");
    expect(tokenTypes).toContain("boolean");
    expect(tokenTypes).toContain("null");
    expect(tokenTypes).toContain("punctuation");
  });

  it("should handle nested objects", () => {
    const input = JSON.stringify({
      address: { city: "NYC", zip: "10001" },
    });
    const result = highlightJson(input);
    const keyCount = (result.match(/class="token-key"/g) || []).length;
    expect(keyCount).toBe(3);
  });

  it("should handle arrays", () => {
    const input = JSON.stringify({ tags: ["a", "b", "c"] });
    const result = highlightJson(input);
    expect(result).toContain('class="token-key"');
    expect(result).toContain('class="token-string"');
    expect(result).toContain('class="token-punctuation"');
  });
});
