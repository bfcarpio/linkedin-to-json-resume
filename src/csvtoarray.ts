/**
 * Parse a CSV string into a 2D array of strings.
 * Handles quoted fields, escaped quotes, and BOM characters.
 */

export function CSVToArray(strData: string, strDelimiter = ","): string[][] {
  if (!strData) return [[]];

  // Strip BOM character if present
  const cleaned = strData.replace(/^\uFEFF/, "");
  const delimiter = strDelimiter;

  // Create a regex to match CSV fields
  const objPattern = new RegExp(
    `(?:${delimiter}|\\r?\\n|\\r|^)` +
      `(?:"((?:[^"]*(?:""[^"]*)*)*)"|([^"${delimiter}\\r\\n]*))`,
    "gi",
  );

  const arrData: string[][] = [[]];
  let arrMatches: RegExpExecArray | null;

  while (true) {
    arrMatches = objPattern.exec(cleaned);
    if (arrMatches === null) break;
    const matchedValue = arrMatches[1]
      ? arrMatches[1].replace(/""/g, '"')
      : arrMatches[2];

    if (arrData[arrData.length - 1].length === 0) {
      arrData[arrData.length - 1].push(matchedValue ?? "");
    } else {
      // Check if this is a new row (delimiter was \n)
      const fullMatch = arrMatches[0];
      if (
        fullMatch.startsWith("\r\n") ||
        fullMatch.startsWith("\n") ||
        fullMatch.startsWith("\r")
      ) {
        arrData.push([matchedValue ?? ""]);
      } else {
        arrData[arrData.length - 1].push(matchedValue ?? "");
      }
    }
  }

  return arrData;
}
