import { describe, expect, it } from "bun:test";
import { parseBullets } from "../src/bullet-parser";

describe("parseBullets", () => {
  describe("LinkedIn export format (single-line, newlines → spaces)", () => {
    it("splits text with • bullets", () => {
      const text =
        "Led the engineering team • Ship feature A • Ship feature B • Ship feature C";
      const result = parseBullets(text);
      expect(result.summary).toBe("Led the engineering team");
      expect(result.highlights).toEqual([
        "Ship feature A",
        "Ship feature B",
        "Ship feature C",
      ]);
    });

    it("splits text with • bullets (hyphens not default bullets)", () => {
      const text =
        "Managed a team of 5 • Hired 3 engineers • Improved velocity by 20%";
      const result = parseBullets(text);
      expect(result.summary).toBe("Managed a team of 5");
      expect(result.highlights).toEqual([
        "Hired 3 engineers",
        "Improved velocity by 20%",
      ]);
    });

    it("splits text with ➲ arrow bullets", () => {
      const text = "Key achievements ➲ Revenue grew 30% ➲ Costs reduced 15%";
      const result = parseBullets(text);
      expect(result.summary).toBe("Key achievements");
      expect(result.highlights).toEqual([
        "Revenue grew 30%",
        "Costs reduced 15%",
      ]);
    });

    it("handles * asterisk bullets", () => {
      const text = "Accomplishments * Built feature X * Shipped Y";
      const result = parseBullets(text);
      expect(result.summary).toBe("Accomplishments");
      expect(result.highlights).toEqual(["Built feature X", "Shipped Y"]);
    });
  });

  describe("newline-separated format (standard)", () => {
    it("handles newline-separated bullets", () => {
      const text =
        "Led the engineering team\n• Ship feature A\n• Ship feature B";
      const result = parseBullets(text);
      expect(result.summary).toBe("Led the engineering team");
      expect(result.highlights).toEqual(["Ship feature A", "Ship feature B"]);
    });
  });

  describe("edge cases", () => {
    it("returns empty highlights when no bullets present", () => {
      const text =
        "Just a single line description with no bullet points at all";
      const result = parseBullets(text);
      expect(result.summary).toBe(text);
      expect(result.highlights).toEqual([]);
    });

    it("returns empty result for empty text", () => {
      const result = parseBullets("");
      expect(result.summary).toBe("");
      expect(result.highlights).toEqual([]);
    });

    it("handles mixed bullet styles in one string", () => {
      const text = "Summary line • Point one ‣ Point two";
      const result = parseBullets(text);
      expect(result.summary).toBe("Summary line");
      expect(result.highlights).toEqual(["Point one", "Point two"]);
    });

    it("handles bullet at very start of text", () => {
      const text = "• Point one • Point two";
      const result = parseBullets(text);
      expect(result.summary).toBe("");
      expect(result.highlights).toEqual(["Point one", "Point two"]);
    });

    it("does not treat hyphens in compound words as bullets (summary)", () => {
      // Hyphens are not default bullets, so entire text is summary
      const text = "Role: co-founder of startup - Built product from scratch";
      const result = parseBullets(text);
      expect(result.summary).toBe(text);
      expect(result.highlights).toEqual([]);
    });

    it("does not treat hyphens in compound words as bullets (highlights)", () => {
      // Hyphens are not default bullets, so entire text is summary
      const text =
        "co-founder - Built end-to-end solution - Deployed to production";
      const result = parseBullets(text);
      expect(result.summary).toBe(text);
      expect(result.highlights).toEqual([]);
    });

    it("supports hyphens as bullets when passed via custom bullets option", () => {
      const text =
        "co-founder - Built end-to-end solution - Deployed to production";
      const result = parseBullets(text, { bullets: "•-" });
      expect(result.summary).toBe("co-founder");
      expect(result.highlights).toEqual([
        "Built end-to-end solution",
        "Deployed to production",
      ]);
    });

    it("should handle custom bullets containing hyphen without regex error", () => {
      const result = parseBullets("intro • one - two * three", {
        bullets: "•-*",
      });
      expect(result.summary).toBe("intro");
      expect(result.highlights).toEqual(["one", "two", "three"]);
    });

    it("should handle custom bullets with dash characters without regex error", () => {
      expect(() =>
        parseBullets("intro — one – two ‒ three", { bullets: "—–-‒" }),
      ).not.toThrow();
      const result = parseBullets("intro — one – two ‒ three", {
        bullets: "—–-‒",
      });
      expect(result.summary).toBe("intro");
      expect(result.highlights).toEqual(["one", "two", "three"]);
    });

    it("should handle custom bullets with all regex special chars without regex error", () => {
      expect(() =>
        parseBullets("intro * one + two ? three", {
          bullets: "*+?^${}()|[]\\.-",
        }),
      ).not.toThrow();
      const result = parseBullets("intro * one + two ? three", {
        bullets: "*+?^${}()|[]\\.-",
      });
      expect(result.summary).toBe("intro");
      expect(result.highlights).toEqual(["one", "two", "three"]);
    });
  });
});
