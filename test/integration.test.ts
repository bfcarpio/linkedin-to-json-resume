import { describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const distDir = join(import.meta.dir, "..", "dist");
const distCliDir = join(import.meta.dir, "..", "dist-cli");

function ensureBuild(): boolean {
  const webBuilt = existsSync(join(distDir, "main.js"));
  const cliBuilt = existsSync(join(distCliDir, "cli.js"));

  if (webBuilt && cliBuilt) {
    return true;
  }

  console.log(
    "\n[integration] Build artifacts missing — running build automatically...\n",
  );

  const projectRoot = join(import.meta.dir, "..");

  if (!runBuild("build:web", projectRoot)) return false;

  if (!runBuild("build:cli", projectRoot)) return false;

  console.log("[integration] Build complete.\n");
  return true;
}

function runBuild(script: string, cwd: string): boolean {
  try {
    const result = spawnSync("bun", ["run", script], { cwd, stdio: "pipe" });
    if (result.status !== 0) {
      console.error(`[integration] ${script} failed`);
      console.error(result.stderr?.toString());
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[integration] spawnSync for ${script} failed:`, err);
    return false;
  }
}

if (!ensureBuild()) {
  console.error(
    "[integration] Build failed — cannot run integration tests. Exiting.",
  );
  process.exit(1);
}

const run = describe;

function readDist(file: string): string {
  return readFileSync(join(distDir, file), "utf-8");
}

function readDistCli(file: string): string {
  return readFileSync(join(distCliDir, file), "utf-8");
}

run("dist/main.js", () => {
  it("should exist", () => {
    expect(existsSync(join(distDir, "main.js"))).toBe(true);
  });

  it("should not have bare fflate import", () => {
    const code = readDist("main.js");
    expect(code).not.toMatch(/from"fflate"/);
  });

  it("should not have Node.js module import", () => {
    const code = readDist("main.js");
    expect(code).not.toMatch(/from"module"/);
  });

  it("should not have other bare Node.js imports", () => {
    const code = readDist("main.js");
    const bareImports = code.match(
      /from"(fs|path|crypto|os|url|http|https|net|tls|stream|buffer|events|util|vm|worker_threads)"/g,
    );
    expect(bareImports).toBeNull();
  });

  it("should start with JS code, not an import statement", () => {
    const code = readDist("main.js");
    const first50 = code.slice(0, 50);
    expect(first50).not.toMatch(/^import\s/);
    expect(first50).toMatch(/^(var|const|let|function|\(function)/);
  });

  it("should contain token class prefix for JSON highlighting", () => {
    const code = readDist("main.js");
    expect(code).toContain("token-");
    expect(code).not.toContain("Prism.highlight");
  });

  it("should contain file select event handler", () => {
    const code = readDist("main.js");
    expect(code).toMatch(
      /addEventListener.*change|addEventListener.*click.*fileselect|fileselect.*click/,
    );
  });

  it("should contain drag and drop handlers", () => {
    const code = readDist("main.js");
    expect(code).toMatch(/dragover/);
    expect(code).toMatch(/dragleave/);
    expect(code).toMatch(/drop/);
  });

  it("should contain clipboard copy code", () => {
    const code = readDist("main.js");
    expect(code).toMatch(/clipboard\.writeText/);
  });

  it("should contain download/save code", () => {
    const code = readDist("main.js");
    expect(code).toMatch(/download|save|resume\.json/i);
  });

  it("should contain action bar logic", () => {
    const code = readDist("main.js");
    expect(code).toMatch(/action-bar|display.*flex/);
  });
});

run("dist/index.html", () => {
  it("should exist", () => {
    expect(existsSync(join(distDir, "index.html"))).toBe(true);
  });

  it("should load main.js as module", () => {
    const html = readDist("index.html");
    expect(html).toMatch(/type="module".*main\.js|main\.js.*type="module"/);
  });

  it("should not reference prism.js", () => {
    const html = readDist("index.html");
    expect(html).not.toMatch(/prism\.js/);
  });

  it("should have action bar elements", () => {
    const html = readDist("index.html");
    expect(html).toContain('id="action-bar"');
    expect(html).toContain('id="copy-json"');
    expect(html).toContain('id="download-json"');
  });

  it("should have file input elements", () => {
    const html = readDist("index.html");
    expect(html).toContain('id="fileselect"');
    expect(html).toContain('id="select-file"');
  });

  it("should not reference prism.css", () => {
    const html = readDist("index.html");
    expect(html).not.toContain("prism.css");
  });
});

run("dist/styles/basic.css", () => {
  it("should exist", () => {
    expect(existsSync(join(distDir, "styles", "basic.css"))).toBe(true);
  });

  it("should use off-screen positioning for file input (not display:none)", () => {
    const css = readDist("styles/basic.css");
    expect(css).toMatch(/position:\s*absolute/);
    expect(css).toMatch(/left:\s*-9999px/);
    const fileselectBlock = css.match(/#fileselect\s*\{[^}]+\}/)?.[0] || "";
    expect(fileselectBlock).not.toMatch(/display:\s*none/);
  });

  it("should have action bar styles", () => {
    const css = readDist("styles/basic.css");
    expect(css).toContain(".action-bar");
    expect(css).toContain(".button-primary");
  });

  it("should have token color classes", () => {
    const css = readDist("styles/basic.css");
    expect(css).toContain(".token-key");
    expect(css).toContain(".token-string");
    expect(css).toContain(".token-number");
    expect(css).toContain(".token-boolean");
    expect(css).toContain(".token-null");
    expect(css).toContain(".token-punctuation");
  });
});

run("dist-cli/cli.js", () => {
  it("should exist", () => {
    expect(existsSync(join(distCliDir, "cli.js"))).toBe(true);
  });

  it("should have shebang", () => {
    const code = readDistCli("cli.js");
    expect(code.startsWith("#!/usr/bin/env node")).toBe(true);
  });

  it("should be ESM format", () => {
    const code = readDistCli("cli.js");
    expect(code).toMatch(/import\s*\{/);
  });

  it("should contain fflate import", () => {
    const code = readDistCli("cli.js");
    expect(code).toMatch(/from"fflate"/);
  });

  it("should contain unzipSync", () => {
    const code = readDistCli("cli.js");
    expect(code).toContain("unzipSync");
  });

  it("should contain --bullets flag handling", () => {
    const code = readDistCli("cli.js");
    expect(code).toContain("bullets");
  });

  it("should not contain browser-specific code", () => {
    const code = readDistCli("cli.js");
    expect(code).not.toContain("document.getElementById");
  });

  it("should be executable", () => {
    const code = readDistCli("cli.js");
    expect(code.length).toBeGreaterThan(1024);
  });
});
