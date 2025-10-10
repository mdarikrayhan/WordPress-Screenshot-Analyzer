import puppeteer, { LaunchOptions } from 'puppeteer';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Input parameters for the processInput function.
 * Exactly one of url or imagePath must be provided.
 */
export interface ProcessInputOptions {
  /** URL to capture screenshot from */
  url?: string;
  /** Path to local image file to analyze */
  imagePath?: string;
}

/**
 * Metadata about a captured webpage screenshot
 */
export interface PageMetadata {
  /** Title of the webpage */
  title: string;
  /** URL of the webpage */
  url: string;
  /** ISO timestamp when screenshot was captured */
  timestamp: string;
}

/**
 * Screenshot data containing the image and metadata
 */
export interface ScreenshotData {
  /** Base64 encoded screenshot image */
  screenshotBase64: string;
  /** Metadata about the captured page */
  metadata: PageMetadata;
}

/**
 * Analysis result from OpenAI image analysis
 */
export interface ImageAnalysis {
  /** Description of the image content */
  description: string;
  /** List of identified issues or problems */
  issues: string[];
}

/**
 * Result returned by the processInput function
 */
export interface ProcessingResult {
  /** Type of processing performed */
  type: 'url' | 'image';
  /** Screenshot data (when type is 'url') */
  data?: ScreenshotData;
  /** Image analysis result (when type is 'image') */
  analysis?: ImageAnalysis;
  /** Error message if processing failed */
  error?: string;
}

/**
 * Captures a screenshot of the specified URL using Puppeteer
 * @param url - The URL to capture
 * @returns Promise resolving to screenshot data
 */
async function captureScreenshot(url: string): Promise<ScreenshotData> {
  let browser;
  
  // Try multiple browser launch strategies
  const launchConfigs: LaunchOptions[] = [
    // Strategy 1: Use system Chrome
    {
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    },
    // Strategy 2: Default Puppeteer Chrome
    {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--no-first-run'
      ]
    }
  ];

  let lastError: Error | null = null;
  
  for (let i = 0; i < launchConfigs.length; i++) {
    try {
      console.log(`Trying browser configuration ${i + 1}/${launchConfigs.length}...`);
      browser = await puppeteer.launch(launchConfigs[i]);
      console.log(`✅ Browser launched successfully with config ${i + 1}`);
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Browser launch failed');
      console.log(`❌ Config ${i + 1} failed:`, lastError.message);
      continue;
    }
  }
  
  if (!browser) {
    throw new Error(`Failed to launch browser with any configuration. Last error: ${lastError?.message}`);
  }

  try {
    const page = await browser.newPage();

    // Set reasonable timeouts
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    // Set viewport for consistent screenshots
    await page.setViewport({ width: 1280, height: 720 });

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log(`Navigating to: ${url}`);
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    // Wait for page to stabilize using delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get page title
    const title = await page.title() || 'Untitled Page';
    console.log(`Page loaded successfully. Title: ${title}`);

    // Capture screenshot
    console.log('Capturing screenshot...');
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false
    });

    console.log(`Screenshot captured successfully! Size: ${screenshot.length} bytes`);

    // Convert to base64
    const screenshotBase64 = Buffer.from(screenshot).toString('base64');

    return {
      screenshotBase64,
      metadata: {
        title,
        url,
        timestamp: new Date().toISOString()
      }
    };
  } finally {
    if (browser) {
      await browser.close();
      console.log('Browser closed');
    }
  }
}

/**
 * Analyzes an image using OpenAI's vision capabilities
 * @param imagePath - Path to the image file
 * @returns Promise resolving to image analysis
 */
async function analyzeImage(imagePath: string): Promise<ImageAnalysis> {
  // Check if image file exists first
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`);
  }

  // Check if OpenAI API key is available
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required for image analysis');
  }

  // Read and encode image
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = getMimeType(imagePath);

  const openai = new OpenAI({
    apiKey: apiKey
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze this image and provide:
1. A detailed description of what you see in the image
2. Identify any potential issues, errors, or quality problems such as:
   - Low image quality or resolution
   - Text that appears incorrect or has spelling errors
   - Poor composition or framing
   - Technical issues (blurry, pixelated, corrupted)
   - UI/UX problems if it's a screenshot
   - Any other notable issues

Please respond in JSON format with "description" and "issues" fields, where issues is an array of strings.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response received from OpenAI');
    }

    // Try to parse JSON response
    try {
      const parsed = JSON.parse(content);
      return {
        description: parsed.description || 'No description provided',
        issues: Array.isArray(parsed.issues) ? parsed.issues : []
      };
    } catch (parseError) {
      // If JSON parsing fails, treat the entire response as description
      return {
        description: content,
        issues: []
      };
    }
  } catch (error) {
    throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Determines the MIME type of an image file based on its extension
 * @param filePath - Path to the image file
 * @returns MIME type string
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.bmp':
      return 'image/bmp';
    default:
      return 'image/png'; // Default fallback
  }
}

/**
 * Validates input parameters to ensure exactly one of url or imagePath is provided
 * @param input - Input options to validate
 * @throws Error if validation fails
 */
function validateInput(input: ProcessInputOptions): void {
  const hasUrl = input.url !== undefined;
  const hasImagePath = input.imagePath !== undefined;

  if (!hasUrl && !hasImagePath) {
    throw new Error('Either url or imagePath must be provided');
  }

  if (hasUrl && hasImagePath) {
    throw new Error('Only one of url or imagePath should be provided, not both');
  }

  if (hasUrl && (!input.url || input.url.trim() === '')) {
    throw new Error('URL cannot be empty');
  }

  if (hasImagePath && (!input.imagePath || input.imagePath.trim() === '')) {
    throw new Error('Image path cannot be empty');
  }
}

/**
 * Main function that processes either a URL (screenshot) or an image file (analysis).
 * 
 * @param input - Configuration object containing either a URL or image path
 * @param input.url - Optional URL to capture screenshot from
 * @param input.imagePath - Optional path to local image file to analyze
 * @returns Promise resolving to processing result with screenshot data or image analysis
 * 
 * @example
 * ```typescript
 * // Capture screenshot from URL
 * const result1 = await processInput({ url: "https://example.com" });
 * console.log(result1.data?.screenshotBase64);
 * 
 * // Analyze local image
 * const result2 = await processInput({ imagePath: "./image.png" });
 * console.log(result2.analysis?.description);
 * ```
 */
export async function processInput(input: ProcessInputOptions): Promise<ProcessingResult> {
  try {
    // Validate input parameters
    validateInput(input);

    if (input.url) {
      // Process URL - capture screenshot
      const data = await captureScreenshot(input.url);
      return {
        type: 'url',
        data
      };
    } else if (input.imagePath) {
      // Process image - analyze with OpenAI
      const analysis = await analyzeImage(input.imagePath);
      return {
        type: 'image',
        analysis
      };
    } else {
      // This should never happen due to validation, but TypeScript requires it
      throw new Error('Invalid input configuration');
    }
  } catch (error) {
    // Return error in result object instead of throwing
    let errorMessage: string;
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = `Unknown error occurred: ${JSON.stringify(error)}`;
    }

    return {
      type: input.url ? 'url' : 'image',
      error: errorMessage
    };
  }
}