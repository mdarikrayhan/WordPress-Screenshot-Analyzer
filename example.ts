import { processInput } from './screenshotAnalyzer';

/**
 * Example usage of the screenshotAnalyzer module
 */
async function runExamples() {
  console.log('🚀 Starting screenshot analyzer examples...\n');

  // Example 1: Capture screenshot from URL
  console.log('📸 Example 1: Capturing screenshot from URL');
  try {
    const result1 = await processInput({ url: 'https://github.com' });

    if (result1.error) {
      console.error('❌ Error:', result1.error);
    } else if (result1.data) {
      console.log('✅ Success! Screenshot captured');
      console.log('📄 Page title:', result1.data.metadata.title);
      console.log('🔗 URL:', result1.data.metadata.url);
      console.log('⏰ Timestamp:', result1.data.metadata.timestamp);
      console.log('📊 Screenshot size:', result1.data.screenshotBase64.length, 'characters (base64)');
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Example 2: Analyze a local image (uncomment and provide a real image path)
  console.log('🔍 Example 2: Analyzing local image');
  console.log('⚠️  Note: This example requires a valid image file and OPENAI_API_KEY');

  // Uncomment the following lines and provide a valid image path to test:
  /*
  try {
    const result2 = await processInput({ imagePath: './test-image.png' });
    
    if (result2.error) {
      console.error('❌ Error:', result2.error);
    } else if (result2.analysis) {
      console.log('✅ Success! Image analyzed');
      console.log('📝 Description:', result2.analysis.description);
      console.log('⚠️  Issues found:');
      result2.analysis.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
  */

  console.log('\n🎉 Examples completed!');
}

// Run examples
if (require.main === module) {
  runExamples().catch(console.error);
}
