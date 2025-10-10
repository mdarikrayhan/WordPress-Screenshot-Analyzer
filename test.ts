#!/usr/bin/env node

/**
 * Simple test script to verify the module works correctly
 */

import { processInput } from './screenshotAnalyzer';

async function runTests() {
  console.log('🧪 Running basic tests for screenshotAnalyzer...\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Input validation - no parameters
  console.log('Test 1: No parameters provided');
  try {
    const result = await processInput({});
    if (result.error && result.error.includes('Either url or imagePath must be provided')) {
      console.log('✅ PASS - Correctly validates missing parameters');
      passed++;
    } else {
      console.log('❌ FAIL - Should reject empty input');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL - Should return error in result, not throw');
    failed++;
  }

  // Test 2: Input validation - both parameters
  console.log('\nTest 2: Both URL and image path provided');
  try {
    const result = await processInput({
      url: 'https://example.com',
      imagePath: './test.png'
    });
    if (result.error && result.error.includes('Only one of url or imagePath should be provided')) {
      console.log('✅ PASS - Correctly validates conflicting parameters');
      passed++;
    } else {
      console.log('❌ FAIL - Should reject both parameters');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL - Should return error in result, not throw');
    failed++;
  }

  // Test 3: Input validation - empty URL
  console.log('\nTest 3: Empty URL provided');
  try {
    const result = await processInput({ url: '' });
    if (result.error && result.error.includes('URL cannot be empty')) {
      console.log('✅ PASS - Correctly validates empty URL');
      passed++;
    } else {
      console.log('❌ FAIL - Should reject empty URL');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL - Should return error in result, not throw');
    failed++;
  }

  // Test 4: Input validation - empty image path
  console.log('\nTest 4: Empty image path provided');
  try {
    const result = await processInput({ imagePath: '' });
    if (result.error && result.error.includes('Image path cannot be empty')) {
      console.log('✅ PASS - Correctly validates empty image path');
      passed++;
    } else {
      console.log('❌ FAIL - Should reject empty image path');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL - Should return error in result, not throw');
    failed++;
  }

  // Test 5: Non-existent image file
  console.log('\nTest 5: Non-existent image file');
  try {
    const result = await processInput({ imagePath: './non-existent-file.png' });
    if (result.error && result.error.includes('Image file not found')) {
      console.log('✅ PASS - Correctly handles non-existent file');
      passed++;
    } else {
      console.log('❌ FAIL - Should detect non-existent file');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL - Should return error in result, not throw');
    failed++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`🧪 Test Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('🎉 All tests passed! The module is working correctly.');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please review the implementation.');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}
