import { readFile } from "node:fs/promises";
import { exit } from "node:process";
import { unzipSync } from "fflate";
import type { ParseBulletsOptions } from "./bullet-parser";
import { Processor } from "./converter";

async function processZip(
  zipPath: string,
  bulletOptions?: ParseBulletsOptions,
): Promise<void> {
  const data = await readFile(zipPath);
  const zip = unzipSync(new Uint8Array(data));

  const lines: string[] = [];

  for (const [filename, content] of Object.entries(zip)) {
    if (!filename.endsWith(".csv")) continue;
    const text = new TextDecoder().decode(content as Uint8Array);
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (trimmed) {
        lines.push(`${filename},${trimmed}`);
      }
    }
  }

  const allContent = `${lines.join("\n")}\n`;

  if (!allContent) throw new Error("No CSV files found in archive");

  const processor = new Processor({
    linkedinToJsonResume: (output: unknown) => {
      process.stdout.write(JSON.stringify(output, undefined, 2));
    },
    bulletOptions,
  });
  processor.processFile(allContent);
}

// Main
const args = process.argv.slice(2);
const bulletFlag = args.find((a) => a.startsWith("--bullets="));
const customBullets = bulletFlag?.split("=")[1];

const zipFile = args.find((a) => !a.startsWith("--"));
if (!zipFile) {
  console.error(
    'Usage: npx linkedin-to-json-resume <linkedin-export.zip> [--bullets="•➲-"]',
  );
  exit(1);
}

const bulletOptions: ParseBulletsOptions | undefined = customBullets
  ? { bullets: customBullets }
  : undefined;

processZip(zipFile, bulletOptions)
  .then(() => exit(0))
  .catch((err: Error) => {
    console.error(err.message);
    exit(1);
  });
