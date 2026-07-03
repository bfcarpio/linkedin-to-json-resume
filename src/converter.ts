import { type ParseBulletsOptions, parseBullets } from "./bullet-parser";
import { resolveCountry } from "./country-codes";
import { CSVToArray } from "./csvtoarray";
import { parseLinkedInDate } from "./date-parser";
import schema from "./schema.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Basics {
  name: string;
  label: string;
  image: string;
  email: string;
  phone: string;
  url: string;
  summary: string;
  location?: {
    address: string;
    postalCode: string;
    city: string;
    countryCode: string;
    region: string;
  };
  profiles?: Array<{
    network: string;
    username: string;
    url: string;
  }>;
}

interface WorkEntry {
  name: string;
  position: string;
  location?: string;
  url: string;
  startDate: string;
  endDate?: string;
  summary: string;
  highlights: string[];
}

interface VolunteerEntry {
  organization: string;
  position: string;
  startDate: string;
  endDate?: string;
  summary: string;
}

interface EducationEntry {
  institution: string;
  url: string;
  area: string;
  studyType: string;
  startDate: string;
  endDate?: string;
  score: string;
  courses: string[];
}

interface Skill {
  name: string;
  level: string;
  keywords: string[];
}

interface Language {
  language: string;
  fluency: string | null;
}

interface ProjectEntry {
  name: string;
  startDate: string;
  endDate?: string;
  description: string;
  highlights: string[];
  url: string;
}

interface PublicationEntry {
  name: string;
  publisher: string;
  releaseDate: string;
  url: string;
  summary: string;
}

interface Reference {
  name: string;
  reference: string;
}

interface Award {
  title: string;
  date: string;
  awarder: string;
  summary: string;
}

interface Certificate {
  name: string;
  date: string;
  issuer: string;
  url: string;
}

interface Interest {
  name: string;
  keywords: string[];
}

