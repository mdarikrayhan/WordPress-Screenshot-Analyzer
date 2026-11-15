# WordPress Screenshot Analyzer

A small TypeScript module that does two things through one function, `processInput`. Given a URL, it opens the page in headless Chromium with Playwright and returns a screenshot as Base64 along with the page title and a timestamp. Given an image file, it sends the image to OpenAI's `gpt-4o` with a prompt asking for a WordPress troubleshooting report: the detected issue, its likely cause, step-by-step fix, a plugin or automation suggestion, and the expected outcome. A separate `workflow.ts` script chains the two steps so you can screenshot a site and diagnose it in one go. It was written in October 2025 to a task brief that asked for one importable module with no Express server or HTTP routing.

## Features

- **One entry point:** `processInput({ url })` captures a screenshot, and `processInput({ imagePath })` analyses an image.
- **Input validation:** exactly one of `url` or `imagePath` must be given, and neither may be empty.
- **No thrown errors:** errors, such as a missing file or a missing `OPENAI_API_KEY`, come back in the result's `error` field instead of being thrown.
- **Screenshots:** a 1280×720 viewport, captured two seconds after the DOM has loaded.
- **Image formats:** `.png`, `.jpg`/`.jpeg`, `.gif`, `.webp` and `.bmp`. Any other extension is sent labelled as PNG.
- **Analysis output:** if the model replies with JSON, `analysis.description` and `analysis.issues` are filled from it. The prompt asks for a plain-text report, though, so normally the whole reply ends up in `description` and `issues` stays empty.
- **`workflow.ts`:** takes a website URL, an image URL or a local image path. Website URLs are screenshotted first, and image URLs are downloaded. The script then prints the diagnosis and deletes its temporary file.

## Tech stack

- TypeScript (strict mode, compiled to CommonJS)
- Playwright (Chromium) for screenshots
- OpenAI Node SDK (`gpt-4o`) for image analysis
- dotenv for configuration
- ts-node for running the scripts

## Getting started

1. Install the dependencies and Playwright's Chromium:

   ```bash
   npm install
   npx playwright install chromium
   ```

2. Create a `.env` file with your OpenAI key. It's only needed for image analysis.

   ```
   OPENAI_API_KEY=your_api_key_here
   ```

3. Run the scripts:

   | Command | What it does |
   | --- | --- |
   | `npm run build` | Compiles the TypeScript to `dist/` |
   | `npm run dev` | Compiles in watch mode |
   | `npm run example` | Runs [example.ts](example.ts), which screenshots https://github.com. The image example in that file is commented out. |
   | `npm test` | Runs [test.ts](test.ts), five input-validation checks |
   | `npx ts-node workflow.ts <url-or-image>` | Screenshots and diagnoses a site, or diagnoses an image. Without an argument it uses https://google.com. |

   For example, `npx ts-node workflow.ts ./image.png` analyses the bundled sample, [image.png](image.png), a page showing WordPress's "Error establishing a database connection".

## Usage

```ts
import { processInput } from "./screenshotAnalyzer";

(async () => {
  const shot = await processInput({ url: "https://example.com" });
  console.log(shot.data?.metadata.title, shot.data?.screenshotBase64.length);

  const report = await processInput({ imagePath: "./image.png" });
  console.log(report.analysis?.description);
})();
```

The result has this shape:

```ts
interface ProcessingResult {
  type: "url" | "image";
  data?: {
    screenshotBase64: string;
    metadata: { title: string; url: string; timestamp: string };
  };
  analysis?: { description: string; issues: string[] };
  error?: string;
}
```

## Project structure

```
screenshotAnalyzer.ts   the module: processInput and its exported types
workflow.ts             screenshot-then-analyse script (also exports ScreenshotAndAnalysis)
example.ts              usage example
test.ts                 input-validation tests
image.png               sample screenshot of a WordPress database error
.env.example            environment variable template
```

## Author

Md Arik Rayhan — [mdarikrayhan.com](https://mdarikrayhan.com)
