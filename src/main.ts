import { unzip } from "fflate";
import { Processor } from "./converter";
import type { Output } from "./converter";
import { highlightJson } from "./json-highlight";

const filedrag = document.getElementById("filedrag");
const fileselect = document.getElementById("fileselect");
const bulletCharsInput = document.getElementById(
  "bullet-chars",
) as HTMLInputElement | null;

function fileDragHover(e: Event): void {
  e.stopPropagation();
  e.preventDefault();
  const target = e.target as HTMLElement;
  target.className = e.type === "dragover" ? "hover" : "";
}

let linkedinToJsonResume: Output | undefined;

const actionBar = document.getElementById("action-bar");
const copyButton = document.getElementById("copy-json");
const downloadButton = document.getElementById("download-json");

copyButton?.addEventListener("click", async () => {
  if (!linkedinToJsonResume) return;
  const json = JSON.stringify(linkedinToJsonResume, undefined, 2);
  await navigator.clipboard.writeText(json);
  copyButton.textContent = "✓ Copied!";
  copyButton.classList.add("copied");
  setTimeout(() => {
    copyButton.textContent = "Copy JSON";
    copyButton.classList.remove("copied");
  }, 2000);
});

downloadButton?.addEventListener("click", async () => {
  if (!linkedinToJsonResume) return;
  const { default: save } = await import("./file");
  save(JSON.stringify(linkedinToJsonResume, undefined, 2), "resume.json");
});

async function* readZipEntries(
  file: File,
): AsyncGenerator<{ filename: string; text: () => Promise<string> }> {
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);

  const contents: Record<string, Uint8Array> = await new Promise(
    (resolve, reject) => {
      unzip(data, (err, zip) => {
        if (err) reject(err);
        else resolve(zip as Record<string, Uint8Array>);
      });
    },
  );

  for (const [filename, content] of Object.entries(contents)) {
    yield {
      filename,
      text: async () => new TextDecoder().decode(content),
    };
  }
}

async function fileSelectHandler(e: Event): Promise<void> {
  fileDragHover(e);

  const target = e.target as HTMLInputElement;
  const droppedFiles = target.files || (e as DragEvent).dataTransfer?.files;
  const file = droppedFiles?.[0];
  if (!file) return;

  // Build multi-section CSV for the Processor
  const lines: string[] = [];

  for await (const entry of readZipEntries(file)) {
    const content = await entry.text();
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed) lines.push(`${entry.filename},${trimmed}`);
    }
  }
  const allContent = lines.length ? `${lines.join("\n")}\n` : "";

  // Process using the new Processor
  let output: unknown;
  const bulletOptions = bulletCharsInput?.value
    ? { bullets: bulletCharsInput.value }
    : undefined;
  const processor = new Processor({
    linkedinToJsonResume: (result) => {
      output = result;
    },
    bulletOptions,
  });
  processor.processFile(allContent);
  linkedinToJsonResume = output as Output;

  if (filedrag) {
    filedrag.innerHTML =
      "Dropped! See the resulting JSON Resume at the bottom.";
  }
  const outputEl = document.getElementById("output");
  if (outputEl) {
    const json = JSON.stringify(output, undefined, 2);
    outputEl.innerHTML = highlightJson(json);
  }
  if (actionBar) {
    actionBar.style.display = "flex";
  }
  const resultEl = document.getElementById("result");
  if (resultEl) {
    resultEl.style.display = "block";
  }
}

fileselect?.addEventListener("change", fileSelectHandler, false);

// Always show drag area (modern browsers all support it)
if (filedrag) {
  filedrag.addEventListener("dragover", fileDragHover, false);
  filedrag.addEventListener("dragleave", fileDragHover, false);
  filedrag.addEventListener("drop", fileSelectHandler, false);
  filedrag.style.display = "block";
}

document.getElementById("select-file")?.addEventListener("click", () => {
  fileselect?.click();
});
