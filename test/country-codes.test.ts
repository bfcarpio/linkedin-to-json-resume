import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveCountry } from "../src/country-codes";

describe("resolveCountry", () => {
  it('resolves "United States" to "US"', () => {
    assert.strictEqual(resolveCountry("United States"), "US");
  });

  it('resolves "United Kingdom" to "GB"', () => {
    assert.strictEqual(resolveCountry("United Kingdom"), "GB");
  });

  it('resolves "Canada" to "CA"', () => {
    assert.strictEqual(resolveCountry("Canada"), "CA");
  });

  it('resolves "Germany" to "DE"', () => {
    assert.strictEqual(resolveCountry("Germany"), "DE");
  });

  it('resolves "India" to "IN"', () => {
    assert.strictEqual(resolveCountry("India"), "IN");
  });

  it('resolves "Australia" to "AU"', () => {
    assert.strictEqual(resolveCountry("Australia"), "AU");
  });

  it("returns undefined for unknown country", () => {
    assert.strictEqual(resolveCountry("Atlantis"), undefined);
  });

  it("returns undefined for empty string", () => {
    assert.strictEqual(resolveCountry(""), undefined);
  });

  it("is case insensitive", () => {
    assert.strictEqual(resolveCountry("united states"), "US");
    assert.strictEqual(resolveCountry("UNITED STATES"), "US");
    assert.strictEqual(resolveCountry("france"), "FR");
  });

  it('resolves "United States of America" to "US" (alias)', () => {
    assert.strictEqual(resolveCountry("United States of America"), "US");
  });

  it("resolves common English country names", () => {
    assert.strictEqual(resolveCountry("France"), "FR");
    assert.strictEqual(resolveCountry("Spain"), "ES");
    assert.strictEqual(resolveCountry("Japan"), "JP");
    assert.strictEqual(resolveCountry("Brazil"), "BR");
    assert.strictEqual(resolveCountry("Netherlands"), "NL");
    assert.strictEqual(resolveCountry("Sweden"), "SE");
    assert.strictEqual(resolveCountry("Switzerland"), "CH");
    assert.strictEqual(resolveCountry("Italy"), "IT");
  });
});
