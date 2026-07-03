import { describe, expect, it } from "bun:test";
import { resolveCountry } from "../src/country-codes";

describe("resolveCountry", () => {
  it('resolves "United States" to "US"', () => {
    expect(resolveCountry("United States")).toBe("US");
  });

  it('resolves "United Kingdom" to "GB"', () => {
    expect(resolveCountry("United Kingdom")).toBe("GB");
  });

  it('resolves "Canada" to "CA"', () => {
    expect(resolveCountry("Canada")).toBe("CA");
  });

  it('resolves "Germany" to "DE"', () => {
    expect(resolveCountry("Germany")).toBe("DE");
  });

  it('resolves "India" to "IN"', () => {
    expect(resolveCountry("India")).toBe("IN");
  });

  it('resolves "Australia" to "AU"', () => {
    expect(resolveCountry("Australia")).toBe("AU");
  });

  it("returns undefined for unknown country", () => {
    expect(resolveCountry("Atlantis")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(resolveCountry("")).toBeUndefined();
  });

  it("is case insensitive", () => {
    expect(resolveCountry("united states")).toBe("US");
    expect(resolveCountry("UNITED STATES")).toBe("US");
    expect(resolveCountry("france")).toBe("FR");
  });

  it('resolves "United States of America" to "US" (alias)', () => {
    expect(resolveCountry("United States of America")).toBe("US");
  });

  it("resolves common English country names", () => {
    expect(resolveCountry("France")).toBe("FR");
    expect(resolveCountry("Spain")).toBe("ES");
    expect(resolveCountry("Japan")).toBe("JP");
    expect(resolveCountry("Brazil")).toBe("BR");
    expect(resolveCountry("Netherlands")).toBe("NL");
    expect(resolveCountry("Sweden")).toBe("SE");
    expect(resolveCountry("Switzerland")).toBe("CH");
    expect(resolveCountry("Italy")).toBe("IT");
  });
});
