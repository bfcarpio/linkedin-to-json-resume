/**
 * Parse LinkedIn date formats into ISO date strings (YYYY-MM-DD).
 * LinkedIn exports use flexible formats like "2020-03", "March 2020", "Mar 2020".
 * When only month/year are provided, defaults to the 1st of the month.
 */

export type ISODate = string; // "YYYY-MM-DD"

/**
 * Parse a LinkedIn date string into ISO format.
 * Returns undefined for empty/null/undefined input.
 */
export function parseLinkedInDate(
  raw: string | null | undefined,
): ISODate | undefined {
  if (!raw || raw.trim() === "") return undefined;

  const trimmed = raw.trim();

  // YYYY-MM format: "2020-03"
  const yyyyMm = /^(\d{4})-(\d{1,2})$/;
  const yyyyMmMatch = trimmed.match(yyyyMm);
  if (yyyyMmMatch) {
    const [, year, month] = yyyyMmMatch;
    return `${year}-${month.padStart(2, "0")}-01`;
  }

  // "Month YYYY" or "Mon YYYY" format: "March 2020" or "Mar 2020"
  const monthNames: Record<string, string> = {
    jan: "01",
    january: "01",
    feb: "02",
    february: "02",
    mar: "03",
    march: "03",
    apr: "04",
    april: "04",
    may: "05",
    jun: "06",
    june: "06",
    jul: "07",
    july: "07",
    aug: "08",
    august: "08",
    sep: "09",
    september: "09",
    oct: "10",
    october: "10",
    nov: "11",
    november: "11",
    dec: "12",
    december: "12",
  };

  const monthYear = /^([a-zA-Z]+)\s+(\d{4})$/;
  const monthYearMatch = trimmed.match(monthYear);
  if (monthYearMatch) {
    const [, monthStr, year] = monthYearMatch;
    const month = monthNames[monthStr.toLowerCase()];
    if (month) {
      return `${year}-${month}-01`;
    }
  }

  // Already ISO-like? return as-is
  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  if (isoDate.test(trimmed)) {
    return trimmed;
  }

  // Fallback: return undefined for unrecognized formats
  return undefined;
}
