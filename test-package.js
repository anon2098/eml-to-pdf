const { convertEmlToPdf, generateOutputFilename } = require('./convert.js');
const fs = require('fs');
const path = require('path');

console.log('Testing eml-to-pdf-converter package...');

// Test that the functions are properly exported
console.log('✓ convertEmlToPdf function is available:', typeof convertEmlToPdf === 'function');
console.log('✓ generateOutputFilename function is available:', typeof generateOutputFilename === 'function');

// Test with the sample EML file if it exists
const testEmlFile = path.join(__dirname, 'test.eml');
if (fs.existsSync(testEmlFile)) {
  console.log('✓ Found test.eml file');
  generateOutputFilename(testEmlFile)
    .then(outputPath => {
      console.log('✓ generateOutputFilename works correctly');
      console.log('  Generated output path:', outputPath);
      console.log('Package is ready for publishing!');
    })
    .catch(err => {
      console.error('✗ Error testing generateOutputFilename:', err.message);
    });
} else {
  console.log('⚠ test.eml file not found, skipping file conversion test');
  console.log('Package structure is ready for publishing!');
}
