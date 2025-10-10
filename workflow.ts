import { processInput } from './screenshotAnalyzer';
import { config } from 'dotenv';
import * as fs from 'fs';

config();

/**
 * Demo script showing the complete Website screenshot + OpenAI analysis workflow
 */
async function ScreenshotAndAnalysis(url: string) {
  try {
    const screenshotResult = await processInput({ url });

    if (screenshotResult.error || !screenshotResult.data) {
      throw new Error(`Screenshot failed: ${screenshotResult.error}`);
    }

    // Step 2: Save temporarily and analyze with OpenAI
    const tempPath = './temp-Website.png';
    fs.writeFileSync(tempPath, Buffer.from(screenshotResult.data.screenshotBase64, 'base64'));

    const analysisResult = await processInput({ imagePath: tempPath });

    if (analysisResult.error || !analysisResult.analysis) {
      throw new Error(`Analysis failed: ${analysisResult.error}`);
    }

    console.log(analysisResult.analysis.description);

    // Cleanup
    fs.unlinkSync(tempPath);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Only run if called directly
if (require.main === module) {
  const url = process.argv[2] || 'https://google.com';
  ScreenshotAndAnalysis(url).catch(console.error);
}

export { ScreenshotAndAnalysis };
