import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { type Output, Processor } from "../src/converter";

describe("Processor", () => {
  let result: Output | null;

  beforeEach(() => {
    result = null;
  });

  it("processes a valid Profile.csv row", () => {
    const processor = new Processor({
      linkedinToJsonResume: (output: Output) => {
        result = output;
      },
    });
    const csv =
      "First Name,Last Name,MaidenName,Address,ZipCode,GeoLocation,Occupation,Summary,Industry,Country,CountryCode,EmailAddress,PhoneNumber,Twitter,LinkedIn\nJohn,Smith,,123 Main St,12345,San Francisco CA,Software Engineer,Full-stack engineer,Tech,United States,US,john@example.com,+1-555-0123,,https://linkedin.com/in/john";
    processor.processFile(csv);
    assert.notStrictEqual(result, null);
    assert.notStrictEqual(result.basics, undefined);
    assert.strictEqual(result.basics.name, "John Smith");
    assert.strictEqual(result.basics.label, "Software Engineer");
    assert.strictEqual(result.basics.email, "john@example.com");
    assert.strictEqual(result.basics.phone, "+1-555-0123");
    assert.strictEqual(result.basics.location?.countryCode, "US");
  });

  it("handles multiple CSV rows (Profile + Position)", () => {
    const processor = new Processor({
      linkedinToJsonResume: (output: Output) => {
        result = output;
      },
    });
    const csv = [
      "Profile.csv,First Name,Last Name,Occupation",
      "Profile.csv,John,Smith,Software Engineer",
      "Position.csv,Company Name,Title,Description,Started On,Finished On",
      "Position.csv,Acme Corp,Senior Dev,Our product handles payments • Built payment gateway • Reduced latency,2020-03,2024-06",
    ].join("\n");
    processor.processFile(csv);
    assert.notStrictEqual(result.work, undefined);
    assert.strictEqual(result.work.length, 1);
    assert.strictEqual(result.work[0].name, "Acme Corp");
    assert.strictEqual(result.work[0].position, "Senior Dev");
    assert.strictEqual(result.work[0].summary, "Our product handles payments");
    assert.deepStrictEqual(result.work[0].highlights, [
      "Built payment gateway",
      "Reduced latency",
    ]);
  });

  it("handles Position.csv with date parsing", () => {
    const processor = new Processor({
      linkedinToJsonResume: (output: Output) => {
        result = output;
      },
    });
    const csv = [
      "Position.csv,Company Name,Title,Description,Started On,Finished On",
      "Position.csv,Startup Inc,CTO,• Led team • Built product,2020-03,2024-06",
    ].join("\n");
    processor.processFile(csv);
    assert.strictEqual(result.work[0].startDate, "2020-03-01");
    assert.strictEqual(result.work[0].endDate, "2024-06-01");
  });

  it("handles Education.csv", () => {
    const processor = new Processor({
      linkedinToJsonResume: (output: Output) => {
        result = output;
      },
    });
    const csv = [
      "Education.csv,School Name,Degree Name,Field,Started On,Finished On,Grade,Activities,Notes",
      "Education.csv,MIT,BS,Computer Science,2016-09,2020-06,3.8,Rocket Club,Dean list",
    ].join("\n");
    processor.processFile(csv);
    assert.notStrictEqual(result.education, undefined);
    assert.strictEqual(result.education.length, 1);
    assert.strictEqual(result.education[0].institution, "MIT");
    assert.strictEqual(result.education[0].area, "Computer Science");
    assert.strictEqual(result.education[0].studyType, "BS");
    assert.strictEqual(result.education[0].startDate, "2016-09-01");
    assert.strictEqual(result.education[0].endDate, "2020-06-01");
  });

  it("handles Skills.csv", () => {
    const processor = new Processor({
      linkedinToJsonResume: (output: Output) => {
        result = output;
      },
    });
    const csv = [
      "Skills.csv,Name,Proficiency,Count",
      "Skills.csv,TypeScript,Expert,5",
      "Skills.csv,React,Advanced,3",
    ].join("\n");
    processor.processFile(csv);
    assert.notStrictEqual(result.skills, undefined);
    assert.strictEqual(result.skills.length, 2);
    assert.strictEqual(result.skills[0].name, "TypeScript");
    assert.strictEqual(result.skills[0].level, "Expert");
  });

  it("handles Languages.csv", () => {
    const processor = new Processor({
      linkedinToJsonResume: (output: Output) => {
        result = output;
      },
    });
    const csv = [
      "Languages.csv,Name,Proficiency",
      "Languages.csv,English,Native or bilingual",
      "Languages.csv,Spanish,Professional working",
    ].join("\n");
    processor.processFile(csv);
    assert.notStrictEqual(result.languages, undefined);
    assert.strictEqual(result.languages.length, 2);
    assert.strictEqual(result.languages[0].language, "English");
  });

  it("handles empty CSV gracefully", () => {
    const processor = new Processor({
      linkedinToJsonResume: (output: Output) => {
        result = output;
      },
    });
    processor.processFile("");
    assert.notStrictEqual(result, null);
  });
});
