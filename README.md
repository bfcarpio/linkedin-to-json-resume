LinkedIn to JSON Résumé
=======================

This is a small site that allows you to generate a JSON output compatible with [JSON Résumé](http://jsonresume.org/) (version 0.0.0) from your LinkedIn profile. **Try the demo on [https://jmperezperez.com/linkedin-to-json-resume/](https://jmperezperez.com/linkedin-to-json-resume/)**

You first need to download a copy of your data through the [LinkedIn's Data Export Page](https://www.linkedin.com/settings/data-export-page), then select that file from this project page.

<a href="https://linkedin-json-resume.surge.sh/linkedin.png" target="_blank"><img src="https://linkedin-json-resume.surge.sh/linkedin.png" width="497" height="317" alt="Screenshot of LinkedIn Data Export"></a>

## LinkedIn API?

Due to some changes in the LinkedIn API the exporter will no longer have access to the user's full profile from LinkedIn nor contact information. Unfortunately there is no way for this app to ask for that data through the LinkedIn OAuth gateway anymore. See https://github.com/JMPerez/linkedin-to-json-resume/issues/10

## Running it locally

Just start a server and browse the files. You don't need to install anything to run it if you are not going to make changes in the code.

## Developing

Install the dependencies running:

`npm install`

To start developing run:

`npm run start`

To build the project in production mode run:

`npm run build`

and serve the files from the `dist` folder.

## Performance

Benchmarked against the original Parcel-based CLI using [hyperfine](https://github.com/sharkdp/hyperfine) (10 runs, 3 warmup):

| CLI                        | Mean        | Min         | Max          | Std Dev    |
| -------------------------- | ----------- | ----------- | ------------ | ---------- |
| Master (Parcel + Node)     | 145.3 ms    | 104.3 ms    | 177.0 ms     | 21.6 ms    |
| **Modernize (tsup + Bun)** | **89.8 ms** | **77.0 ms** | **107.8 ms** | **9.7 ms** |

The modernized CLI is **~38% faster** on average with **2× less variance**. Even the modernize max (107.8ms) is close to the master min (104.3ms).

## Using the CLI

You can also use the command-line interface to convert your LinkedIn export file.

`npm run cli path/to/your/linkedin-export.zip`

This will generate a `resume.json` file in your current directory.
