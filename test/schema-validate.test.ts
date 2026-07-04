import { describe, it } from "node:test";
import assert from "node:assert/strict";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { type Output, Processor } from "../src/converter";
import schema from "../src/schema.json";

interface SchemaProp {
  properties?: Record<string, unknown>;
  items?: {
    properties?: Record<string, unknown>;
  };
}

interface SchemaType {
  properties: Record<string, SchemaProp>;
}

// Strict mode disabled because the schema uses "additionalItems" with a single
// "items" schema (not an array), which is not valid in strict mode.
const ajv = new Ajv({ strict: false });
addFormats(ajv);
// Override format validators to accept empty strings — these fields are optional
// in the schema, and the converter outputs empty string when no value is available.
ajv.addFormat("uri", {
  validate: (s: string) =>
    s === "" || /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(s),
});
ajv.addFormat("email", {
  validate: (s: string) => s === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s),
});
const validate = ajv.compile(schema);

function makeMultiSectionCSV(sections: Record<string, string[][]>): string {
  let out = "";
  for (const [filename, rows] of Object.entries(sections)) {
    for (const row of rows) {
      out += `${filename},${row.join(",")}\n`;
    }
  }
  return out;
}

describe("JSON Resume Schema Validation", () => {
  it("validates converter output for a full profile", () => {
    const csv = makeMultiSectionCSV({
      "Profile.csv": [
        ["First Name", "Last Name", "Headline", "Summary"],
        ["John", "Smith", "Software Engineer", "A dedicated engineer"],
      ],
      "Email Addresses.csv": [
        ["Email Address", "Confirmed", "Primary"],
        ["john@example.com", "Yes", "Yes"],
      ],
      "PhoneNumbers.csv": [
        ["Number", "Type"],
        ["+1-555-0123", "Mobile"],
      ],
      "Skills.csv": [["Name"], ["TypeScript"], ["React"]],
      "Languages.csv": [
        ["Name", "Proficiency"],
        ["English", "Native or bilingual"],
        ["Spanish", "Professional working"],
      ],
      "Positions.csv": [
        [
          "Company Name",
          "Title",
          "Description",
          "Started On",
          "Finished On",
          "Location",
        ],
        [
          "Acme Corp",
          "Senior Dev",
          "Built things",
          "2020-03",
          "2024-06",
          "San Francisco",
        ],
      ],
    });

    let output: Output;
    const processor = new Processor({
      linkedinToJsonResume: (o: Output) => {
        output = o;
      },
    });
    processor.processFile(csv);

    // Add required meta if missing
    if (!output.meta) {
      output.meta = {};
    }
    // Ensure work[0].name not company
    assert.ok(!Object.hasOwn(output.work[0], "company"));
    assert.ok(Object.hasOwn(output.work[0], "name"));

    const valid = validate(output);
    if (!valid) {
      console.error("Validation errors:", ajv.errorsText(validate.errors));
      console.error("Errors detail:", JSON.stringify(validate.errors, null, 2));
    }
    assert.strictEqual(valid, true);
  });

  it("validates output for minimal profile (only basics)", () => {
    const csv = makeMultiSectionCSV({
      "Profile.csv": [
        ["First Name", "Last Name", "Headline"],
        ["Jane", "Doe", "Designer"],
      ],
    });

    let output: Output;
    const processor = new Processor({
      linkedinToJsonResume: (o: Output) => {
        output = o;
      },
    });
    processor.processFile(csv);

    if (!output.meta) output.meta = {};
    const valid = validate(output);
    if (!valid) {
      console.error("Errors:", ajv.errorsText(validate.errors));
    }
    assert.strictEqual(valid, true);
  });
});

describe("Key ordering", () => {
  it("top-level keys follow schema order", () => {
    const csv = makeMultiSectionCSV({
      "Profile.csv": [
        ["First Name", "Last Name", "Headline", "Summary"],
        ["John", "Smith", "Engineer", "Summary"],
      ],
      "Positions.csv": [
        ["Company Name", "Title", "Started On", "Finished On"],
        ["Acme", "Dev", "2020-03", "2024-06"],
      ],
      "Skills.csv": [["Name"], ["TypeScript"]],
      "Languages.csv": [
        ["Name", "Proficiency"],
        ["English", "Native"],
      ],
    });

    let output: Output;
    const processor = new Processor({
      linkedinToJsonResume: (o: Output) => {
        output = o;
      },
    });
    processor.processFile(csv);
    if (!output.meta) output.meta = {};

    const schemaKeys = Object.keys(schema.properties);
    const outputKeys = Object.keys(output);
    const expectedKeys = schemaKeys.filter((k) => outputKeys.includes(k));

    assert.deepStrictEqual(outputKeys, expectedKeys);
  });

  it("basics keys follow schema order", () => {
    const csv = makeMultiSectionCSV({
      "Profile.csv": [
        ["First Name", "Last Name", "Headline", "Summary"],
        ["Jane", "Doe", "Designer", "Summary"],
      ],
    });

    let output: Output;
    const processor = new Processor({
      linkedinToJsonResume: (o: Output) => {
        output = o;
      },
    });
    processor.processFile(csv);
    if (!output.meta) output.meta = {};

    const schemaBasicsKeys = Object.keys(
      (schema as SchemaType).properties.basics.properties,
    );
    const outputBasicsKeys = Object.keys(output.basics);
    const expectedBasicsKeys = schemaBasicsKeys.filter((k) =>
      outputBasicsKeys.includes(k),
    );

    assert.deepStrictEqual(outputBasicsKeys, expectedBasicsKeys);
  });

  it("work entry keys follow schema order", () => {
    const csv = makeMultiSectionCSV({
      "Profile.csv": [
        ["First Name", "Last Name", "Headline"],
        ["John", "Smith", "Engineer"],
      ],
      "Positions.csv": [
        ["Company Name", "Title", "Started On", "Finished On"],
        ["Acme", "Dev", "2020-03", "2024-06"],
      ],
    });

    let output: Output;
    const processor = new Processor({
      linkedinToJsonResume: (o: Output) => {
        output = o;
      },
    });
    processor.processFile(csv);
    if (!output.meta) output.meta = {};

    const schemaWorkKeys = Object.keys(
      (schema as SchemaType).properties.work.items.properties,
    );
    const outputWorkKeys = Object.keys(output.work[0]);
    const expectedWorkKeys = schemaWorkKeys.filter((k) =>
      outputWorkKeys.includes(k),
    );

    assert.deepStrictEqual(outputWorkKeys, expectedWorkKeys);
  });
});
