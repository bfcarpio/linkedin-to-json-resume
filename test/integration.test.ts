import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const distDir = join(import.meta.dirname, "..", "dist");
const distCliDir = join(import.meta.dirname, "..", "dist-cli");

function ensureBuild(): boolean {
  const webBuilt = existsSync(join(distDir, "main.js"));
  const cliBuilt = existsSync(join(distCliDir, "cli.js"));

  if (webBuilt && cliBuilt) {
    return true;
  }

  console.log(
    "\n[integration] Build artifacts missing — running build automatically...\n",
  );

  const projectRoot = join(import.meta.dirname, "..");

  if (!runBuild("build:web", projectRoot)) return false;

  if (!runBuild("build:cli", projectRoot)) return false;

  console.log("[integration] Build complete.\n");
  return true;
}

function runBuild(script: string, cwd: string): boolean {
  try {
    const result = spawnSync("npm", ["run", script], { cwd, stdio: "pipe" });
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
    assert.strictEqual(existsSync(join(distDir, "main.js")), true);
  });

  it("should not have bare fflate import", () => {
    const code = readDist("main.js");
    assert.doesNotMatch(code, /from"fflate"/);
  });

  it("should not have Node.js module import", () => {
    const code = readDist("main.js");
    assert.doesNotMatch(code, /from"module"/);
  });

  it("should not have other bare Node.js imports", () => {
    const code = readDist("main.js");
    const bareImports = code.match(
      /from"(fs|path|crypto|os|url|http|https|net|tls|stream|buffer|events|util|vm|worker_threads)"/g,
    );
    assert.strictEqual(bareImports, null);
  });

  it("should start with JS code, not an import statement", () => {
    const code = readDist("main.js");
    const first50 = code.slice(0, 50);
    assert.doesNotMatch(first50, /^import\s/);
    assert.match(first50, /^(var|const|let|function|\(function)/);
  });

  it("should contain token class prefix for JSON highlighting", () => {
    const code = readDist("main.js");
    assert.ok(code.includes("token-"));
    assert.ok(!code.includes("Prism.highlight"));
  });

  it("should contain file select event handler", () => {
    const code = readDist("main.js");
    assert.match(code,
      /addEventListener.*change|addEventListener.*click.*fileselect|fileselect.*click/,
    );
  });

  it("should contain drag and drop handlers", () => {
    const code = readDist("main.js");
    assert.match(code, /dragover/);
    assert.match(code, /dragleave/);
    assert.match(code, /drop/);
  });

  it("should contain clipboard copy code", () => {
    const code = readDist("main.js");
    assert.match(code, /clipboard\.writeText/);
  });

  it("should contain download/save code", () => {
    const code = readDist("main.js");
    assert.match(code, /download|save|resume\.json/i);
  });

  it("should contain action bar logic", () => {
    const code = readDist("main.js");
    assert.match(code, /action-bar|display.*flex/);
  });
});

run("dist/index.html", () => {
  it("should exist", () => {
    assert.strictEqual(existsSync(join(distDir, "index.html")), true);
  });

  it("should load main.js as module", () => {
    const html = readDist("index.html");
    assert.match(html, /type="module".*main\.js|main\.js.*type="module"/);
  });

  it("should not reference prism.js", () => {
    const html = readDist("index.html");
    assert.doesNotMatch(html, /prism\.js/);
  });

  it("should have action bar elements", () => {
    const html = readDist("index.html");
    assert.ok(html.includes('id="action-bar"'));
    assert.ok(html.includes('id="copy-json"'));
    assert.ok(html.includes('id="download-json"'));
  });

  it("should have file input elements", () => {
    const html = readDist("index.html");
    assert.ok(html.includes('id="fileselect"'));
    assert.ok(html.includes('id="select-file"'));
  });

  it("should not reference prism.css", () => {
    const html = readDist("index.html");
    assert.ok(!html.includes("prism.css"));
  });
});

run("dist/styles/basic.css", () => {
  it("should exist", () => {
    assert.strictEqual(existsSync(join(distDir, "styles", "basic.css")), true);
  });

  it("should use off-screen positioning for file input (not display:none)", () => {
    const css = readDist("styles/basic.css");
    assert.match(css, /position:\s*absolute/);
    assert.match(css, /left:\s*-9999px/);
    const fileselectBlock = css.match(/#fileselect\s*\{[^}]+\}/)?.[0] || "";
    assert.doesNotMatch(fileselectBlock, /display:\s*none/);
  });

  it("should have action bar styles", () => {
    const css = readDist("styles/basic.css");
    assert.ok(css.includes(".action-bar"));
    assert.ok(css.includes(".button-primary"));
  });

  it("should have token color classes", () => {
    const css = readDist("styles/basic.css");
    assert.ok(css.includes(".token-key"));
    assert.ok(css.includes(".token-string"));
    assert.ok(css.includes(".token-number"));
    assert.ok(css.includes(".token-boolean"));
    assert.ok(css.includes(".token-null"));
    assert.ok(css.includes(".token-punctuation"));
  });
});

run("dist-cli/cli.js", () => {
  it("should exist", () => {
    assert.strictEqual(existsSync(join(distCliDir, "cli.js")), true);
  });

  it("should have shebang", () => {
    const code = readDistCli("cli.js");
    assert.strictEqual(code.startsWith("#!/usr/bin/env node"), true);
  });

  it("should be ESM format", () => {
    const code = readDistCli("cli.js");
    assert.match(code, /import\s*\{/);
  });

  it("should contain fflate import", () => {
    const code = readDistCli("cli.js");
    assert.match(code, /from"fflate"/);
  });

  it("should contain unzipSync", () => {
    const code = readDistCli("cli.js");
    assert.ok(code.includes("unzipSync"));
  });

  it("should contain --bullets flag handling", () => {
    const code = readDistCli("cli.js");
    assert.ok(code.includes("bullets"));
  });

  it("should not contain browser-specific code", () => {
    const code = readDistCli("cli.js");
    assert.ok(!code.includes("document.getElementById"));
  });

  it("should be executable", () => {
    const code = readDistCli("cli.js");
    assert.ok(code.length > 1024);
  });
});
