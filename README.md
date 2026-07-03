# LinkedIn to JSON Résumé
[![CI](https://github.com/bfcarpio/linkedin-to-json-resume/actions/workflows/ci.yml/badge.svg)](https://github.com/bfcarpio/linkedin-to-json-resume/actions/workflows/ci.yml)
[![GitHub Pages](https://github.com/bfcarpio/linkedin-to-json-resume/actions/workflows/gh-pages.yml/badge.svg)](https://github.com/bfcarpio/linkedin-to-json-resume/actions/workflows/gh-pages.yml)


Converts LinkedIn profile exports into standardized [JSON Résumé](http://jsonresume.org/) format (v0.0.0).

## Live Demo

https://bfcarpio.github.io/linkedin-to-json-resume/

## Performance

Benchmarked against the original Parcel-based CLI using [hyperfine](https://github.com/sharkdp/hyperfine) (10 runs, 3 warmup):

| CLI                        | Mean        | Min         | Max          | Std Dev    |
| -------------------------- | ----------- | ----------- | ------------ | ---------- |
| Master (Parcel + Node)     | 145.3 ms    | 104.3 ms    | 177.0 ms     | 21.6 ms    |
| **Modernize (tsup + Bun)** | **89.8 ms** | **77.0 ms** | **107.8 ms** | **9.7 ms** |

The modernized CLI is **~38% faster** on average with **2× less variance**.

## Quick Start (web app)

1. Download your data from [LinkedIn's Data Export Page](https://www.linkedin.com/settings/data-export-page)
1. Drag and drop your LinkedIn export ZIP
1. Download your `resume.json`

## CLI Usage

```bash
bunx github:bfcarpio/linkedin-to-json-resume <path-to-export.zip>
```

Outputs `resume.json` to the current directory.

## Development

**Prerequisites:** Bun v1.3.14+, Node v22+

```bash
# Install dependencies
bun install

# Build everything (web + CLI)
bun run build

# Run tests
bun test

# Lint
bun run lint

# Serve web app locally
bun run dev

# Clean build artifacts
bun run clean

# Run CLI against a test export
bun run cli <path-to-export.zip>
```

## Tech Stack

- **Runtime/Build**: Bun (Node-compatible output)
- **Bundler**: tsup
- **Linter/Formatter**: Biome
- **Tests**: bun:test
- **Dependencies**: fflate (ZIP extraction)

## How It Works

Parses LinkedIn's CSV data export (Profile, Positions, Education, Skills, Languages, Projects, etc.) and maps each field to the JSON Résumé schema. The web app runs entirely in the browser — no data is sent to a server.

## License

MIT

## Acknowledgments

Based on the original [linkedin-to-json-resume](https://github.com/JMPerez/linkedin-to-json-resume) by [JMPerez](https://github.com/JMPerez).
