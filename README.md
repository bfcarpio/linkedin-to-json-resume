# LinkedIn to JSON Résumé

[![CI](https://github.com/bfcarpio/linkedin-to-json-resume/actions/workflows/ci.yml/badge.svg)](https://github.com/bfcarpio/linkedin-to-json-resume/actions/workflows/ci.yml)
[![GitHub Pages](https://github.com/bfcarpio/linkedin-to-json-resume/actions/workflows/gh-pages.yml/badge.svg)](https://github.com/bfcarpio/linkedin-to-json-resume/actions/workflows/gh-pages.yml)

Converts LinkedIn profile exports into standardized [JSON Résumé](http://jsonresume.org/) format (v0.0.0).

## Live Demo

https://bfcarpio.github.io/linkedin-to-json-resume/

## Performance

Benchmarked against the original Parcel-based CLI using [hyperfine](https://github.com/sharkdp/hyperfine) (10 runs, 3 warmup):

| CLI                            | Mean        | Min         | Max          | Std Dev    |
| ------------------------------ | ----------- | ----------- | ------------ | ---------- |
| Master (Parcel + Node)         | 145.3 ms    | 104.3 ms    | 177.0 ms     | 21.6 ms    |
| **Modernize (tsup + Node.js)** | **89.8 ms** | **77.0 ms** | **107.8 ms** | **9.7 ms** |

The modernized CLI is **~38% faster** on average with **2× less variance**.

## Quick Start (web app)

1. Download your data from [LinkedIn's Data Export Page](https://www.linkedin.com/settings/data-export-page)
1. Drag and drop your LinkedIn export ZIP
1. Download your `resume.json`

## CLI Usage

```bash
npx github:bfcarpio/linkedin-to-json-resume <path-to-export.zip>
```

Outputs `resume.json` to the current directory.

## Development

**Prerequisites:** Node.js 24+

```bash
# Install dependencies
npm install

# Build everything (web + CLI)
npm run build

# Run tests
node --test

# Lint
npm run lint

# Serve web app locally
npm run dev

# Clean build artifacts
npm run clean

# Run CLI against a test export
npm run cli <path-to-export.zip>
```

## Tech Stack

- **Runtime/Build**: Node.js (ESM)
- **Bundler**: tsup
- **Linter/Formatter**: Biome
- **Tests**: node:test
- **Dependencies**: fflate (ZIP extraction)

## How It Works

Parses LinkedIn's CSV data export (Profile, Positions, Education, Skills, Languages, Projects, etc.) and maps each field to the JSON Résumé schema. The web app runs entirely in the browser — no data is sent to a server.

## License

MIT

## Acknowledgments

Based on the original [linkedin-to-json-resume](https://github.com/JMPerez/linkedin-to-json-resume) by [JMPerez](https://github.com/JMPerez).
