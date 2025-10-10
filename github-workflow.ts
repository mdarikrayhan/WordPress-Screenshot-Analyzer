import { processInput } from './screenshotAnalyzer';
import { config } from 'dotenv';
import * as fs from 'fs';

config();

/**
 * Demo script showing the complete GitHub screenshot + OpenAI analysis workflow
 */
async function githubScreenshotAndAnalysis() {
  console.log('🎯 GITHUB SCREENSHOT + OPENAI ANALYSIS DEMO');
  console.log('═'.repeat(50));

  try {
    // Step 1: Capture GitHub screenshot
    console.log('\n📸 Step 1: Capturing GitHub screenshot...');
    const screenshotResult = await processInput({ url: 'https://github.com' });

    if (screenshotResult.error || !screenshotResult.data) {
      throw new Error(`Screenshot failed: ${screenshotResult.error}`);
    }

    console.log('✅ Screenshot captured successfully!');
    console.log(`📄 Page: ${screenshotResult.data.metadata.title}`);
    console.log(`📊 Size: ${Math.round((screenshotResult.data.screenshotBase64.length * 0.75) / 1024)} KB`);

    // Step 2: Save temporarily and analyze with OpenAI
    const tempPath = './temp-github.png';
    fs.writeFileSync(tempPath, Buffer.from(screenshotResult.data.screenshotBase64, 'base64'));

    console.log('\n🤖 Step 2: Analyzing with OpenAI Vision...');
    const analysisResult = await processInput({ imagePath: tempPath });

    if (analysisResult.error || !analysisResult.analysis) {
      throw new Error(`Analysis failed: ${analysisResult.error}`);
    }

    console.log('✅ Analysis completed!');

    // Step 3: Display results
    console.log('\n📋 OPENAI ANALYSIS RESULTS:');
    console.log('━'.repeat(40));
    console.log(analysisResult.analysis.description);

    if (analysisResult.analysis.issues.length > 0) {
      console.log('\n⚠️  Issues identified:');
      analysisResult.analysis.issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`);
      });
    }

    // Cleanup
    fs.unlinkSync(tempPath);
    console.log('\n🎉 Workflow completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Only run if called directly
if (require.main === module) {
  githubScreenshotAndAnalysis().catch(console.error);
}

export { githubScreenshotAndAnalysis };
