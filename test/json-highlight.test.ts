import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { highlightJson } from "../src/json-highlight";

describe("highlightJson", () => {
  it("should highlight a simple JSON object", () => {
    const input = '{"name": "John", "age": 30}';
    const result = highlightJson(input);
    assert.ok(result.includes('class="token-key"'));
    assert.ok(result.includes('class="token-string"'));
    assert.ok(result.includes('class="token-number"'));
  });

  it("should highlight boolean values", () => {
    const input = '{"active": true, "deleted": false}';
    const result = highlightJson(input);
    assert.ok(result.includes('class="token-boolean"'));
  });

  it("should highlight null values", () => {
    const input = '{"value": null}';
    const result = highlightJson(input);
    assert.ok(result.includes('class="token-null"'));
  });

  it("should highlight punctuation", () => {
    const input = '{"a": 1}';
    const result = highlightJson(input);
    assert.ok(result.includes('class="token-punctuation"'));
  });

  it("should escape HTML entities", () => {
    const input = '{"html": "<div>"}';
    const result = highlightJson(input);
    assert.ok(result.includes("&lt;"));
    assert.ok(result.includes("&gt;"));
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
    assert.ok(tokenTypes.size >= 4);
    assert.ok(tokenTypes.has("key"));
    assert.ok(tokenTypes.has("string"));
    assert.ok(tokenTypes.has("number"));
    assert.ok(tokenTypes.has("boolean"));
    assert.ok(tokenTypes.has("null"));
    assert.ok(tokenTypes.has("punctuation"));
  });

  it("should handle nested objects", () => {
    const input = JSON.stringify({
      address: { city: "NYC", zip: "10001" },
    });
    const result = highlightJson(input);
    const keyCount = (result.match(/class="token-key"/g) || []).length;
    assert.strictEqual(keyCount, 3);
  });

  it("should handle arrays", () => {
    const input = JSON.stringify({ tags: ["a", "b", "c"] });
    const result = highlightJson(input);
    assert.ok(result.includes('class="token-key"'));
    assert.ok(result.includes('class="token-string"'));
    assert.ok(result.includes('class="token-punctuation"'));
  });
});
