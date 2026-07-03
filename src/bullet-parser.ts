/**
 * Parse job description text into summary and highlights.
 * Handles both LinkedIn export format (newlines → spaces, bullets inline)
 * and standard newline-separated format.
 *
 * Text before the first bullet character becomes the summary.
 * Each bullet-separated segment becomes a highlight entry.
 *
 * Bullet characters supported:
 * •, ◦, ‣, ⁃, *, ➲, ⁌, ⁍, ※, ‽, ⁂, ⁑, ⁕, ⁖, ⁗, ⁘, ⁙, ⁚, ⁛, ⁜, ⁝, ⁞
 *
 * Hyphens (-) and dashes (—, –, ‒) are excluded from defaults because they
 * are commonly used as punctuation mid-sentence. Users can add them via the
 * `--bullets` flag if needed.
 */

export interface BulletResult {
  summary: string;
  highlights: string[];
}

export interface ParseBulletsOptions {
  /** Custom bullet characters. If not provided, uses the default set. */
  bullets?: string;
}

const bulletChars = [
  "\u2022", // •
  "\u25E6", // ◦
  "\u2023", // ‣
  "\u2043", // ⁃
  "*",
  "\u27B2", // ➲
  "\u204C", // ⁌
  "\u204D", // ⁍
  "\u203B", // ※
  "\u203D", // ‽
  "\u2042", // ⁂
  "\u1411", // ⁑
  "\u2055", // ⁕
  "\u2056", // ⁖
  "\u2057", // ⁗
  "\u2058", // ⁘
  "\u2059", // ⁙
  "\u205A", // ⁚
  "\u205B", // ⁛
  "\u205C", // ⁜
  "\u205D", // ⁝
  "\u205E", // ⁞
];

// Escape special regex characters in bullet chars
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
const escapedBullets = bulletChars.map(escapeRegExp);

// Match a bullet character preceded by whitespace (or at start of text)
// This handles both "text • bullet" (LinkedIn format) and "text\n• bullet" (newline format)
const bulletRegex = new RegExp(
  `(?:^|\\s+)([${escapedBullets.join("")}])(?=\\s|$)`,
);

/**
 * Split a job description text into summary and highlights.
 * Returns summary-only with empty highlights if no bullets found.
 *
 * Finds ALL bullet positions using the detection regex (which requires
 * whitespace before the bullet char), then splits at those positions.
 * This avoids splitting hyphens in compound words like "end-to-end"
 * that would be caught by a naive \s*[-\s]* splitter.
 */
export function parseBullets(
  text: string,
  options?: ParseBulletsOptions,
): BulletResult {
  if (!text || text.trim() === "") {
    return { summary: "", highlights: [] };
  }

  const trimmed = text.trim();
  const customBullets = options?.bullets;

  // If custom bullets provided, use ONLY those
  const activeBullets = customBullets
    ? customBullets
        .split("")
        .map((c) => c.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&"))
    : escapedBullets;

  const globalRegex = new RegExp(
    `(?:^|\\s)([${activeBullets.join("")}])(?=\\s|$)`,
    "g",
  );

  const positions: number[] = [];
  for (const match of trimmed.matchAll(globalRegex)) {
    positions.push(match.index + match[0].length - 1);
  }

  if (positions.length === 0) {
    // No bullets found — entire text is summary
    return { summary: trimmed, highlights: [] };
  }

  // Summary: text before the first bullet
  const summary = trimmed.slice(0, positions[0]).trim();

  // Highlights: text between bullets, with leading bullet char stripped
  const highlights: string[] = [];
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i] + 1; // skip the bullet character
    const end = i + 1 < positions.length ? positions[i + 1] : trimmed.length;
    const segment = trimmed.slice(start, end).trim();
    if (segment) highlights.push(segment);
  }

  return { summary, highlights };
}

/**
 * Returns the default bullet characters as a single string.
 */
export function defaultBulletChars(): string {
  return bulletChars.join("");
}
