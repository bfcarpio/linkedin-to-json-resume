import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CSVToArray } from "../src/csvtoarray";

describe("CSVToArray", () => {
  it("parses standard CSV with comma delimiter", () => {
    const csv = "a,b,c\n1,2,3\nx,y,z";
    const result = CSVToArray(csv);
    assert.deepStrictEqual(result, [
      ["a", "b", "c"],
      ["1", "2", "3"],
      ["x", "y", "z"],
    ]);
  });

  it("handles quoted fields with commas inside", () => {
    const csv =
      'name,description\n"Product A","Great, amazing, product"\n"Product B","Simple"';
    const result = CSVToArray(csv);
    assert.strictEqual(result[1][1], "Great, amazing, product");
  });

  it("handles quoted fields with quotes inside (escaped quotes)", () => {
    const csv = 'name,note\n"John","Said ""hello"" to me"';
    const result = CSVToArray(csv);
    assert.strictEqual(result[1][1], 'Said "hello" to me');
  });

  it("returns empty array for empty string", () => {
    assert.deepStrictEqual(CSVToArray(""), [[]]);
  });

  it("handles single row", () => {
    assert.deepStrictEqual(CSVToArray("just,one,row"), [["just", "one", "row"]]);
  });

  it("handles rows with uneven column counts", () => {
    const csv = "a,b,c\n1,2\nx";
    const result = CSVToArray(csv);
    assert.deepStrictEqual(result[0], ["a", "b", "c"]);
    assert.strictEqual(result[2].length, 1);
  });

  it("trims BOM character from start", () => {
    const csv = "\uFEFFa,b\n1,2";
    const result = CSVToArray(csv);
    assert.strictEqual(result[0][0], "a");
  });

  it("works with tab delimiter", () => {
    const csv = "a\tb\tc\n1\t2\t3";
    const result = CSVToArray(csv, "\t");
    assert.deepStrictEqual(result, [
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });
});
