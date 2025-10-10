import { processInput } from './screenshotAnalyzer';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import https from 'https';
import http from 'http';

config();

/**
 * Downloads an image from a URL to a local file
 */
async function downloadImage(imageUrl: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = imageUrl.startsWith('https') ? https : http;

    client
      .get(imageUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`));
          return;
        }

        const fileStream = fs.createWriteStream(outputPath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });

        fileStream.on('error', reject);
      })
      .on('error', reject);
  });
}

/**
 * Determines if the input is a direct image URL or file path
 */
function isImageUrl(input: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const lowercaseInput = input.toLowerCase();

  // Check if it's a URL pointing to an image file
  if (input.startsWith('http')) {
    return (
      imageExtensions.some((ext) => lowercaseInput.includes(ext)) ||
      lowercaseInput.includes('images') ||
      lowercaseInput.includes('image')
    );
  }

  // Check if it's a local file path
  return (
    imageExtensions.some((ext) => lowercaseInput.endsWith(ext)) ||
    (fs.existsSync(input) && fs.lstatSync(input).isFile())
  );
}

/**
 * Enhanced function that handles both website URLs (for screenshot) and image URLs/files (for direct analysis)
 */
async function ScreenshotAndAnalysis(input: string) {

  try {
    let analysisResult;
    let tempPath: string | null = null;

    if (isImageUrl(input)) {

      if (input.startsWith('http')) {
        // Download image from URL
        tempPath = './temp-downloaded-image.jpg';
        await downloadImage(input, tempPath);
        analysisResult = await processInput({ imagePath: tempPath });
      } else {
        // Local image file
        analysisResult = await processInput({ imagePath: input });
      }
    } else {
      // Original workflow: screenshot then analyze
      const screenshotResult = await processInput({ url: input });

      if (screenshotResult.error || !screenshotResult.data) {
        throw new Error(`Screenshot failed: ${screenshotResult.error}`);
      }

      tempPath = './temp-Website.png';
      fs.writeFileSync(tempPath, Buffer.from(screenshotResult.data.screenshotBase64, 'base64'));
      analysisResult = await processInput({ imagePath: tempPath });
    }

    if (analysisResult.error || !analysisResult.analysis) {
      throw new Error(`Analysis failed: ${analysisResult.error}`);
    }

    console.log(analysisResult.analysis.description);

    // Cleanup
    if (tempPath && fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  } catch (error) {
     console.error('❌ Error:', error);
  }
}

// Only run if called directly
if (require.main === module) {
  const input = process.argv[2] || 'https://google.com';
  ScreenshotAndAnalysis(input).catch(console.error);
}

export { ScreenshotAndAnalysis };