export interface Output {
  basics?: Basics;
  work?: WorkEntry[];
  volunteer?: VolunteerEntry[];
  education?: EducationEntry[];
  awards?: Award[];
  certificates?: Certificate[];
  publications?: PublicationEntry[];
  skills?: Skill[];
  languages?: Language[];
  interests?: Interest[];
  references?: Reference[];
  projects?: ProjectEntry[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a field-name-to-value map from CSV headers and a data row.
 */
function rowToMap(
  headers: string[],
  row: (string | undefined)[],
): Record<string, string> {
  const map: Record<string, string> = {};

  // Column name aliases: LinkedIn's actual column → converter's expected key
  // These handle cases where simple space-stripping doesn't produce the right key
  const aliases: Record<string, string> = {
    CompanyName: "Company",
    company_name: "Company",
    StartedOn: "Started",
    start_date: "Started",
    FinishedOn: "Ended",
    EndedOn: "Ended",
    end_date: "Ended",
    SchoolName: "School",
    school_name: "School",
    DegreeName: "Degree",
    degree_name: "Degree",
    Title: "Position",
    JobTitle: "Position",
    PhoneNumber: "Phone",
    EmailAddress: "Email",
  };

  for (let i = 0; i < headers.length; i++) {
    const value = (row[i] ?? "").trim();
    const header = headers[i].trim();

    // Normalize: strip all spaces ("First Name" → "FirstName")
    const stripped = header.replace(/\s+/g, "");

    // Store the space-stripped version
    map[stripped] = value;

    // Also store lowercase version for case-insensitive lookups
    map[stripped.toLowerCase()] = value;

    // Apply aliases for known column name differences
    const alias = aliases[stripped];
    if (alias && !map[alias]) {
      map[alias] = value;
    }
    const aliasLower = aliases[stripped.toLowerCase()];
    if (aliasLower && !map[aliasLower]) {
      map[aliasLower] = value;
    }
  }

  return map;
}

/**
 * Parse a CSV block (header row + data rows) and return [headers, rows].
 */
function parseCSVBlock(content: string): {
  headers: string[];
  rows: string[][];
} {
  const elements = CSVToArray(content);
  const headers = elements.length > 0 ? elements[0].map((h) => h.trim()) : [];
  const rows = elements
    .slice(1)
    .filter((r) => r.some((c) => c.trim().length > 0));
  return { headers, rows };
}

/**
 * Extract a URL from a field that may contain the old bracket format
 * [Network:https://...] or a plain URL.
 */
function extractUrl(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const bracketMatch = trimmed.match(/\[[^\]]*:\s*(https?:\/\/[^\s,\]]+)/);
  if (bracketMatch) return bracketMatch[1];
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed;
  return "";
}

/**
 * Extract the first URL from a comma-separated list of websites.
 * Handles both plain URLs and LinkedIn's bracket format [Label]URL.
 */
function extractFirstUrl(raw: string): string {
  if (!raw) return "";
  const parts = raw.split(",");
  for (const part of parts) {
    const extracted = extractUrl(part.trim());
    if (extracted) return extracted;
  }
  return "";
}

/**
 * Clean up a LinkedIn proficiency string: lowercase, replace underscores
 * with spaces, capitalise first letter.
 */
function cleanProficiency(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.toLowerCase().replace(/_/g, " ");
  return cleaned.charAt(0).toUpperCase() + cleaned.substring(1);
}

// ---------------------------------------------------------------------------
// Known section names
// ---------------------------------------------------------------------------

const KNOWN_SECTIONS = new Set([
  "Profile.csv",
  "Profile Summary.csv",
  "Position.csv",
  "Positions.csv",
  "Education.csv",
  "Skills.csv",
  "Languages.csv",
  "Projects.csv",
  "Publications.csv",
  "Certifications.csv",
  "Certificates.csv",
  "Honors.csv",
  "PhoneNumbers.csv",
  "Email Addresses.csv",
  "Interests.csv",
  "Recommendations Received.csv",
  "Recommendations_Received.csv",
  "Endorsement_Received_Info.csv",
  "Causes You Care About.csv",
  "Company Follows.csv",
  "Hashtag_Follows.csv",
  "Organizations.csv",
  "Volunteering.csv",
  "Courses.csv",
]);

// ---------------------------------------------------------------------------
// Schema-based key sorting
// ---------------------------------------------------------------------------

/**
 * Recursively sort object keys according to JSON Resume schema property order.
 * For arrays, uses the `items.properties` schema to sort each element.
 */
function sortObjectBySchema(
  obj: unknown,
  schema: Record<string, unknown>,
): unknown {
  if (Array.isArray(obj)) {
    const itemSchema = schema.items as Record<string, unknown> | undefined;
    if (itemSchema?.properties) {
      return obj.map((item) => sortObjectBySchema(item, itemSchema));
    }
    return obj;
  }
  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    const props = (schema.properties ?? {}) as Record<
      string,
      Record<string, unknown>
    >;
    for (const key of Object.keys(props)) {
      if (key in (obj as Record<string, unknown>)) {
        result[key] = sortObjectBySchema(
          (obj as Record<string, unknown>)[key],
          props[key],
        );
      }
    }
    return result;
  }
  return obj;
}

// ---------------------------------------------------------------------------
// Processor
// ---------------------------------------------------------------------------

export interface ProcessorOptions {
  linkedinToJsonResume: (output: Output) => void;
  bulletOptions?: ParseBulletsOptions;
}

export class Processor {
  private output: Output;
  private callback: (output: Output) => void;
  private bulletOptions?: ParseBulletsOptions;

