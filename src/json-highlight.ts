/**
 * Minimal JSON syntax highlighter.
 * Wraps tokens in <span class="token-{type}"> for CSS styling.
 * Token types: key, string, number, boolean, null, punctuation.
 */
export function highlightJson(json: string): string {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|[{}[\],:])/g,
      (match) => {
        let type = "string";
        if (/^"/.test(match)) {
          type = /:$/.test(match) ? "key" : "string";
        } else if (/true|false/.test(match)) {
          type = "boolean";
        } else if (/null/.test(match)) {
          type = "null";
        } else if (/[{}[\],:]/.test(match)) {
          type = "punctuation";
        } else {
          type = "number";
        }
        return `<span class="token-${type}">${match}</span>`;
      },
    );
}
