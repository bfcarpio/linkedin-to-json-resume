import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseLinkedInDate } from "../src/date-parser";

describe("parseLinkedInDate", () => {
  describe("YYYY-MM format", () => {
    it('parses "2020-03" as "2020-03-01"', () => {
      assert.strictEqual(parseLinkedInDate("2020-03"), "2020-03-01");
    });

    it('parses "2020-3" (single digit month) as "2020-03-01"', () => {
      assert.strictEqual(parseLinkedInDate("2020-3"), "2020-03-01");
    });

    it('parses "2015-11" as "2015-11-01"', () => {
      assert.strictEqual(parseLinkedInDate("2015-11"), "2015-11-01");
    });
  });

  describe("Month YYYY format", () => {
    it('parses "March 2020" as "2020-03-01"', () => {
      assert.strictEqual(parseLinkedInDate("March 2020"), "2020-03-01");
    });

    it('parses "Mar 2020" (abbreviated) as "2020-03-01"', () => {
      assert.strictEqual(parseLinkedInDate("Mar 2020"), "2020-03-01");
    });

    it('parses "January 2018" as "2018-01-01"', () => {
      assert.strictEqual(parseLinkedInDate("January 2018"), "2018-01-01");
    });

    it('parses "Dec 2022" as "2022-12-01"', () => {
      assert.strictEqual(parseLinkedInDate("Dec 2022"), "2022-12-01");
    });

    it('parses "october 2021" (lowercase) as "2021-10-01"', () => {
      assert.strictEqual(parseLinkedInDate("october 2021"), "2021-10-01");
    });
  });

  describe("already ISO formatted", () => {
    it('returns "2020-03-15" as-is', () => {
      assert.strictEqual(parseLinkedInDate("2020-03-15"), "2020-03-15");
    });
  });

  describe("invalid or empty input", () => {
    it("returns undefined for null", () => {
      assert.strictEqual(parseLinkedInDate(null), undefined);
    });

    it("returns undefined for undefined", () => {
      assert.strictEqual(parseLinkedInDate(undefined), undefined);
    });

    it("returns undefined for empty string", () => {
      assert.strictEqual(parseLinkedInDate(""), undefined);
    });

    it("returns undefined for whitespace-only string", () => {
      assert.strictEqual(parseLinkedInDate("   "), undefined);
    });

    it("returns undefined for unrecognized format", () => {
      assert.strictEqual(parseLinkedInDate("not a date"), undefined);
    });
  });
});