  constructor(options: ProcessorOptions) {
    this.callback = options.linkedinToJsonResume;
    this.output = {};
    this.bulletOptions = options.bulletOptions;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  getOutput(): Output {
    return sortObjectBySchema(this.output, schema) as Output;
  }

  processFile(strCSV: string): void {
    this.output = {};

    if (!strCSV || strCSV.trim().length === 0) {
      this.callback(this.getOutput());
      return;
    }

    const lines = strCSV.split("\n");

    if (this.isMultiSection(lines)) {
      this.processSections(lines);
    } else {
      this.processProfileCSV(strCSV);
    }

    this.callback(this.getOutput());
  }

  // -----------------------------------------------------------------------
  // Section detection & routing
  // -----------------------------------------------------------------------

  private isMultiSection(lines: string[]): boolean {
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const firstCell = trimmed.split(",")[0];
      if (KNOWN_SECTIONS.has(firstCell)) return true;
    }
    return false;
  }

  private processSections(lines: string[]): void {
    let currentSection: string | null = null;
    let currentLines: string[] = [];

    const flushSection = (): void => {
      if (currentSection && currentLines.length > 0) {
        this.processSectionContent(currentSection, currentLines.join("\n"));
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const commaIndex = trimmed.indexOf(",");
      const firstCell =
        commaIndex >= 0 ? trimmed.slice(0, commaIndex) : trimmed;

      if (KNOWN_SECTIONS.has(firstCell)) {
        // Only flush when section changes, not on every section-prefix line
        if (firstCell !== currentSection) {
          flushSection();
          currentSection = firstCell;
          currentLines = [];
        }
        // Strip the section prefix column and accumulate
        currentLines.push(trimmed.slice(commaIndex + 1));
      }
    }

    flushSection();
  }

  private processSectionContent(sectionName: string, content: string): void {
    switch (sectionName) {
      case "Profile.csv":
        this.processProfileCSV(content);
        break;
      case "Position.csv":
      case "Positions.csv":
        this.processPositionCSV(content);
        break;
      case "Education.csv":
        this.processEducationCSV(content);
        break;
      case "Skills.csv":
        this.processSkillsCSV(content);
        break;
      case "Languages.csv":
        this.processLanguagesCSV(content);
        break;
      case "Projects.csv":
        this.processProjectsCSV(content);
        break;
      case "Publications.csv":
        this.processPublicationsCSV(content);
        break;
      case "Certifications.csv":
      case "Certificates.csv":
        this.processCertificatesCSV(content);
        break;
      case "Honors.csv":
        this.processHonorsCSV(content);
        break;
      case "PhoneNumbers.csv":
        this.processPhoneNumbersCSV(content);
        break;
      case "Email Addresses.csv":
        this.processEmailAddressesCSV(content);
        break;
      case "Interests.csv":
        this.processInterestsCSV(content);
        break;
      case "Recommendations Received.csv":
      case "Recommendations_Received.csv":
        this.processRecommendationsCSV(content);
        break;
      case "Endorsement_Received_Info.csv":
        this.processEndorsementsCSV(content);
        break;
      case "Profile Summary.csv":
        this.processProfileCSV(content);
        break;
      case "Organizations.csv":
        this.processOrganizationsCSV(content);
        break;
      case "Volunteering.csv":
        this.processVolunteeringCSV(content);
        break;
      case "Courses.csv":
        this.processCoursesCSV(content);
        break;
      case "Causes You Care About.csv":
      case "Company Follows.csv":
      case "Hashtag_Follows.csv":
        this.processFollowsCSV(content);
        break;
    }
  }

  // -----------------------------------------------------------------------
  // Section processors
  // -----------------------------------------------------------------------

  private processProfileCSV(content: string): void {
    const { headers, rows } = parseCSVBlock(content);
    if (rows.length === 0) return;

    const row = rowToMap(headers, rows[0]);

    // Brand the output key ordering so basics comes first
    this.output.basics = this.buildBasics(row);
  }

  private buildBasics(row: Record<string, string>): Basics {
    const firstName = row.FirstName ?? "";
    const lastName = row.LastName ?? "";
    const headline = row.Headline ?? row.Occupation ?? "";
    const rawSummary = row.Summary ?? "";
    const { summary: summaryText, highlights } = parseBullets(
      rawSummary,
      this.bulletOptions,
    );
    const summary =
      highlights.length > 0
        ? `${summaryText}\n${highlights.map((h) => `• ${h}`).join("\n")}`
        : summaryText;
    const address = row.Address ?? "";
    const zipCode = row.ZipCode ?? "";
    const geoLocation = row.GeoLocation ?? "";
    const email = row.EmailAddress ?? row.Email ?? "";
    const phone = row.PhoneNumber ?? row.Phone ?? "";
    const twitterRaw = row.Twitter ?? row.TwitterHandles ?? "";
    const linkedinUrl = row.LinkedIn ?? "";
    const websitesRaw = row.Websites ?? "";

    // Country code: prefer the direct column, otherwise resolve from country name
    const rawCountryCode = row.CountryCode ?? "";
    const countryName = row.Country ?? "";
    let countryCode = "";
    if (rawCountryCode && rawCountryCode.length === 2) {
      countryCode = rawCountryCode;
    } else if (rawCountryCode) {
      countryCode = resolveCountry(rawCountryCode) ?? "";
    } else if (countryName) {
      countryCode = resolveCountry(countryName) ?? "";
    }

    // Fallback: resolve from the last segment of geoLocation
    if (!countryCode && geoLocation) {
      const segments = geoLocation.split(",").map((s) => s.trim());
      const last = segments[segments.length - 1];
      if (last) countryCode = resolveCountry(last) ?? "";
    }

    // Parse geoLocation segments for city / region
    const addressSegments = geoLocation.split(",").map((s) => s.trim());
    const city = addressSegments[0] ?? "";
    const region = addressSegments[1] ?? "";

    // URL: prefer LinkedIn URL, fall back to first URL from websites field
    const url = linkedinUrl
      ? extractUrl(linkedinUrl)
      : extractFirstUrl(websitesRaw);

    // Handle Twitter handle (may be wrapped in brackets in old exports, may have @ prefix)
    const twitter = twitterRaw.replace(/[[\]]/g, "").replace(/^@/, "");

    const profiles: Array<{ network: string; username: string; url: string }> =
      [];
    if (twitter) {
      profiles.push({
        network: "Twitter",
        username: twitter,
        url: `https://twitter.com/${twitter}`,
      });
    }

    return {
      name: `${firstName} ${lastName}`.trim(),
      label: headline,
      image: "",
      email,
      phone,
      url,
      summary,
      location: {
        address,
        postalCode: zipCode,
        city,
        countryCode,
        region,
      },
      profiles,
    };
  }

  private processPositionCSV(content: string): void {
    const { headers, rows } = parseCSVBlock(content);

    const work = rows.map((row) => {
      const map = rowToMap(headers, row);
      const description = map.Description ?? map.description ?? "";
      const { summary, highlights } = parseBullets(
        description,
        this.bulletOptions,
      );
      const rawStart = map.Started ?? map.StartDate ?? "";
      const rawEnd = map.Ended ?? map.EndDate ?? "";

      const entry: WorkEntry = {
        name: map.Company ?? map.companyName ?? "",
        position: map.Title ?? map.title ?? "",
        location: map.Location ?? map.location ?? "",
        url: map.Url ?? map.url ?? "",
        startDate: parseLinkedInDate(rawStart) ?? rawStart,
        summary,
        highlights,
      };

      if (rawEnd) {
        entry.endDate = parseLinkedInDate(rawEnd) ?? rawEnd;
      }

      return entry;
    });

    // Sort by startDate descending
    this.output.work = work.sort((a, b) =>
      b.startDate.localeCompare(a.startDate),
    );
  }

  private processEducationCSV(content: string): void {
    const { headers, rows } = parseCSVBlock(content);

    const education = rows.map((row) => {
      const map = rowToMap(headers, row);
      const rawStart = map.Started ?? map.StartDate ?? "";
      const rawEnd = map.Ended ?? map.EndDate ?? "";

      const entry: EducationEntry = {
        institution: map.School ?? map.schoolName ?? "",
        url: map.Url ?? map.url ?? "",
        area: map.Field ?? map.field ?? "",
        studyType: map.Degree ?? map.degree ?? map.DegreeName ?? "",
        startDate: parseLinkedInDate(rawStart) ?? rawStart,
        score: map.Grade ?? map.grade ?? map.Score ?? "",
        courses: [],
      };

      if (rawEnd) {
        entry.endDate = parseLinkedInDate(rawEnd) ?? rawEnd;
      }

      return entry;
    });

    // Sort by startDate descending
    this.output.education = education.sort((a, b) =>
      b.startDate.localeCompare(a.startDate),
    );
  }

  private processSkillsCSV(content: string): void {
    const { headers, rows } = parseCSVBlock(content);

    this.output.skills = rows.map((row) => {
      const map = rowToMap(headers, row);
      return {
        name: map.Name ?? map.name ?? "",
        level: map.Proficiency ?? map.proficiency ?? map.Level ?? "",
        keywords: [],
      };
    });
  }

  private processLanguagesCSV(content: string): void {
    const { headers, rows } = parseCSVBlock(content);

    this.output.languages = rows.map((row) => {
      const map = rowToMap(headers, row);
      const proficiency = map.Proficiency ?? map.proficiency ?? "";
      return {
        language: map.Name ?? map.name ?? "",
        fluency: proficiency ? cleanProficiency(proficiency) : null,
      };
    });
  }

  private processProjectsCSV(content: string): void {
    const { headers, rows } = parseCSVBlock(content);

    const projects = rows.map((row) => {
      const map = rowToMap(headers, row);
      const rawStart = map.Started ?? map.StartDate ?? "";
      const rawEnd = map.Ended ?? map.EndDate ?? "";

      const description = map.Description ?? map.description ?? "";
      const { summary, highlights } = parseBullets(
        description,
        this.bulletOptions,
      );

      const entry: ProjectEntry = {
        name: map.Title ?? map.Name ?? map.name ?? "",
        startDate: rawStart ? (parseLinkedInDate(rawStart) ?? rawStart) : "",
        description: summary,
        highlights,
        url: map.Url ?? map.url ?? "",
      };

      if (rawEnd) {
        entry.endDate = parseLinkedInDate(rawEnd) ?? rawEnd;
      }

      return entry;
    });

    this.output.projects = projects;
  }

  private processPublicationsCSV(content: string): void {
    const { headers, rows } = parseCSVBlock(content);

    const publications = rows.map((row) => {
      const map = rowToMap(headers, row);
      const rawDate = map.Date ?? map.date ?? map.PublicationDate ?? "";

      return {
        name: map.Name ?? map.name ?? map.Title ?? "",
        publisher: map.Publisher ?? map.publisher ?? "",
        releaseDate: rawDate ? (parseLinkedInDate(rawDate) ?? rawDate) : "",
        url: map.Url ?? map.url ?? "",
        summary: map.Description ?? map.description ?? "",
      };
    });

    this.output.publications = publications;
  }

  private processCertificatesCSV(content: string): void {
    const { headers, rows } = parseCSVBlock(content);

    const certificates = rows.map((row) => {
      const map = rowToMap(headers, row);
      const rawDate = map.Date ?? map.date ?? map.Issued ?? map.Started ?? "";

      return {
        name: map.Name ?? map.name ?? "",
        date: rawDate ? (parseLinkedInDate(rawDate) ?? rawDate) : "",
        issuer: map.Issuer ?? map.issuer ?? map.Authority ?? "",
        url: map.Url ?? map.url ?? "",
      };
    });

    this.output.certificates = certificates;
  }

  private processHonorsCSV(content: string): void {
    const { headers, rows } = parseCSVBlock(content);

    const awards = rows.map((row) => {
      const map = rowToMap(headers, row);
      const rawDate = map.Date ?? map.date ?? map.Issued ?? map.Started ?? "";

      return {
        title: map.Title ?? map.title ?? map.Name ?? "",
        date: rawDate ? (parseLinkedInDate(rawDate) ?? rawDate) : "",
        awarder: map.Awarder ?? map.awarder ?? map.Issuer ?? map.Company ?? "",
        summary: map.Description ?? map.description ?? map.Summary ?? "",
      };
    });

    this.output.awards = awards;
  }

  private processPhoneNumbersCSV(content: string): void {
    const { headers, rows } = parseCSVBlock(content);
    if (rows.length === 0) return;

    const map = rowToMap(headers, rows[0]);
    const number = map.Number ?? map.number ?? map.PhoneNumber ?? "";
    if (number) {
      // Ensure basics exists
      if (!this.output.basics) {
        this.output.basics = {
          name: "",
          label: "",
          image: "",
          email: "",
          phone: "",
          url: "",
          summary: "",
          location: {
            address: "",
            postalCode: "",
            city: "",
            countryCode: "",
            region: "",
          },
          profiles: [],
        };
      }
      this.output.basics.phone = number;
    }
  }

  private processEmailAddressesCSV(content: string): void {
    const { headers, rows } = parseCSVBlock(content);
    if (rows.length === 0) return;

    // Find the primary email (or first one)
    for (const row of rows) {
      const map = rowToMap(headers, row);
      const address =
        map.EmailAddress ?? map.Address ?? map.address ?? map.Email ?? "";
      const isPrimary = map.IsPrimary ?? map.isPrimary ?? map.Primary ?? "";

      if (
        address &&
        (isPrimary === "Yes" || isPrimary === "true" || isPrimary === "")
      ) {
        if (!this.output.basics) {
          this.output.basics = {
            name: "",
            label: "",
            image: "",
            email: "",
            phone: "",
            url: "",
            summary: "",
            location: {
              address: "",
              postalCode: "",
              city: "",
              countryCode: "",
              region: "",
            },
            profiles: [],
          };
        }
        this.output.basics.email = address;
        break;
      }
    }
  }

  private processInterestsCSV(content: string): void {
    const { headers, rows } = parseCSVBlock(content);

    const interests: Interest[] = [];
    for (const row of rows) {
      const map = rowToMap(headers, row);
      const name = (map.Name ?? map.name ?? "").trim();
      if (name) {
        interests.push({ name, keywords: [] });
      } else {
        // For Interests.csv, the value may be a comma-separated list
        const raw = row.join(",").trim();
        if (raw) {
          for (const item of raw.split(",")) {
            const trimmed = item.trim();
            if (trimmed) interests.push({ name: trimmed, keywords: [] });
          }
        }
      }
    }

    this.output.interests = interests;
  }

  private processRecommendationsCSV(content: string): void {
    const { headers, rows } = parseCSVBlock(content);

    const references = rows
      .map((row) => {
        const map = rowToMap(headers, row);
        const displayStatus = map.DisplayStatus ?? map.displayStatus ?? "";
        const recommenderFirstName =
          map.RecommenderFirstName ??
          map.recommenderFirstName ??
          map.FirstName ??
          "";
        const recommenderLastName =
          map.RecommenderLastName ??
          map.recommenderLastName ??
          map.LastName ??
          "";
        const recommenderCompany =
          map.RecommenderCompany ?? map.recommenderCompany ?? map.Company ?? "";
        const recommenderTitle = map.RecommenderTitle ?? map.Title ?? "";
        const recommendationBody =
          map.RecommendationBody ??
          map.recommendationBody ??
          map.Body ??
          map.Description ??
          "";

        return {
          recommenderFirstName,
          recommenderLastName,
          recommenderCompany,
          recommenderTitle,
          recommendationBody,
          recommendationDate: "",
          displayStatus,
        };
      })
      .filter((r) => r.displayStatus === "VISIBLE");

    this.output.references = references.map((r) => ({
      name: `${r.recommenderFirstName} ${r.recommenderLastName} - ${r.recommenderCompany}`,
      reference: r.recommendationBody,
    }));
  }

  private processEndorsementsCSV(content: string): void {
    const { headers, rows } = parseCSVBlock(content);

    // Accumulate endorsement counts by skill name
    const endorsements: Map<string, number> = new Map();
    for (const row of rows) {
      const map = rowToMap(headers, row);
      const name = map.Name ?? map.name ?? map.Skill ?? "";
      if (name) {
        endorsements.set(name, (endorsements.get(name) ?? 0) + 1);
      }
    }

    // Merge into existing skills
    const existing = this.output.skills ?? [];
    const processed = new Set<string>();

    for (const skill of existing) {
      const level = endorsements.get(skill.name);
      if (level !== undefined) {
        skill.level = String(level);
        processed.add(skill.name);
      }
    }

    // Add any endorsed skills that aren't in the skills list
    for (const [name, level] of endorsements) {
      if (!processed.has(name)) {
        existing.push({ name, level: String(level), keywords: [] });
        processed.add(name);
      }
    }

    // Sort by level descending
    existing.sort((a, b) => Number(b.level) - Number(a.level));
    this.output.skills = existing;
  }

  private processOrganizationsCSV(content: string): void {
    const { headers, rows } = parseCSVBlock(content);

    const volunteer = rows.map((row) => {
      const map = rowToMap(headers, row);
      const rawStart = map.Started ?? map.StartedOn ?? "";
      const rawEnd = map.Ended ?? map.FinishedOn ?? "";

      const entry: VolunteerEntry = {
        organization: map.Name ?? map.name ?? "",
        position: map.Position ?? map.position ?? "",
        startDate: parseLinkedInDate(rawStart) ?? rawStart,
        summary: map.Description ?? map.description ?? "",
      };

      if (rawEnd) {
        entry.endDate = parseLinkedInDate(rawEnd) ?? rawEnd;
      }

      return entry;
    });

    // Sort by startDate descending
    this.output.volunteer = volunteer.sort((a, b) =>
      b.startDate.localeCompare(a.startDate),
    );
  }

  private processVolunteeringCSV(content: string): void {
    const { headers, rows } = parseCSVBlock(content);

    const volunteer = rows.map((row) => {
      const map = rowToMap(headers, row);
      const rawStart = map.Started ?? map.StartedOn ?? "";
      const rawEnd = map.Ended ?? map.FinishedOn ?? "";

      const entry: VolunteerEntry = {
        organization: map.Company ?? map.CompanyName ?? map.companyName ?? "",
        position: map.Role ?? map.role ?? "",
        startDate: parseLinkedInDate(rawStart) ?? rawStart,
        summary: map.Description ?? map.description ?? "",
      };

      if (rawEnd) {
        entry.endDate = parseLinkedInDate(rawEnd) ?? rawEnd;
      }

      return entry;
    });

    // Merge with organizations volunteer entries
    const current = this.output.volunteer ?? [];
    this.output.volunteer = [...current, ...volunteer].sort((a, b) =>
      b.startDate.localeCompare(a.startDate),
    );
  }

  private processCoursesCSV(content: string): void {
    // Courses are not part of the JSON Resume top-level schema.
    // They could be added to individual education entries, but without
    // a clear mapping from the CSV data, we skip them.
    void content;
  }

  private processFollowsCSV(content: string): void {
    const { headers, rows } = parseCSVBlock(content);

    const interests: Interest[] = [];
    for (const row of rows) {
      const map = rowToMap(headers, row);
      const name = map.Name ?? map.name ?? "";
      if (name) {
        interests.push({ name, keywords: [] });
      }
    }

    // Merge with existing interests
    const current = this.output.interests ?? [];
    for (const interest of interests) {
      if (!current.some((i) => i.name === interest.name)) {
        current.push(interest);
      }
    }
    this.output.interests = current;
  }
}

export default Processor;
