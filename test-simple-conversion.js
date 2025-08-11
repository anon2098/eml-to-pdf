#!/usr/bin/env node

const { convertEmlToPdf, generateOutputFilename } = require('./convert');
const fs = require('fs');
const path = require('path');

// Test with an EML file that has attachments
// Replace this path with your actual EML file that has attachments
const testEmlFile = "/Users/admin/Desktop/Test email folder/_1bDaZBemHt80ukhuYoEZTka-_AkurCK2yLuLpDOx92ikyEgbgXREHqJAenkDRfm11jv7M37NW_FrCg5PQcDJQ==.eml";

console.log('Testing conversion of:', testEmlFile);
console.log('File exists:', fs.existsSync(testEmlFile));

if (fs.existsSync(testEmlFile)) {
  console.log('Starting conversion...');
  
  // Generate output filename with requested format
  generateOutputFilename(testEmlFile)
    .then(outputPath => {
      console.log('Output will be saved to:', outputPath);
      
      convertEmlToPdf(testEmlFile, outputPath)
        .then(() => {
          console.log('Conversion completed successfully');
          console.log('Output file:', outputPath);
          console.log('Output exists:', fs.existsSync(outputPath));
        })
        .catch((error) => {
          console.error('Conversion failed:', error);
        });
    })
    .catch((error) => {
      console.error('Error generating filename:', error);
    });
} else {
  console.log('Test EML file not found');
}
