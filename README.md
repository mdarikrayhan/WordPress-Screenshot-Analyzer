# 🧠 Task: Develop a TypeScript Utility Module for Screenshot & Image Analysis

## Goal
Create a **TypeScript module** (a single `.ts` file) that can be easily imported into an existing project.  
This module should expose a main function that accepts **either a URL or an image file**, and returns structured JSON data describing the result.

No Express API or HTTP routing should be included — just a reusable TypeScript utility.

---

## ✅ Implementation Complete

### Project Structure
```
tsapi/
├── screenshotAnalyzer.ts    # Main utility module
├── example.ts               # Usage examples
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript configuration
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Run examples:**
   ```bash
   npm run example
   ```

### Main Function
Export a single asynchronous function:

```ts
async function processInput(input: { url?: string; imagePath?: string }): Promise<ProcessingResult>
```

⸻

## 📋 Functional Requirements

### 1. When a URL is provided
- Uses Puppeteer to:
  - Visit the URL
  - Capture a screenshot of the page
  - Return an object containing:
    - The screenshot as a Base64 string
    - Page metadata: title, URL, timestamp

### 2. When an image is provided
- Uses the OpenAI API (with OPENAI_API_KEY from environment variables) to:
  - Describe the content of the image
  - Identify possible issues or errors (e.g., low quality, text errors, poor composition)
  - Return a structured JSON summary

### 3. Return Format

The function returns an object like:

```ts
interface ProcessingResult {
  type: "url" | "image";
  data?: {
    screenshotBase64?: string;
    metadata?: { title: string; url: string; timestamp: string };
  };
  analysis?: {
    description: string;
    issues: string[];
  };
  error?: string;
}
```

**Example response:**
```json
{
  "type": "url",
  "data": {
    "screenshotBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "metadata": {
      "title": "Example Website",
      "url": "https://example.com",
      "timestamp": "2025-10-10T04:00:00Z"
    }
  }
}
```

⸻

## 🧩 Implementation Details

### Dependencies
- `puppeteer` (for screenshots)
- `openai` (for image analysis)
- `fs` and `path` (for reading local image files)
- `dotenv` (for environment variables)

### Environment Variables
Create a `.env` file with:
```
OPENAI_API_KEY=your_api_key_here
```

### Expected Usage Example

```typescript
import { processInput } from "./screenshotAnalyzer";

(async () => {
  // Capture screenshot from URL
  const result1 = await processInput({ url: "https://example.com" });
  console.log(result1);

  // Analyze local image
  const result2 = await processInput({ imagePath: "./test-image.png" });
  console.log(result2);
})();
```

⸻

## 🛠️ Features

- ✅ **Input Validation**: Ensures exactly one of `url` or `imagePath` is provided
- ✅ **Error Handling**: Catches and returns errors gracefully inside the result object
- ✅ **Self-contained**: No external Express or API logic
- ✅ **Strictly Typed**: Full TypeScript type safety and production-ready code
- ✅ **JSDoc Comments**: Comprehensive documentation for all exported functions and interfaces
- ✅ **Screenshot Capture**: Full-page screenshots with metadata extraction
- ✅ **Image Analysis**: AI-powered content description and issue detection
- ✅ **Multiple Image Formats**: Supports PNG, JPEG, GIF, WebP, and BMP

## 🚀 API Reference

### Main Function

```typescript
processInput(input: ProcessInputOptions): Promise<ProcessingResult>
```

Processes either a URL (screenshot) or an image file (analysis).

**Parameters:**
- `input.url` (optional): URL to capture screenshot from
- `input.imagePath` (optional): Path to local image file to analyze

**Returns:** Promise resolving to `ProcessingResult`

### Types

```typescript
interface ProcessInputOptions {
  url?: string;
  imagePath?: string;
}

interface ProcessingResult {
  type: 'url' | 'image';
  data?: ScreenshotData;
  analysis?: ImageAnalysis;
  error?: string;
}

interface ScreenshotData {
  screenshotBase64: string;
  metadata: PageMetadata;
}

interface ImageAnalysis {
  description: string;
  issues: string[];
}
```

## 📦 Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Watch mode for development
- `npm run example` - Run the example usage file

⸻

## 📝 Notes

- The module validates that exactly one of `url` or `imagePath` is provided
- All errors are caught and returned gracefully inside the result object
- The file is fully self-contained with no external Express or API logic
- TypeScript is strictly typed and production-ready
- Includes comprehensive JSDoc comments for all exported functions and interfaces

**Deliverable:** 
A single TypeScript file named `screenshotAnalyzer.ts` that can be dropped into any Node.js project and used immediately.
