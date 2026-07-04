import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseBullets } from "../src/bullet-parser";

describe("parseBullets", () => {
  describe("LinkedIn export format (single-line, newlines → spaces)", () => {
    it("splits text with • bullets", () => {
      const text =
        "Led the engineering team • Ship feature A • Ship feature B • Ship feature C";
      const result = parseBullets(text);
      assert.strictEqual(result.summary, "Led the engineering team");
      assert.deepStrictEqual(result.highlights, [
        "Ship feature A",
        "Ship feature B",
        "Ship feature C",
      ]);
    });

    it("splits text with • bullets (hyphens not default bullets)", () => {
      const text =
        "Managed a team of 5 • Hired 3 engineers • Improved velocity by 20%";
      const result = parseBullets(text);
      assert.strictEqual(result.summary, "Managed a team of 5");
      assert.deepStrictEqual(result.highlights, [
        "Hired 3 engineers",
        "Improved velocity by 20%",
      ]);
    });

    it("splits text with ➲ arrow bullets", () => {
      const text = "Key achievements ➲ Revenue grew 30% ➲ Costs reduced 15%";
      const result = parseBullets(text);
      assert.strictEqual(result.summary, "Key achievements");
      assert.deepStrictEqual(result.highlights, [
        "Revenue grew 30%",
        "Costs reduced 15%",
      ]);
    });

    it("handles * asterisk bullets", () => {
      const text = "Accomplishments * Built feature X * Shipped Y";
      const result = parseBullets(text);
      assert.strictEqual(result.summary, "Accomplishments");
      assert.deepStrictEqual(result.highlights, ["Built feature X", "Shipped Y"]);
    });
  });

  describe("newline-separated format (standard)", () => {
    it("handles newline-separated bullets", () => {
      const text =
        "Led the engineering team\n• Ship feature A\n• Ship feature B";
      const result = parseBullets(text);
      assert.strictEqual(result.summary, "Led the engineering team");
      assert.deepStrictEqual(result.highlights, ["Ship feature A", "Ship feature B"]);
    });
  });

  describe("edge cases", () => {
    it("returns empty highlights when no bullets present", () => {
      const text =
        "Just a single line description with no bullet points at all";
      const result = parseBullets(text);
      assert.strictEqual(result.summary, text);
      assert.deepStrictEqual(result.highlights, []);
    });

    it("returns empty result for empty text", () => {
      const result = parseBullets("");
      assert.strictEqual(result.summary, "");
      assert.deepStrictEqual(result.highlights, []);
    });

    it("handles mixed bullet styles in one string", () => {
      const text = "Summary line • Point one ‣ Point two";
      const result = parseBullets(text);
      assert.strictEqual(result.summary, "Summary line");
      assert.deepStrictEqual(result.highlights, ["Point one", "Point two"]);
    });

    it("handles bullet at very start of text", () => {
      const text = "• Point one • Point two";
      const result = parseBullets(text);
      assert.strictEqual(result.summary, "");
      assert.deepStrictEqual(result.highlights, ["Point one", "Point two"]);
    });

    it("does not treat hyphens in compound words as bullets (summary)", () => {
      // Hyphens are not default bullets, so entire text is summary
      const text = "Role: co-founder of startup - Built product from scratch";
      const result = parseBullets(text);
      assert.strictEqual(result.summary, text);
      assert.deepStrictEqual(result.highlights, []);
    });

    it("does not treat hyphens in compound words as bullets (highlights)", () => {
      // Hyphens are not default bullets, so entire text is summary
      const text =
        "co-founder - Built end-to-end solution - Deployed to production";
      const result = parseBullets(text);
      assert.strictEqual(result.summary, text);
      assert.deepStrictEqual(result.highlights, []);
    });

    it("supports hyphens as bullets when passed via custom bullets option", () => {
      const text =
        "co-founder - Built end-to-end solution - Deployed to production";
      const result = parseBullets(text, { bullets: "•-" });
      assert.strictEqual(result.summary, "co-founder");
      assert.deepStrictEqual(result.highlights, [
        "Built end-to-end solution",
        "Deployed to production",
      ]);
    });

    it("should handle custom bullets containing hyphen without regex error", () => {
      const result = parseBullets("intro • one - two * three", {
        bullets: "•-*",
      });
      assert.strictEqual(result.summary, "intro");
      assert.deepStrictEqual(result.highlights, ["one", "two", "three"]);
    });

    it("should handle custom bullets with dash characters without regex error", () => {
      assert.doesNotThrow(() =>
        parseBullets("intro — one – two ‒ three", { bullets: "—–-‒" }),
      );
      const result = parseBullets("intro — one – two ‒ three", {
        bullets: "—–-‒",
      });
      assert.strictEqual(result.summary, "intro");
      assert.deepStrictEqual(result.highlights, ["one", "two", "three"]);
    });

    it("should handle custom bullets with all regex special chars without regex error", () => {
      assert.doesNotThrow(() =>
        parseBullets("intro * one + two ? three", {
          bullets: "*+?^${}()|[]\\.-",
        }),
      );
      const result = parseBullets("intro * one + two ? three", {
        bullets: "*+?^${}()|[]\\.-",
      });
      assert.strictEqual(result.summary, "intro");
      assert.deepStrictEqual(result.highlights, ["one", "two", "three"]);
    });
  });
});
