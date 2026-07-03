import { beforeEach, describe, expect, it } from "bun:test";
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
    expect(result).not.toBeNull();
    expect(result.basics).toBeDefined();
    expect(result.basics.name).toBe("John Smith");
    expect(result.basics.label).toBe("Software Engineer");
    expect(result.basics.email).toBe("john@example.com");
    expect(result.basics.phone).toBe("+1-555-0123");
    expect(result.basics.location?.countryCode).toBe("US");
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
    expect(result.work).toBeDefined();
    expect(result.work).toHaveLength(1);
    expect(result.work[0].name).toBe("Acme Corp");
    expect(result.work[0].position).toBe("Senior Dev");
    expect(result.work[0].summary).toBe("Our product handles payments");
    expect(result.work[0].highlights).toEqual([
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
    expect(result.work[0].startDate).toBe("2020-03-01");
    expect(result.work[0].endDate).toBe("2024-06-01");
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
    expect(result.education).toBeDefined();
    expect(result.education).toHaveLength(1);
    expect(result.education[0].institution).toBe("MIT");
    expect(result.education[0].area).toBe("Computer Science");
    expect(result.education[0].studyType).toBe("BS");
    expect(result.education[0].startDate).toBe("2016-09-01");
    expect(result.education[0].endDate).toBe("2020-06-01");
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
    expect(result.skills).toBeDefined();
    expect(result.skills).toHaveLength(2);
    expect(result.skills[0].name).toBe("TypeScript");
    expect(result.skills[0].level).toBe("Expert");
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
    expect(result.languages).toBeDefined();
    expect(result.languages).toHaveLength(2);
    expect(result.languages[0].language).toBe("English");
  });

  it("handles empty CSV gracefully", () => {
    const processor = new Processor({
      linkedinToJsonResume: (output: Output) => {
        result = output;
      },
    });
    processor.processFile("");
    expect(result).not.toBeNull();
  });
});
