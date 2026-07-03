import { describe, expect, it } from "bun:test";
import { parseLinkedInDate } from "../src/date-parser";

describe("parseLinkedInDate", () => {
  describe("YYYY-MM format", () => {
    it('parses "2020-03" as "2020-03-01"', () => {
      expect(parseLinkedInDate("2020-03")).toBe("2020-03-01");
    });

    it('parses "2020-3" (single digit month) as "2020-03-01"', () => {
      expect(parseLinkedInDate("2020-3")).toBe("2020-03-01");
    });

    it('parses "2015-11" as "2015-11-01"', () => {
      expect(parseLinkedInDate("2015-11")).toBe("2015-11-01");
    });
  });

  describe("Month YYYY format", () => {
    it('parses "March 2020" as "2020-03-01"', () => {
      expect(parseLinkedInDate("March 2020")).toBe("2020-03-01");
    });

    it('parses "Mar 2020" (abbreviated) as "2020-03-01"', () => {
      expect(parseLinkedInDate("Mar 2020")).toBe("2020-03-01");
    });

    it('parses "January 2018" as "2018-01-01"', () => {
      expect(parseLinkedInDate("January 2018")).toBe("2018-01-01");
    });

    it('parses "Dec 2022" as "2022-12-01"', () => {
      expect(parseLinkedInDate("Dec 2022")).toBe("2022-12-01");
    });

    it('parses "october 2021" (lowercase) as "2021-10-01"', () => {
      expect(parseLinkedInDate("october 2021")).toBe("2021-10-01");
    });
  });

  describe("already ISO formatted", () => {
    it('returns "2020-03-15" as-is', () => {
      expect(parseLinkedInDate("2020-03-15")).toBe("2020-03-15");
    });
  });

  describe("invalid or empty input", () => {
    it("returns undefined for null", () => {
      expect(parseLinkedInDate(null)).toBeUndefined();
    });

    it("returns undefined for undefined", () => {
      expect(parseLinkedInDate(undefined)).toBeUndefined();
    });

    it("returns undefined for empty string", () => {
      expect(parseLinkedInDate("")).toBeUndefined();
    });

    it("returns undefined for whitespace-only string", () => {
      expect(parseLinkedInDate("   ")).toBeUndefined();
    });

    it("returns undefined for unrecognized format", () => {
      expect(parseLinkedInDate("not a date")).toBeUndefined();
    });
  });
});
